import { URL, URLSearchParams } from "url";
import * as cheerio from 'cheerio';

import * as fetch from './fetch';
import { SHIFT_URL, GAME_CODE, SHIFT_TITLE, SERVICE_CODE, SHIFT_SERVICE } from "./const";
import { Session, RedemptionOption, RedemptionResult, ErrorCodes } from "./types";

import createDebugger from 'debug';
const debug = createDebugger('redeem');

export async function getRedemptionOptions(session: Session, code: string): Promise<[ErrorCodes, string | RedemptionOption[]]> {
  debug('Fetching redemption options');

  const url = new URL('/entitlement_offer_codes', SHIFT_URL);
  url.searchParams.set('code', code);

  const response = await fetch.request(url.href, {
    redirect: "manual",
    headers: {
      'x-csrt-token': session.token,
      'x-requested-with': 'XMLHttpRequest',
      'cookie': session.cookie
    }
  });

  debug('Redemption options response', response.status, response.statusText);

  if (!response.ok) {
    if (response.status === 302) {
      return [ErrorCodes.LoginRequired, 'Login required'];
    }
    return [ErrorCodes.Unknown, response.statusText];
  }

  const text = await response.text();
  const $ = cheerio.load(text);

  const redeemOptions = $('.new_archway_code_redemption');
  if (redeemOptions.length === 0) {
    const error = text.trim();
    return [ErrorCodes.NoRedemptionOptions, error];
  }

  const options: RedemptionOption[] = [];

  redeemOptions.each((i, element) => {
    const token = $(element).find('input[name=authenticity_token]').val();
    const code = $(element).find('#archway_code_redemption_code').val();
    const check = $(element).find('#archway_code_redemption_check').val();
    const service = $(element).find('#archway_code_redemption_service').val();
    const title = $(element).find('#archway_code_redemption_title').val();

    options.push({
      token,
      code,
      check,
      service,
      title
    });
  });

  return [ErrorCodes.Success, options];
}

export async function submitRedemption(session: Session, option: RedemptionOption): Promise<string> {
  debug('Submitting redemption', option);

  const url = new URL('/code_redemptions', SHIFT_URL);

  const params = new URLSearchParams();
  params.set('authenticity_token', option.token);
  params.set('archway_code_redemption[code]', option.code);
  params.set('archway_code_redemption[check]', option.check);
  params.set('archway_code_redemption[service]', option.service);
  params.set('archway_code_redemption[title]', option.title);

  const response = await fetch.request(url.href, {
    method: 'POST',
    body: params,
    redirect: "manual",
    headers: {
      'x-csrt-token': session.token,
      'x-requested-with': 'XMLHttpRequest',
      'cookie': session.cookie
    }
  });

  if (response.status !== 302) {
    throw new Error(response.statusText);
  }

  const statusUrl = new URL(response.headers.get('location') as string);

  // Invalid redirect, continue with redirect and get error message
  if (!statusUrl.pathname.startsWith('/code_redemptions')) {
    const errorResponse = await fetch.request(statusUrl.href, {
      method: 'GET',
      headers: {
        'x-csrt-token': session.token,
        'x-requested-with': 'XMLHttpRequest',
        'cookie': session.cookie
      }
    });

    const text = await errorResponse.text();
    const $ = cheerio.load(text);
    const notice = $('.alert.notice');
    const status = notice.text().trim() || 'Invalid redemption option result';
    throw new Error(status);
  }

  return statusUrl.href;
}

export async function waitForRedemption(session: Session, url: string, eocCntCookie: string | null = null): Promise<string> {
  debug(`Waiting for redemption: ${url}`);

  const response = await fetch.request(url, {
    redirect: 'manual',
    headers: {
      'cookie': [session.cookie, eocCntCookie].filter(Boolean).join('; ')
    }
  });

  if (response.status === 302) {
    const checkUrl = response.headers.get('location') as string;
    return checkUrl;
  }

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const text = await response.text();
  const $ = cheerio.load(text);

  const status = $('#check_redemption_status');
  const statusPath = status.attr('data-url');
  if (!statusPath) {
    throw new Error('Invalid redemption status');
  }

  const statusUrl = statusPath ? new URL(statusPath, SHIFT_URL).href : url;

  eocCntCookie = response.headers.get('set-cookie');

  return await waitForRedemption(session, statusUrl, eocCntCookie);
}

export async function checkRedemptionStatus(session: Session, url: string) {
  debug('Getting redemption status');

  const response = await fetch.request(url, {
    headers: {
      'cookie': session.cookie
    }
  });
  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const text = await response.text();
  const $ = cheerio.load(text);

  const notice = $('.notice');
  const status = notice.text().trim();
  return status;
}

export async function redeemOption(session: Session, option: RedemptionOption) {
  const statusUrl = await submitRedemption(session, option);
  const checkUrl = await waitForRedemption(session, statusUrl);
  const status = await checkRedemptionStatus(session, checkUrl);

  const error = (() => {
    if (/Your code was successfully redeemed/i.test(status)) return ErrorCodes.Success;
    else return ErrorCodes.Unknown;
  })();

  const result: RedemptionResult = {
    code: option.code,
    title: GAME_CODE[SHIFT_TITLE.indexOf(option.title)],
    service: SERVICE_CODE[SHIFT_SERVICE.indexOf(option.service)],
    status,
    error
  };
  return result;
}

export async function redeem(session: Session, code: string, ...services: string[]) {
  const [error, status] = await getRedemptionOptions(session, code);
  if (error !== ErrorCodes.Success) {
    return [{
      code,
      error,
      status: status as string
    }];
  }

  let options = status as RedemptionOption[];
  if (services.length > 0) {
    options = options.filter(({service}) => services.includes(service));
  }

  const results: RedemptionResult[] = [];
  for (const option of options) {
    const result = await redeemOption(session, option);
    results.push(result);
  }
  return results;
}
