import { URL } from 'url';

import { API_URL } from '../const';
import * as fetch from '../fetch';
import { Session, CheckResponse, JobResponse, RedeemResponse, RedeemResult } from '../types';
import { ShiftError } from '../error';

import createDebugger from 'debug';
const debug = createDebugger('redeem-shift');

export async function checkOffers(session: Session, code: string): Promise<CheckResponse[]> {
  const url = new URL(`code/${code}/info`, API_URL);

  debug('Code offers request', url);

  const response = await fetch.request(url.href, {
    redirect: 'manual',
    method: 'GET',
    headers: {
      origin: 'https://borderlands.com',
      'x-session': session
    }
  });

  debug('Code offers response', response.status, response.statusText);

  if (response.status !== 200) {
    throw new ShiftError({
      code: 'OFFER_FAIL',
      message: 'Failure getting code offers'
    });
  }
  
  const json: {entitlement_offer_codes: CheckResponse[]} = await response.json();

  debug('Code offers success', json);

  return json.entitlement_offer_codes;
}

async function checkJob(session: Session, code: string, jobId: string): Promise<JobResponse> {
  const url = new URL(`code/${code}/job/${jobId}`, API_URL);

  debug('Check code request', url);

  const response = await fetch.request(url.href, {
    redirect: 'manual',
    method: 'GET',
    headers: {
      origin: 'https://borderlands.com',
      'x-session': session
    }
  });

  debug('Check code response', response.status, response.statusText);

  return response.json();
}

export async function redeemOffer(session: Session, code: string, service: string): Promise<JobResponse> {
  const url = new URL(`code/${code}/redeem/${service}`, API_URL);

  debug('Redeem code request', url);

  const response = await fetch.request(url.href, {
    redirect: 'manual',
    method: 'POST',
    headers: {
      origin: 'https://borderlands.com',
      'x-session': session
    }
  });

  debug('Redeem code response', response.status, response.statusText);

  const json: RedeemResponse = await response.json();
  if (json.error) {
    throw new ShiftError(json.error);
  }
  if (response.status !== 201) {
    throw new ShiftError({
      code: response.status.toString(),
      message: response.statusText
    });
  }
  
  debug('Redeem code success', json);

  if (json.message === 'REDEMPTION_QUEUED') {
    const result = await checkJob(session, code, json.job_id);

    return result;
  }

  throw new ShiftError({
    code: 'FAIL',
    message: 'FAIL'
  });
}

export async function* redeemShiftCode(session: Session, code: string): AsyncGenerator<RedeemResult> {
  const offers = await checkOffers(session, code);

  for (const offer of offers) {
    try {
      const result = await redeemOffer(session, code, offer.offer_service);
      yield Object.assign(result, offer);
    } catch (err) {
      if (err instanceof ShiftError) {
        const error: JobResponse = {
          errors: [err.code],
          eoc: offer.code,
          success: false
        };

        yield Object.assign(error, offer);
      }
    }
  }
}
