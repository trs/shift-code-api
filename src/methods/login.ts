import { URL } from 'url';

import * as fetch from '../fetch';
import { API_URL } from '../const';
import { Session, Account } from '../types';

import createDebugger from 'debug';
const debug = createDebugger('login');

export async function login(username: string, password: string): Promise<{session: Session; account: Account}> {
  const url = new URL('users/authenticate', API_URL);

  debug('Login request', url);

  const response = await fetch.request(url.href, {
    redirect: 'manual',
    method: 'POST',
    headers: {
      origin: 'https://borderlands.com',
      referer: 'https://borderlands.com/en-US/vip/',
      host: 'api.2k.com',
      accept: 'application/json',
      'content-type': 'application/json;charset=utf-8'
    },
    body: JSON.stringify({
      username,
      password
    })
  });
  debug('Login response', response.status, response.statusText);

  if (response.status !== 200) {
    throw new Error(response.statusText);
  }

  const session = response.headers.get('x-session-set');
  if (!session) {
    throw new Error('No session set');
  }
  
  debug('Login session set', session);

  const json = await response.json();

  const account: Account = {
    username,
    displayName: json.displayName,
    id: json.shiftUserId,
    games: json.playedGames
  }

  return {
    session,
    account
  };
}
