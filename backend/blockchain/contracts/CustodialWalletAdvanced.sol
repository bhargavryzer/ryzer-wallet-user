// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import "@openzeppelin/contracts-upgradeable@5.0.2/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable@5.0.2/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable@5.0.2/utils/cryptography/EIP712Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts@5.0.2/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts@5.0.2/utils/Address.sol";
import "./CustodialWalletCore.sol";
import "./WalletUtils.sol";

interface ICrossChainBridge {
    function burnTokens(address token, uint256 amount, address recipient, bytes32 chainId, uint256 nonce) external;
}

/// @title CustodialWalletAdvanced - Advanced custodial wallet features
/// @notice Manages cross-chain withdrawals, meta-transactions, and upgrades
/// @dev Inherits from CustodialWalletCore, uses UUPS proxy
/// @custom:security-contact security@x.ai
contract CustodialWalletAdvanced is CustodialWalletCore, UUPSUpgradeable, EIP712Upgradeable {
    using WalletUtils for address;
    using ECDSA for bytes32;
    using Address for address;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    bytes32 private constant META_TX_TYPEHASH = keccak256(
        "MetaTransaction(address from,address to,uint256 value,bytes data,uint256 nonce,uint256 expiry,bytes32 chainId)"
    );

    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    bytes32 public constant BRIDGE_MANAGER_ROLE = keccak256("BRIDGE_MANAGER_ROLE");

    struct Proposal {
        address target;
        address token;
        address recipient;
        uint256 amount;
        uint48 proposedAtBlock;
        bool executed;
        uint8 proposalType; // 1: Upgrade, 2: ColdStorage, 3: Recovery, 4: Bridge
    }

    struct CrossChainRequest {
        bytes32 targetChainId;
        uint256 bridgeNonce;
    }
    
    struct MetaTransaction {
        address from;
        address to;
        uint256 value;
        bytes data;
        uint256 nonce;
        uint256 expiry;
        uint256 gasLimit;
    }

    mapping(bytes32 => CrossChainRequest) private _crossChainRequests;
    mapping(bytes32 => Proposal) private _proposals;
    mapping(address => mapping(uint256 => bool)) private _usedNonces;
    address private _bridgeAddress;
    uint48 private _timelockBlocks;
    uint48 private _refundTimeoutBlocks;
    bytes32 private _chainId;
    uint256 private _proposalCount;

    uint48 internal constant DEFAULT_TIMELOCK_BLOCKS = 14400; // ~2 days at 12s/block
    uint48 internal constant DEFAULT_REFUND_TIMEOUT_BLOCKS = 50400; // ~7 days
    uint256 internal constant MAX_PROPOSALS = 100;
    uint256 internal constant MAX_GAS_LIMIT = 2_000_000;

    event CrossChainWithdrawalRequested(
        bytes32 indexed requestId,
        address indexed user,
        address indexed token,
        uint256 amount,
        address recipient,
        bytes32 targetChainId,
        uint256 bridgeNonce
    );
    event ProposalCreated(
        bytes32 indexed proposalId,
        uint8 proposalType,
        address indexed target,
        address indexed token,
        address recipient,
        uint256 amount
    );
    event ProposalExecuted(bytes32 indexed proposalId, uint8 proposalType, address indexed target);
    event MetaTransactionExecuted(address indexed user, address indexed relayer, bytes32 indexed txHash, uint256 nonce);
    event BridgeAddressUpdated(address indexed oldBridge, address indexed newBridge);
    event RefundTimeoutUpdated(uint48 oldTimeout, uint48 newTimeout);
    event ManualRefundProcessed(bytes32 indexed requestId, address indexed recipient, address indexed token, uint256 amount);
    event NonceInvalidated(address indexed user, uint256 nonce);

    error InvalidImplementation(address target);
    error TimelockNotElapsed(bytes32 proposalId);
    error ProposalNotFound(bytes32 proposalId);
    error ProposalAlreadyExecuted(bytes32 proposalId);
    error InvalidSignature(address signer);
    error MetaTxExpired(uint256 expiry);
    error NonceUsed(uint256 nonce);
    error InvalidBridgeAddress(address bridge);
    error CrossChainOperationFailed(bytes reason);
    error RefundTimeoutNotElapsed(bytes32 requestId);
    error InvalidRefundTimeout(uint48 timeout);
    error TooManyProposals(uint256 count);
    error GasLimitTooHigh(uint256 gasLimit);
    error RoleConflict(address account);
    error InvalidProposalType(uint8 proposalType);
    error InvalidTargetContract(address target);
    error ExternalCallFailed(address target, bytes data);

    function initialize(address admin_, address coldStorageAddress_, address bridgeAddress_) public initializer {
        if (bridgeAddress_ == address(0)) revert InvalidBridgeAddress(bridgeAddress_);

        super.initialize(admin_, coldStorageAddress_);
        __UUPSUpgradeable_init();
        __EIP712_init("CustodialWallet", "1.0");

        _grantRole(UPGRADER_ROLE, admin_);
        _grantRole(RELAYER_ROLE, admin_);
        _grantRole(BRIDGE_MANAGER_ROLE, admin_);

        if (hasRole(RELAYER_ROLE, admin_) && hasRole(DEFAULT_ADMIN_ROLE, admin_)) {
            _revokeRole(RELAYER_ROLE, admin_);
        }

        _bridgeAddress = bridgeAddress_;
        _timelockBlocks = DEFAULT_TIMELOCK_BLOCKS;
        _refundTimeoutBlocks = DEFAULT_REFUND_TIMEOUT_BLOCKS;
        _chainId = bytes32(block.chainid);
        _version = "5.2.0"; // Update inherited _version

        emit BridgeAddressUpdated(address(0), bridgeAddress_);
    }

    /// @notice Requests a withdrawal, optionally for cross-chain transfer
    /// @param token The token to withdraw (address(0) for native token)
    /// @param amount The amount to withdraw
    /// @param recipient The recipient of the withdrawal
    /// @param isCrossChain Whether the withdrawal is cross-chain
    /// @param targetChainId The target chain ID for cross-chain withdrawals
    /// @return requestId The ID of the withdrawal request
    function requestWithdrawal(
        address token,
        uint256 amount,
        address recipient,
        bool isCrossChain,
        bytes32 targetChainId
    ) external nonReentrant whenNotPaused whenNotEmergencyStopped returns (bytes32 requestId) {
        if (isCrossChain && token == address(0)) revert InvalidTokenAddress(token);
        // Call the internal _requestWithdrawalCore function from the parent
        requestId = _requestWithdrawalCore(token, amount, recipient);
        if (isCrossChain) {
            uint256 bridgeNonce = uint256(keccak256(abi.encode(msg.sender, block.timestamp, _chainId)));
            _crossChainRequests[requestId] = CrossChainRequest({
                targetChainId: targetChainId,
                bridgeNonce: bridgeNonce
            });
            emit CrossChainWithdrawalRequested(requestId, msg.sender, token, amount, recipient, targetChainId, bridgeNonce);
        }
    }

    function executeWithdrawal(bytes32 requestId) external override nonReentrant whenNotPaused whenNotEmergencyStopped onlyRole(CUSTODIAN_ROLE) {
        CrossChainRequest memory ccRequest = _crossChainRequests[requestId];
        WithdrawalRequest memory request = _withdrawalRequests[requestId];
        if (request.requestTime == 0) revert InvalidWithdrawalRequest(requestId);
        if (!request.approved) revert WithdrawalNotApproved(requestId);

        WithdrawalPolicy storage policy = _withdrawalPolicies[request.token];
        uint48 totalDelay = _withdrawalDelay + (policy.extraTimelock != 0 && request.amount > policy.maxWithdrawalLimit ? policy.extraTimelock : 0);
        if (block.timestamp < request.requestTime + totalDelay) revert WithdrawalDelayNotElapsed(requestId);

        uint256 transferAmount = request.token.denormalizeAmount(request.amount);
        delete _withdrawalRequests[requestId];
        delete _crossChainRequests[requestId];

        if (ccRequest.targetChainId != bytes32(0)) {
            IERC20Upgradeable(request.token).safeApprove(_bridgeAddress, transferAmount);
            try ICrossChainBridge(_bridgeAddress).burnTokens(request.token, transferAmount, request.recipient, ccRequest.targetChainId, ccRequest.bridgeNonce) {
                emit Withdrawal(msg.sender, request.token, transferAmount, request.recipient);
            } catch (bytes memory reason) {
                IERC20Upgradeable(request.token).safeApprove(_bridgeAddress, 0);
                revert CrossChainOperationFailed(reason);
            }
            IERC20Upgradeable(request.token).safeApprove(_bridgeAddress, 0);
        } else {
            request.token.transferToken(request.recipient, transferAmount, address(this));
            emit Withdrawal(msg.sender, request.token, transferAmount, request.recipient);
        }
    }

    function refundCrossChainWithdrawal(bytes32 requestId) external nonReentrant whenNotPaused whenNotEmergencyStopped onlyRole(CUSTODIAN_ROLE) {
        CrossChainRequest memory ccRequest = _crossChainRequests[requestId];
        if (ccRequest.targetChainId == bytes32(0)) revert CrossChainOperationFailed("Not cross-chain");
        WithdrawalRequest memory request = _withdrawalRequests[requestId];
        if (request.requestTime == 0) revert InvalidWithdrawalRequest(requestId);
        if (block.number < request.requestTime + _refundTimeoutBlocks) revert RefundTimeoutNotElapsed(requestId);

        uint256 transferAmount = request.token.denormalizeAmount(request.amount);
        delete _withdrawalRequests[requestId];
        delete _crossChainRequests[requestId];

        request.token.transferToken(request.recipient, transferAmount, address(this));
        emit ManualRefundProcessed(requestId, request.recipient, request.token, transferAmount);
    }

    function executeMetaTransaction(MetaTransaction memory metaTx, bytes memory signature)
        external
        nonReentrant
        whenNotPaused
        whenNotEmergencyStopped
        onlyRole(RELAYER_ROLE)
        returns (bool success, bytes memory result)
    {
        if (!_kycVerified[metaTx.from]) revert KycNotVerified(metaTx.from);
        if (metaTx.expiry != 0 && block.timestamp > metaTx.expiry) revert MetaTxExpired(metaTx.expiry);
        if (_usedNonces[metaTx.from][metaTx.nonce]) revert NonceUsed(metaTx.nonce);
        if (metaTx.to == address(0)) revert InvalidTargetContract(metaTx.to);
        if (metaTx.gasLimit > MAX_GAS_LIMIT) revert GasLimitTooHigh(metaTx.gasLimit);

        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    META_TX_TYPEHASH,
                    metaTx.from,
                    metaTx.to,
                    metaTx.value,
                    keccak256(metaTx.data),
                    metaTx.nonce,
                    metaTx.expiry,
                    _chainId
                )
            )
        );

        address signer = digest.recover(signature);
        if (signer != metaTx.from) revert InvalidSignature(signer);

        _usedNonces[metaTx.from][metaTx.nonce] = true;
        emit NonceInvalidated(metaTx.from, metaTx.nonce);

        (success, result) = metaTx.to.call{value: metaTx.value, gas: metaTx.gasLimit}(metaTx.data);
        if (!success) revert ExternalCallFailed(metaTx.to, metaTx.data);

        emit MetaTransactionExecuted(metaTx.from, msg.sender, digest, metaTx.nonce);
    }

    function proposeChange(
        address target,
        address token,
        address recipient,
        uint256 amount,
        uint8 proposalType
    ) external returns (bytes32 proposalId) {
        if (proposalType == 1) {
            if (!hasRole(UPGRADER_ROLE, msg.sender)) revert Unauthorized(msg.sender, UPGRADER_ROLE);
            if (target == address(0)) revert InvalidImplementation(target);
        } else if (proposalType == 2 || proposalType == 4) {
            if (!hasRole(proposalType == 4 ? BRIDGE_MANAGER_ROLE : DEFAULT_ADMIN_ROLE, msg.sender)) {
                revert Unauthorized(msg.sender, proposalType == 4 ? BRIDGE_MANAGER_ROLE : DEFAULT_ADMIN_ROLE);
            }
            if (target == address(0) || (proposalType == 4)) revert InvalidImplementation(target);
        } else if (proposalType == 3) {
            if (!hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) revert Unauthorized(msg.sender, DEFAULT_ADMIN_ROLE);
            token.validateToken();
            if (recipient == address(0)) revert InvalidAddress(recipient, "Invalid recipient");
            uint256 transferAmount = token.normalizeAmount(amount);
            token.validateBalance(transferAmount, address(this));
        } else {
            revert InvalidProposalType(proposalType);
        }

        if (_proposalCount >= MAX_PROPOSALS) revert TooManyProposals(_proposalCount);

        proposalId = keccak256(abi.encode(msg.sender, target, token, recipient, amount, block.number, proposalType));
        Proposal storage proposal = _proposals[proposalId];
        if (proposal.proposedAtBlock != 0) revert ProposalAlreadyExecuted(proposalId);

        proposal.target = target;
        proposal.token = token;
        proposal.recipient = recipient;
        proposal.amount = amount;
        proposal.proposedAtBlock = uint48(block.number);
        proposal.executed = false;
        proposal.proposalType = proposalType;
        _proposalCount++;

        emit ProposalCreated(proposalId, proposalType, target, token, recipient, amount);
    }

    function executeChange(bytes32 proposalId) external {
        Proposal storage proposal = _proposals[proposalId];
        if (proposal.proposedAtBlock == 0) revert ProposalNotFound(proposalId);
        if (proposal.executed) revert ProposalAlreadyExecuted(proposalId);
        if (block.number < proposal.proposedAtBlock + _timelockBlocks) revert TimelockNotElapsed(proposalId);

        bytes32 requiredRole = proposal.proposalType == 1 ? UPGRADER_ROLE :
                              proposal.proposalType == 4 ? BRIDGE_MANAGER_ROLE : DEFAULT_ADMIN_ROLE;
        if (!hasRole(requiredRole, msg.sender)) revert Unauthorized(msg.sender, requiredRole);

        proposal.executed = true;
        _proposalCount--;

        if (proposal.proposalType == 1) {
            _authorizeUpgrade(proposal.target);
        } else if (proposal.proposalType == 2) {
            _setColdStorageAddress(proposal.target);
        } else if (proposal.proposalType == 3) {
            uint256 transferAmount = proposal.token.denormalizeAmount(proposal.amount);
            proposal.token.transferToken(proposal.recipient, transferAmount, address(this));
        } else if (proposal.proposalType == 4) {
            address oldBridge = _bridgeAddress;
            _bridgeAddress = proposal.target;
            emit BridgeAddressUpdated(oldBridge, proposal.target);
        }

        emit ProposalExecuted(proposalId, proposal.proposalType, proposal.target);
        delete _proposals[proposalId];
    }

    function setRefundTimeout(uint48 newTimeout) external onlyRole(DEFAULT_ADMIN_ROLE) whenNotPaused whenNotEmergencyStopped {
        if (newTimeout < 7200 || newTimeout > 216000) revert InvalidRefundTimeout(newTimeout);
        uint48 oldTimeout = _refundTimeoutBlocks;
        _refundTimeoutBlocks = newTimeout;
        emit RefundTimeoutUpdated(oldTimeout, newTimeout);
    }

    function _authorizeUpgrade(address newImplementation) internal view override onlyRole(UPGRADER_ROLE) {
        if (newImplementation == address(0)) revert InvalidImplementation(newImplementation);
    }

    function _setColdStorageAddress(address newColdStorage) internal {
        if (newColdStorage == address(0)) revert InvalidColdStorageAddress(newColdStorage);
        _coldStorageAddress = newColdStorage;
    }

    function getProposal(bytes32 proposalId) external view returns (Proposal memory) {
        return _proposals[proposalId];
    }

    function getTimelockBlocks() external view returns (uint48) {
        return _timelockBlocks;
    }

    function getRefundTimeoutBlocks() external view returns (uint48) {
        return _refundTimeoutBlocks;
    }

    function getBridgeAddress() external view returns (address) {
        return _bridgeAddress;
    }

    function getVersion() external view override returns (string memory) {
        return _version;
    }

    function isNonceUsed(address user, uint256 nonce) external view returns (bool) {
        return _usedNonces[user][nonce];
    }

    function getProposalCount() external view returns (uint256) {
        return _proposalCount;
    }

    uint256[49] private __gap;
}