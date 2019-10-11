import {URL, URLSearchParams } from 'url';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

import { SHIFT_URL } from './const';
import { Session, Credentials } from './types';

export async function getSession(): Promise<Session> {
  const url = new URL('/home', SHIFT_URL);
  const response = await fetch(url.href);
  const text = await response.text();
  const $ = cheerio.load(text);

  // Get authenticity token from head
  const token = $('meta[name=csrf-token]').attr('content');

  // Get session ID from set-cookie header
  const cookie = response.headers.get('set-cookie');
  if (!cookie) throw new Error('No set-cookie header');

  return {token, cookie};
}

export async function authenticate(session: Session, creds: Credentials): Promise<Session> {
  const url = new URL('/sessions', SHIFT_URL);

  const params = new URLSearchParams();
  params.set('authenticity_token', session.token);
  params.set('user[email]', creds.email);
  params.set('user[password]', creds.password);

  const response = await fetch(url.href, {
    headers: {
      'cookie': session.cookie
    },
    redirect: 'manual',
    method: 'POST',
    body: params
  });

  const cookie = response.headers.get('set-cookie');
  if (!cookie) {
    throw new Error('Authentication failed');
  }

  return {
    token: session.token,
    cookie
  };
}

export async function login(creds: Credentials) {
  const session = await getSession();
  return await authenticate(session, creds);
}
