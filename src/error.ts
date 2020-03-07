export enum ErrorCode {
  Success = 'Success',
  LoginRequired = 'LoginRequired',
  NoRedemptionOptions = 'NoRedemptionOptions',
  CodeNotAvailable = 'CodeNotAvailable',
  LaunchGame = 'LaunchGame',
  AlreadyRedeemed = 'AlreadyRedeemed',
  Unknown = 'Unknown'
}

interface ErrorBuilder {
  code: ErrorCode | string;
  message: string;
}

export class ShiftError extends Error {
  public code: ErrorCode | string;
  public message: string;

  constructor(error: ErrorBuilder) {
    super();

    this.code = error.code;
    this.message = error.message;
  }
}