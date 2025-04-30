export interface WithdrawalRequest {
    token: string;
    recipient: string;
    amount: string;
    requestTime: number;
    approved: boolean;
  }