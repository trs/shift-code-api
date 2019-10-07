# Shift Code API

> Borderlands SHiFT code redemption library

## Install

```sh
npm install shift-code-api
```

## Usage

> WORK IN PROGRESS

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
