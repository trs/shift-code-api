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
  const session = await login('email', 'password');

  const redeem = await redeem(session, 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX');
})();
```

## API

### `login(email: string, password: string) => Promise<Session>`

Create a login session to use for additional methods.

### `logout(session: Session) => Promise<void>`

Logout and invalidate the session.

### `redeem(session, code) => Promise<RedemptionResult[]>`

Redeem a SHiFT code on the account associated to the session.

### `account(session) => Promise<Account>`

Get account details

## CLI

```sh
npx shift-code-api [email] [password] [code]
```
