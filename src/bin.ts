#!/usr/bin/env node

import {login, redeem} from './index';

(async () => {
  const [,, email, password, code] = process.argv;

  const session = await login(email, password);

  const results = await redeem(session, code);

  console.log(results);
  process.exit(0);
})()
  .catch((err) => {
    console.log(err);
    console.error(err.message);
    process.exit(1);
  });
