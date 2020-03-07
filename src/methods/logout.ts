import { URL } from 'url';

import * as fetch from '../fetch';
import { API_URL } from '../const';
import { Session } from '../types';

import createDebugger from 'debug';
const debug = createDebugger('logout');

export async function logout(session: Session) {
  debug('Attempting logout');

  const url = new URL('users/me', API_URL);
  const response = await fetch.request(url.href, {
    redirect: "manual",
    method: 'DELETE',
    headers: {
      origin: 'https://borderlands.com',
      'x-session': session
    }
  });

  debug('Logout response', response.status, response.statusText);

  if (response.status !== 200) {
    throw new Error(response.statusText);
  }

}