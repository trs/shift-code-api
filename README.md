# Shift Code API

> Borderlands SHiFT code redemption library

## Install

```sh
npm install shift-code-api
```

## Usage

```js
import {login, redeem} from 'shift-code-api';

(async () => {
  const session = await login({
    email: '',
    password: ''
  });

  const redeem = await redeem(session, 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX');
})();
```

## CLI

```sh
npx shift-code-api [email] [password] [code]
```
