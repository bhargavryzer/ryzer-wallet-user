// export enum WalletType {
//     CustodialCore = 0,
//     CustodialAdvanced = 1,
//     MPC = 2,
//     Smart = 3
// }

export enum WalletType {
    Custodial = 0,
    MPC = 1,
    Smart = 2
}

export interface MetaTransaction {
    from: string;
    to: string;
    value: string;
    data: string;
    nonce: number;
    expiry: number;
}

export interface WithdrawalRequest {
    token: string;
    recipient: string;
    amount: string;
    requestTime: number;
    approved: boolean;
    isCrossChain: boolean;
    targetChainId: string;
    bridgeNonce: number;
}

export interface WalletInfo {
    owner: string;
    walletType: WalletType;
    isRegistered: boolean;
}

export interface ContractAddresses {
    factory: string;
    registry: string;
}

export interface MPCConfig {
    owners: string[];
    threshold: number;
}

export interface SmartWalletConfig {
    admin: string;
    guardians?: string[];
    requiredGuardians?: number;
}

export interface CustodialConfig {
    owner: string;
    coldStorage: string;
}