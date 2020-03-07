
export type Session = string;

export enum ShiftTitle {
  Borderlands1 = 'mopane',
  Borderlands2 = 'willow2',
  BorderlandsTPS = 'cork',
  Borderlands3 = 'oak'
}

export enum ShiftService {
  Steam = 'steam',
  Xbox = 'xboxlive',
  PSN = 'psn',
  Epic = 'epic'
}

export interface CheckResponse {
  code: string;
  max_redeemable: number;
  amount_redeemed: number;
  start_date: string;
  end_date: string;
  offer_title_text: string;
  offer_description_text: string;
  offer_service: ShiftService;
  offer_title: ShiftTitle;
  offer_id: number;
  is_active: boolean;
}

export interface RedeemResponse {
  message: 'REDEMPTION_QUEUED' | string;
  job_id: string;
  min_wait_milliseconds: number;
  max_wait_milliseconds: number;
  max_retry_attempts: number;
  error?: {
    code: string;
    message: string;
  };
}

export interface JobResponse {
  success: boolean;
  errors: string[];
  eoc: string;
}

export type RedeemResult = Partial<CheckResponse> & JobResponse;

export interface Account {
  id: number;
  username: string;
  displayName: string;
  games: {
    title: string;
    platforms: {
      service: string;
      hardware: string;
    }[];
  }[];
}

