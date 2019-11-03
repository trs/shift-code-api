import fetch from 'node-fetch';
import { RequestInit, Response } from 'node-fetch';

import createDebugger from 'debug';
const debug = createDebugger('redeem');

const DEFAULT_RETRY_INTERVAL = 30 * 1000;

function sleep(time: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export async function request(url: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(url, init);
  if (response.status === 429) { // Too Many Requests
    const retryAfterHeader = response.headers.get('retry-after');
    const delay = retryAfterHeader ? parseInt(retryAfterHeader) : DEFAULT_RETRY_INTERVAL;

    debug(`Too Many Requests: ${url}`);
    debug(`Delay: ${delay}ms`)

    await sleep(delay);
    return await request(url, init);
  }
  return response;
}
