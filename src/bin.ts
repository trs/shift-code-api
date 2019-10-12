#!/usr/bin/env node

import {login, redeemAll} from './index';

(async () => {
  const [,, email, password, code] = process.argv;

  const session = await login({
    email,
    password
  });

  const results = await redeemAll(session, code);

  console.log(results);
  process.exit(0);
})()
  .catch((err) => {
    console.log(err);
    console.error(err.message);
    process.exit(1);
  });
