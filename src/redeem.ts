import { URL, URLSearchParams } from "url";
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

import { SHIFT_URL, GAME_CODE, SHIFT_TITLE } from "./const";
import { Session, RedemptionOption, RedemptionResult } from "./types";

export async function getRedemptionOptions(session: Session, code: string) {
  const url = new URL('/entitlement_offer_codes', SHIFT_URL);
  url.searchParams.set('code', code);

  const response = await fetch(url.href, {
    redirect: "manual",
    headers: {
      'x-csrt-token': session.token,
      'x-requested-with': 'XMLHttpRequest',
      'cookie': session.cookie
    }
  });
  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const text = await response.text();
  const $ = cheerio.load(text);

  const redeemOptions = $('.new_archway_code_redemption');
  if (redeemOptions.length === 0) {
    const error = text.trim();
    throw new Error(error);
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

  return options;
}

export async function submitRedemption(session: Session, option: RedemptionOption) {
  const url = new URL('/code_redemptions', SHIFT_URL);

  const params = new URLSearchParams();
  params.set('authenticity_token', option.token);
  params.set('archway_code_redemption[code]', option.code);
  params.set('archway_code_redemption[check]', option.check);
  params.set('archway_code_redemption[service]', option.service);
  params.set('archway_code_redemption[title]', option.title);

  const response = await fetch(url.href, {
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

  const statusUrl = response.headers.get('location') as string;
  return statusUrl;
}

export async function waitForRedemption(session: Session, url: string, eocCntCookie: string | null = null): Promise<string> {
  const response = await fetch(url, {
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
  const statusUrl = new URL(statusPath, SHIFT_URL).href;

  eocCntCookie = response.headers.get('set-cookie');

  await new Promise((resolve) => setTimeout(resolve, 500));

  return await waitForRedemption(session, statusUrl, eocCntCookie);
}

export async function checkRedemptionStatus(session: Session, url: string) {
  const response = await fetch(url, {
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

export async function redeem(session: Session, code: string) {
  const options = await getRedemptionOptions(session, code);

  const results: RedemptionResult[] = [];
  for (const option of options) {
    const statusUrl = await submitRedemption(session, option);
    const checkUrl = await waitForRedemption(session, statusUrl);
    const status = await checkRedemptionStatus(session, checkUrl);

    const result: RedemptionResult = {
      title: GAME_CODE[SHIFT_TITLE.indexOf(option.title)],
      service: option.service,
      status
    };
    results.push(result);
  }
  return results;
}
