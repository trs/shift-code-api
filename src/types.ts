
export interface Session {
  token: string;
  cookie: string;
}

export interface Account {
  email: string;
  name: string;
  id: string;
}

export interface RedemptionOption {
  token: string;
  code: string;
  check: string;
  service: string;
  title: string;
}

export interface RedemptionResult {
  code: string;
  status: string;
  error: ErrorCodes;
  title?: string;
  service?: string;
}

export enum ErrorCodes {
  Success = 'Success',
  LoginRequired = 'LoginRequired',
  NoRedemptionOptions = 'NoRedemptionOptions',
  CodeNotAvailable = 'CodeNotAvailable',
  LaunchGame = 'LaunchGame',
  Unknown = 'Unknown'
}