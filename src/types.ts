
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
  title: string;
  service: string;
  status: string;
}
