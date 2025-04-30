import { ethers } from 'ethers';
import { Contract } from 'ethers';
import { WalletType, MetaTransaction, WithdrawalRequest, WalletInfo, ContractAddresses, MPCConfig, SmartWalletConfig, CustodialConfig } from './types';
import RyzerFactoryABI from "./ABIS/RyzerFactory.abi.json";
import WalletRegistryABI from "./ABIS/WalletRegistry.abi.json";
import MPCWalletABI from "./ABIS/MPCWallet.abi.json";
import SmartWalletABI from "./ABIS/SmartWallet.abi.json";
import CustodialWalletAdv from "./ABIS/CustodialWalletAdvanced.abi.json";
import CustodialWalletCore from "./ABIS/CustodialWalletCore.abi.json";
import ERC20ABI from "./ABIS/ERC20.abi.json";

/**
 * WalletService class to interact with the Ryzer wallet system
 */
export class WalletService {
    private provider: ethers.providers.Provider;
    private signer: ethers.Signer;
    private factory: Contract;
    private registry: Contract;
    private custodialImpl: string;
    private mpcImpl: string;
    private smartImpl: string;

    constructor(
        provider: ethers.providers.Provider,
        signer: ethers.Signer,
        addresses: ContractAddresses
    ) {
        this.provider = provider;
        this.signer = signer;
        this.factory = new Contract(addresses.factory, RyzerFactoryABI, signer);
        this.registry = new Contract(addresses.registry, WalletRegistryABI, signer);
        this.custodialImpl = '';
        this.mpcImpl = '';
        this.smartImpl = '';
    }

    /**
     * Initializes implementation addresses from the factory
     */
    async initialize(): Promise<void> {
        const [custodialCoreImpl, custodialAdvancedImpl, mpcImpl, smartImpl] = await this.factory.getImplementations();
        this.custodialImpl = custodialCoreImpl; // Default to Core implementation
        this.mpcImpl = mpcImpl;
        this.smartImpl = smartImpl;
    }

    /**
     * Gets a wallet contract instance based on type
     */
    private getWalletContract(walletAddress: string, walletType: WalletType): Contract {
        let abi: any[];
        switch (walletType) {
            case WalletType.Custodial:
                abi = CustodialWalletCore;
                break;
            case WalletType.MPC:
                abi = MPCWalletABI;
                break;
            case WalletType.Smart:
                abi = SmartWalletABI;
                break;
            default:
                throw new Error('Invalid wallet type');
        }
        return new Contract(walletAddress, abi, this.signer);
    }

    // Factory Methods
    /**
     /**
 * Creates a custodial wallet
 * @param walletType The type of wallet (must be WalletType.Custodial)
 * @param owner The wallet owner address
 * @param salt A unique salt for the wallet
 * @returns The created wallet address
 */
async createCustodialWallet(walletType: WalletType, owner: string, salt: string): Promise<string> {
    if (owner === ethers.constants.AddressZero || owner.length !== 42) throw new Error('Invalid owner address');
    if (walletType !== WalletType.Custodial) throw new Error('Only WalletType.Custodial is supported by this method');

    // For Custodial wallet, use owner as both owner and cold storage (as per CustodialCore logic)
    const selector = ethers.utils.hexDataSlice(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("initialize(address,address)")), 0, 4);
    const encodedData = ethers.utils.defaultAbiCoder.encode(['address', 'address'], [owner, owner]);
    const initData = selector + encodedData.slice(2); // Concatenate selector and encoded data (remove 0x prefix from encodedData)

    // Call createWallet with bridgeAddress as zero since it's not needed for Custodial
    const bridgeAddress = ethers.constants.AddressZero;
    const tx = await this.factory.createWallet(walletType, owner, bridgeAddress, salt);
    const receipt = await tx.wait();
    const event = receipt.events?.find((e: any) => e.event === 'WalletCreated');
    if (!event) throw new Error('WalletCreated event not found');
    return event.args.wallet as string;
}
   


    /**
 * Creates a custodial wallet and registers it with a given name
 * @param walletName The off-chain name of the wallet
 * @param walletType The type of custodial wallet (must be WalletType.Custodial)
 * @param salt A unique salt for the wallet
 * @returns The created wallet address
 */
