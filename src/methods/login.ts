import { URL, URLSearchParams } from 'url';
import * as cheerio from 'cheerio';

import * as fetch from '../fetch';
import { SHIFT_URL } from '../const';
import { Session } from '../types';

import createDebugger from 'debug';
const debug = createDebugger('login');

export async function getSession(): Promise<Session> {
  debug('Requesting session');
  
  const url = new URL('/home', SHIFT_URL);
  const response = await fetch.request(url.href);
  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const text = await response.text();
  const $ = cheerio.load(text);

  // Get authenticity token from head
  const token = $('meta[name=csrf-token]').attr('content');
  if (!token) throw new Error('Token content not found');

  debug(`Session token: ${token}`);

  // Get session ID from set-cookie header
  const cookie = response.headers.get('set-cookie');
  if (!cookie) throw new Error('No set-cookie header');

  debug(`Session cookie: ${cookie}`);

  return {token, cookie};
}

export async function login(email: string, password: string): Promise<Session> {
  const session = await getSession();

  debug('Authenticating', email);

  const url = new URL('/sessions', SHIFT_URL);

  const params = new URLSearchParams();
  params.set('authenticity_token', session.token);
  params.set('user[email]', email);
  params.set('user[password]', password);

  const response = await fetch.request(url.href, {
    headers: {
      'cookie': session.cookie
    },
    redirect: 'manual',
    method: 'POST',
    body: params
  });

  debug('Authentication response', response.statusText, response.statusText);

  if (response.status !== 302) {
    throw new Error(response.statusText);
  }

  const location = response.headers.get('location');
  if (!location || !location.endsWith('/account')) {
    throw new Error('Authentication failed');
  }

  const cookie = response.headers.get('set-cookie');
  if (!cookie) {
    throw new Error('Authentication failed');
  }

  debug('Authentication successful');

  return {
    token: session.token,
    cookie
  };
}