
export interface Session {
  token: string;
  cookie: string;
}

export interface Credentials {
  email: string;
  password: string;
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
  success: boolean;
  title?: string;
  service?: string;
}

export enum ErrorCodes {
  Success = 'Success',
  LoginRequired = 'LoginRequired',
  NoRedemptionOptions = 'NoRedemptionOptions',
  CodeNotAvailable = 'CodeNotAvailable',
  Unknown = 'Unknown'
}