async createAndRegisterCustodialWallet(walletName: string, walletType: WalletType, salt: string): Promise<string> {
    const owner = await this.signer.getAddress();
    const walletAddress = await this.createCustodialWallet(walletType, owner, salt);
    await this.registerWallet(walletAddress, owner, walletType);
    this.storeWalletName(walletAddress, walletName);
    return walletAddress;
}

    // Hypothetical method to store wallet name off-chain
    private storeWalletName(walletAddress: string, walletName: string): void {
        const walletNames = JSON.parse(localStorage.getItem('walletNames') || '{}');
        walletNames[walletAddress] = walletName;
        localStorage.setItem('walletNames', JSON.stringify(walletNames));
    }

    /**
     * Retrieves the off-chain wallet name
     */
    getWalletName(walletAddress: string): string {
        const walletNames = JSON.parse(localStorage.getItem('walletNames') || '{}');
        return walletNames[walletAddress] || 'Unnamed Wallet';
    }

    /**
     * Creates an MPC wallet
     */
    async createMPCWallet(config: MPCConfig, salt: string): Promise<string> {
        const tx = await this.factory.createMPCWallet(config.owners, config.threshold, salt);
        const receipt = await tx.wait();
        const event = receipt.events?.find((e: any) => e.event === 'WalletCreated');
        if (!event) throw new Error('WalletCreated event not found');
        return event.args.wallet as string;
    }

    /**
     * Creates a smart wallet
     */
    async createSmartWallet(config: SmartWalletConfig, salt: string): Promise<string> {
        const selector = ethers.utils.hexDataSlice(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("initialize(address)")), 0, 4);
        const encodedData = ethers.utils.defaultAbiCoder.encode(['address'], [config.admin]);
        const initData = selector + encodedData.slice(2); // Concatenate selector and encoded data
        const tx = await this.factory.createWalletWithInitData(WalletType.Smart, config.admin, salt, initData);
        const receipt = await tx.wait();
        const event = receipt.events?.find((e: any) => e.event === 'WalletCreated');
        if (!event) throw new Error('WalletCreated event not found');
        return event.args.wallet as string;
    }

    /**
     * Creates a smart wallet with guardians
     */
    async createSmartWalletWithGuardians(config: SmartWalletConfig, salt: string): Promise<string> {
        const wallet = await this.createSmartWallet(config, salt);
        const walletContract = this.getWalletContract(wallet, WalletType.Smart);
        if (config.guardians && config.guardians.length > 0) {
            for (const guardian of config.guardians) {
                const tx = await walletContract.addGuardian(guardian);
                await tx.wait();
            }
            if (config.requiredGuardians !== undefined) {
                const tx = await walletContract.setRequiredGuardians(config.requiredGuardians);
                await tx.wait();
            }
        }
        return wallet;
    }

    /**
     * Predicts a wallet address
     */
    async predictWalletAddress(implementation: string, salt: string): Promise<string> {
        return await this.factory.predictWalletAddress(implementation, salt);
    }

    /**
     * Updates the implementation for a wallet type
     */
    async setImplementation(walletType: WalletType, implementation: string): Promise<void> {
        const tx = await this.factory.setImplementation(walletType, implementation);
        await tx.wait();
    }

    /**
     * Updates the registry address
     */
    async setRegistry(newRegistry: string): Promise<void> {
        const tx = await this.factory.setRegistry(newRegistry);
        await tx.wait();
    }

    // Registry Methods
    /**
     * Registers a wallet
     */
    async registerWallet(wallet: string, owner: string, walletType: WalletType): Promise<void> {
        const tx = await this.registry.registerWallet(wallet, owner, walletType);
        await tx.wait();
    }

    /**
     * Registers multiple wallets
     */
    async bulkRegisterWallets(wallets: string[], owners: string[], walletTypes: WalletType[]): Promise<void> {
        const tx = await this.registry.bulkRegisterWallets(wallets, owners, walletTypes);
        await tx.wait();
    }

    /**
     * Deregisters a wallet
     */
    async deregisterWallet(wallet: string): Promise<void> {
        const tx = await this.registry.deregisterWallet(wallet);
        await tx.wait();
    }

    /**
     * Updates a wallet's owner
     */
    async updateWalletOwner(wallet: string, newOwner: string): Promise<void> {
        const tx = await this.registry.updateWalletOwner(wallet, newOwner);
        await tx.wait();
    }

    /**
     * Gets wallet information
     */
    async getWalletInfo(wallet: string): Promise<WalletInfo> {
        return await this.registry.getWalletInfo(wallet);
    }

    /**
     * Gets wallets by owner
     */
    async getWalletsByOwner(owner: string): Promise<string[]> {
        return await this.registry.getWalletsByOwner(owner);
    }

    /**
     * Gets the total number of registered wallets
     */
    async getRegisteredWalletCount(): Promise<number> {
        return await this.registry.getRegisteredWalletCount();
    }

    /**
     * Checks if a wallet is registered
     */
    async isWalletRegistered(wallet: string): Promise<boolean> {
        return await this.registry.isWalletRegistered(wallet);
    }

    // Common Wallet Methods
    /**
     * Deposits tokens into a wallet
     */
    async deposit(walletAddress: string, token: string, amount: string, walletType: WalletType): Promise<void> {
        const wallet = this.getWalletContract(walletAddress, walletType);
        if (token === ethers.constants.AddressZero) {
            const tx = await wallet.deposit(token, amount, { value: amount });
            await tx.wait();
        } else {
            const tokenContract = new Contract(token, ERC20ABI, this.signer);
            const allowance = await tokenContract.allowance(await this.signer.getAddress(), walletAddress);
            if (allowance.lt(amount)) {
                const approveTx = await tokenContract.approve(walletAddress, amount);
                await approveTx.wait();
            }
            const tx = await wallet.deposit(token, amount);
            await tx.wait();
        }
    }

    /**
     * Withdraws tokens from a wallet
     */
    async withdraw(walletAddress: string, token: string, amount: string, walletType: WalletType): Promise<void> {
        if (walletType === WalletType.MPC) throw new Error('Withdraw not supported for MPC wallet');
        const wallet = this.getWalletContract(walletAddress, walletType);
        const tx = await wallet.withdraw(token, amount);
        await tx.wait();
    }

    /**
     * Executes an external call
     */
    async executeExternalCall(walletAddress: string, to: string, value: string, data: string, walletType: WalletType): Promise<void> {
        const wallet = this.getWalletContract(walletAddress, walletType);
        const tx = await wallet.executeExternalCall(to, value, data);
        await tx.wait();
    }

    /**
     * Reimburses gas costs
     */
    async reimburseGas(walletAddress: string, recipient: string, amount: string, walletType: WalletType): Promise<void> {
        const wallet = this.getWalletContract(walletAddress, walletType);
        const tx = await wallet.reimburseGas(recipient, amount);
        await tx.wait();
    }

    /**
     * Pauses a wallet
     */
    async pause(walletAddress: string, walletType: WalletType): Promise<void> {
        const wallet = this.getWalletContract(walletAddress, walletType);
        const tx = await wallet.pause();
        await tx.wait();
    }

    /**
     * Unpauses a wallet
     */
    async unpause(walletAddress: string, walletType: WalletType): Promise<void> {
        const wallet = this.getWalletContract(walletAddress, walletType);
        const tx = await wallet.unpause();
        await tx.wait();
    }

    /**
     * Activates emergency stop
     */
    async emergencyStop(walletAddress: string, walletType: WalletType): Promise<void> {
        const wallet = this.getWalletContract(walletAddress, walletType);
        const tx = await wallet.emergencyStop();
        await tx.wait();
    }

    /**
     * Lifts emergency stop
     */
    async liftEmergencyStop(walletAddress: string, walletType: WalletType): Promise<void> {
        const wallet = this.getWalletContract(walletAddress, walletType);
        const tx = await wallet.liftEmergencyStop();
        await tx.wait();
    }

    // MPC Wallet Specific Methods
    /**
     * Executes a multi-signature transaction
     */
    async executeMPCTransaction(walletAddress: string, to: string, value: string, data: string, signatures: string[], nonce: number): Promise<void> {
        const wallet = this.getWalletContract(walletAddress, WalletType.MPC);
        const tx = await wallet.execute(to, value, data, signatures, nonce);
        await tx.wait();
    }

    /**
     * Adds a guardian to an MPC wallet
     */
    async addMPCGuardian(walletAddress: string, guardian: string): Promise<void> {
        const wallet = this.getWalletContract(walletAddress, WalletType.MPC);
        const tx = await wallet.addGuardian(guardian);
        await tx.wait();
    }

    // Custodial Wallet Specific Methods
    /**
     * Requests a withdrawal from a custodial wallet
     */
    async requestWithdrawal(walletAddress: string, request: WithdrawalRequest): Promise<void> {
        const wallet = this.getWalletContract(walletAddress, WalletType.Custodial);
        const tx = await wallet.requestWithdrawal(
            request.token,
            request.amount,
            request.recipient,
            request.isCrossChain,
            request.targetChainId
        );
        await tx.wait();
    }

    /**
     * Approves a withdrawal request
     */
    async approveWithdrawal(walletAddress: string, requestId: string): Promise<void> {
        const wallet = this.getWalletContract(walletAddress, WalletType.Custodial);
        const tx = await wallet.approveWithdrawal(requestId);
        await tx.wait();
    }

    // Smart Wallet Specific Methods
    /**
     * Adds a guardian to a smart wallet
     */
    async addSmartGuardian(walletAddress: string, guardian: string): Promise<void> {
        const wallet = this.getWalletContract(walletAddress, WalletType.Smart);
        const tx = await wallet.addGuardian(guardian);
        await tx.wait();
    }

    /**
     * Initiates recovery for a smart wallet
     */
    async initiateSmartRecovery(walletAddress: string, newOwner: string): Promise<void> {
        const wallet = this.getWalletContract(walletAddress, WalletType.Smart);
        const tx = await wallet.initiateRecovery(newOwner);
        await tx.wait();
    }

    // Cross-Chain Methods
    /**
     * Locks tokens for cross-chain transfer
     */
    async lockTokens(walletAddress: string, token: string, amount: string, recipient: string, chainId: string, nonce: number, walletType: WalletType): Promise<void> {
        const wallet = this.getWalletContract(walletAddress, walletType);
        const tx = await wallet.lockTokens(token, amount, recipient, chainId, nonce);
        await tx.wait();
    }

    // Update the encodeCustodialInitData function to handle both Core and Advanced wallets
    private encodeCustodialInitData(owner: string, coldStorageOrBridge: string, walletType: WalletType): string {
        if (!owner || owner === ethers.constants.AddressZero) {
            throw new Error('Invalid owner address');
        }
        if (walletType === WalletType.CustodialCore) {
            if (!coldStorageOrBridge || coldStorageOrBridge === ethers.constants.AddressZero) {
                throw new Error('Invalid cold storage address');
            }
            const selector = ethers.utils.hexDataSlice(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("initialize(address,address)")), 0, 4);
            const encodedData = ethers.utils.defaultAbiCoder.encode(['address', 'address'], [owner, coldStorageOrBridge]);
            return selector + encodedData.slice(2); // Concatenate selector and encoded data
        } else if (walletType === WalletType.CustodialAdvanced) {
            if (!coldStorageOrBridge || coldStorageOrBridge === ethers.constants.AddressZero) {
                throw new Error('Invalid bridge address for CustodialAdvanced wallet');
            }
            const selector = ethers.utils.hexDataSlice(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("initialize(address,address,address)")), 0, 4);
            const encodedData = ethers.utils.defaultAbiCoder.encode(['address', 'address', 'address'], [owner, owner, coldStorageOrBridge]);
            return selector + encodedData.slice(2); // Concatenate selector and encoded data
        }
        throw new Error('Invalid wallet type for custodial wallet initialization');
    }

    private encodeSmartInitData(admin: string): string {
        if (!admin) {
            throw new Error('Invalid admin address');
        }
        const selector = ethers.utils.hexDataSlice(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("initialize(address)")), 0, 4);
        const encodedData = ethers.utils.defaultAbiCoder.encode(['address'], [admin]);
        return selector + encodedData.slice(2); // Concatenate selector and encoded data
    }
}