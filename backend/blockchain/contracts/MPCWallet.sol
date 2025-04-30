// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import "@openzeppelin/contracts-upgradeable@5.0.2/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts@5.0.2/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts@5.0.2/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts@5.0.2/utils/Address.sol";
import "./BaseWallet.sol";

/// @title IWallet - Interface for wallet contracts
interface IWallet {
    function owner() external view returns (address);
}


/// @title IERC20Metadata - Interface for ERC-20 decimals
interface IERC20Metadata is IERC20 {
    function decimals() external view returns (uint8);
}

/// @title MPCWallet - Multi-party computation wallet with multi-signature and guardian recovery
/// @notice Supports multi-signature transactions, guardian recovery, and token management
/// @dev Uses UUPS proxy, inherits BaseWallet, supports ETH, ERC-20, ERC-3643
/// @custom:security-contact security@x.ai
contract MPCWallet is BaseWallet, UUPSUpgradeable, IWallet {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;
    using Address for address;

    // State variables
    address[] private _owners;
    mapping(address => bool) private _isOwner;
    uint256 private _threshold;
    mapping(uint256 => bool) private _usedNonces;
    uint256 private _currentNonce;

    // Guardian system
    mapping(address => bool) private _guardians;
    address[] private _guardianList;
    uint256 private _requiredGuardians;
    mapping(address => bool) private _guardianApprovals;
    uint256 private _guardianApprovalCount;
    address[] private _pendingOwners;
    uint256 private _pendingThreshold;
    uint48 private _recoveryInitiatedTime;
    uint48 private constant RECOVERY_PERIOD = 3 days;
    uint256 private constant MAX_GUARDIANS = 10;

    // Events
    event TransactionExecuted(address indexed sender, address indexed to, uint256 value, bytes data, uint256 indexed nonce);
    event Deposit(address indexed user, address indexed token, uint256 amount);
    event NonceUpdated(address indexed sender, uint256 oldNonce, uint256 newNonce);
    event GuardianAdded(address indexed sender, address indexed guardian);
    event GuardianRemoved(address indexed sender, address indexed guardian);
    event RequiredGuardiansUpdated(address indexed sender, uint256 oldRequired, uint256 newRequired);
    event RecoveryInitiated(address indexed sender, address[] newOwners, uint256 newThreshold);
    event RecoveryExecuted(address indexed sender, address[] newOwners, uint256 newThreshold);
    event RecoveryCancelled(address indexed sender);

    // Errors
    error InvalidOwnerCount(uint256 count);
    error InvalidThreshold(uint256 threshold);
    error InvalidNonce(uint256 nonce);
    error InsufficientSignatures(uint256 count);
    error InvalidSigner(address signer);
    error DuplicateSigner(address signer);
    error AlreadyGuardian(address guardian);
    error NotGuardian(address guardian);
    error GuardianAlreadyApproved(address guardian);
    error InsufficientGuardianApprovals(uint256 count);
    error NoActiveRecovery();
    error SelfInteractionNotAllowed(address addr);
    error TooManyGuardians(uint256 count);
    error OwnerAsGuardian(address guardian);
    error RecoveryPeriodNotElapsed();
    
  

    /// @notice Initializes the MPC wallet with owners and threshold
    /// @param owners_ Array of owner addresses (2–5, unique, non-zero)
    /// @param threshold_ Number of signatures required for transactions
    function initialize(address[] memory owners_, uint256 threshold_) external initializer {
        if (owners_.length < 2 || owners_.length > 5) revert InvalidOwnerCount(owners_.length);
        if (threshold_ > owners_.length || threshold_ == 0) revert InvalidThreshold(threshold_);

        // Validate owners
        address prevOwner = address(0);
        for (uint256 i = 0; i < owners_.length; ++i) {
            address owner_ = owners_[i];
            if (owner_ == address(0) || owner_.code.length > 0) revert InvalidAddress(owner_, "Invalid owner");
            if (_isOwner[owner_]) revert DuplicateSigner(owner_);
            if (owner_ <= prevOwner) revert InvalidAddress(owner_, "Owners must be sorted");
            _isOwner[owner_] = true;
            prevOwner = owner_;
        }

        __BaseWallet_init(owners_[0]);
        __UUPSUpgradeable_init();

        _owners = owners_;
        _threshold = threshold_;
        _requiredGuardians = 2;

    }

    /// @notice Returns the wallet's owner (first owner for IWallet compatibility)
    function owner() external view override returns (address) {
        return _owners.length > 0 ? _owners[0] : address(0);
    }

    /// @notice Checks if an address is an owner
    function isOwner(address account) public view override returns (bool) {
        return _isOwner[account];
    }

    /// @notice Deposits ETH or ERC-20 tokens
    function deposit(address token, uint256 amount) external payable nonReentrant whenNotPaused {
        if (token == address(this)) revert SelfInteractionNotAllowed(token);
        if (amount == 0) revert AmountZero();
        if (token != address(0)) {
            try IERC20Metadata(token).decimals() returns (uint8 decimals) {
                if (decimals > 18) revert InvalidTokenAddress(token);
            } catch {
                revert InvalidTokenAddress(token);
            }
        }

        if (token == address(0)) {
            if (msg.value != amount) revert InvalidAddress(address(0), "Incorrect ETH amount");
        } else {
            if (msg.value != 0) revert InvalidAddress(address(0), "ETH not allowed for token deposit");
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }
        emit Deposit(msg.sender, token, amount);
    }

    /// @notice Validates signatures for a transaction
    function validateSignatures(address to, uint256 value, bytes memory data, bytes[] memory signatures, uint256 nonce) internal view {
        bytes32 message = keccak256(abi.encode(to, value, data, block.chainid, address(this), nonce));
        bytes32 hash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", message));
        address[] memory signers = new address[](signatures.length);
        uint256 validSigners;
        address prevSigner = address(0);

        for (uint256 i = 0; i < signatures.length; ++i) {
            address signer = ECDSA.recover(hash, signatures[i]);
            if (!isOwner(signer)) revert InvalidSigner(signer);
            if (signer <= prevSigner) revert DuplicateSigner(signer);
            signers[i] = signer;
            ++validSigners;
            prevSigner = signer;
        }
        if (validSigners < _threshold) revert InsufficientSignatures(validSigners);
    }

    /// @notice Executes a transaction with multiple signatures
    function execute(address to, uint256 value, bytes memory data, bytes[] memory signatures, uint256 nonce)
        external
        nonReentrant
        whenNotPaused
        returns (bytes memory result)
    {
        if (!isOwner(msg.sender)) revert InvalidAddress(msg.sender, "Not owner");
        if (to == address(this)) revert SelfInteractionNotAllowed(to);
        if (to == address(0) || to.code.length == 0) revert InvalidAddress(to, "Invalid target");
        if (_usedNonces[nonce]) revert InvalidNonce(nonce);
        if (nonce != _currentNonce) revert InvalidNonce(nonce);
        if (signatures.length < _threshold) revert InsufficientSignatures(signatures.length);

        validateSignatures(to, value, data, signatures, nonce);

        _usedNonces[nonce] = true;
        uint256 oldNonce = _currentNonce;
        ++_currentNonce;
        emit NonceUpdated(msg.sender, oldNonce, _currentNonce);

        if (address(this).balance < value) revert InsufficientBalance(value);
        CallResult memory callResult = executeExternalCall(to, value, data);
        if (!callResult.success) revert ExternalCallFailed(to, data);
        result = callResult.data;

        emit TransactionExecuted(msg.sender, to, value, data, nonce);
    }

    /// @notice Adds a guardian
    function addGuardian(address guardian) external whenNotPaused onlyOwner {
        if (guardian == address(0) || guardian.code.length > 0) revert InvalidAddress(guardian, "Invalid guardian");
        if (isOwner(guardian)) revert OwnerAsGuardian(guardian);
        if (_guardians[guardian]) revert AlreadyGuardian(guardian);
        if (_guardianList.length >= MAX_GUARDIANS) revert TooManyGuardians(_guardianList.length);

        _guardians[guardian] = true;
        _guardianList.push(guardian);
        emit GuardianAdded(msg.sender, guardian);
    }

    /// @notice Removes a guardian
    function removeGuardian(address guardian) external whenNotPaused onlyOwner {
        if (!_guardians[guardian]) revert NotGuardian(guardian);

        _guardians[guardian] = false;
        uint256 len = _guardianList.length;
        for (uint256 i = 0; i < len; ++i) {
            if (_guardianList[i] == guardian) {
                if (i < len - 1) {
                    _guardianList[i] = _guardianList[len - 1];
                }
                _guardianList.pop();
                break;
            }
        }
        if (_guardianApprovals[guardian]) {
            _guardianApprovals[guardian] = false;
            --_guardianApprovalCount;
        }
        emit GuardianRemoved(msg.sender, guardian);
    }

    /// @notice Sets the required number of guardians
    function setRequiredGuardians(uint256 newRequired) external whenNotPaused onlyOwner {
        if (newRequired == 0 || newRequired > _guardianList.length) revert InvalidThreshold(newRequired);
        uint256 oldRequired = _requiredGuardians;
        _requiredGuardians = newRequired;
        emit RequiredGuardiansUpdated(msg.sender, oldRequired, newRequired);
    }

    /// @notice Initiates ownership recovery
    function initiateRecovery(address[] memory newOwners, uint256 newThreshold) external whenNotPaused {
        if (!_guardians[msg.sender]) revert NotGuardian(msg.sender);
        if (newOwners.length < 2 || newOwners.length > 5) revert InvalidOwnerCount(newOwners.length);
        if (newThreshold == 0 || newThreshold > newOwners.length) revert InvalidThreshold(newThreshold);
        if (_guardianApprovals[msg.sender]) revert GuardianAlreadyApproved(msg.sender);

        address prevOwner = address(0);
        for (uint256 i = 0; i < newOwners.length; ++i) {
            address owner_ = newOwners[i];
            if (owner_ == address(0) || owner_.code.length > 0) revert InvalidAddress(owner_, "Invalid new owner");
            if (owner_ <= prevOwner) revert InvalidAddress(owner_, "Owners must be sorted");
            prevOwner = owner_;
        }

        _guardianApprovals[msg.sender] = true;
        ++_guardianApprovalCount;

        if (_guardianApprovalCount >= _requiredGuardians) {
            _pendingOwners = newOwners;
            _pendingThreshold = newThreshold;
            _recoveryInitiatedTime = uint48(block.timestamp);
            emit RecoveryInitiated(msg.sender, newOwners, newThreshold);
        }
    }

    /// @notice Executes ownership recovery
    function executeRecovery() external nonReentrant whenNotPaused onlyOwner {
        if (_guardianApprovalCount < _requiredGuardians) revert InsufficientGuardianApprovals(_guardianApprovalCount);
        if (block.timestamp < _recoveryInitiatedTime + RECOVERY_PERIOD) revert RecoveryPeriodNotElapsed();
        if (_recoveryInitiatedTime == 0) revert NoActiveRecovery();

        address[] memory newOwners = _pendingOwners;
        uint256 newThreshold = _pendingThreshold;
        _resetRecovery();

        for (uint256 i = 0; i < _owners.length; ++i) {
            _isOwner[_owners[i]] = false;
        }
        _owners = newOwners;
        for (uint256 i = 0; i < newOwners.length; ++i) {
            _isOwner[newOwners[i]] = true;
        }
        _threshold = newThreshold;

        emit RecoveryExecuted(msg.sender, newOwners, newThreshold);
    }

    /// @notice Cancels recovery
    function cancelRecovery() external nonReentrant whenNotPaused onlyOwner {
        if (_recoveryInitiatedTime == 0) revert NoActiveRecovery();
        _resetRecovery();
        emit RecoveryCancelled(msg.sender);
    }

    /// @notice Resets recovery state
    function _resetRecovery() private {
        _pendingOwners = new address[](0);
        _pendingThreshold = 0;
        _guardianApprovalCount = 0;
        _recoveryInitiatedTime = 0;
        uint256 len = _guardianList.length;
        for (uint256 i = 0; i < len; ++i) {
            _guardianApprovals[_guardianList[i]] = false;
        }
    }

    /// @notice Authorizes contract upgrades
    function _authorizeUpgrade(address newImplementation) internal view override {
        if (!isOwner(msg.sender)) revert InvalidAddress(msg.sender, "Not owner");
        if (newImplementation == address(0) || newImplementation.code.length == 0) revert InvalidAddress(newImplementation, "Invalid implementation");
    }

    /// @notice Reimburses gas costs
    function reimburseGas(address recipient, uint256 amount) public override nonReentrant whenNotPaused onlyOwner {
        super.reimburseGas(recipient, amount);
    }

    // View functions
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getOwners() external view returns (address[] memory) {
        return _owners;
    }

    function getThreshold() external view returns (uint256) {
        return _threshold;
    }

    function getCurrentNonce() external view returns (uint256) {
        return _currentNonce;
    }

    function isGuardian(address guardian) external view returns (bool) {
        return _guardians[guardian];
    }

    function getGuardianList() external view returns (address[] memory) {
        return _guardianList;
    }

    function getRequiredGuardians() external view returns (uint256) {
        return _requiredGuardians;
    }

    function getGuardianApproval(address guardian) external view returns (bool) {
        return _guardianApprovals[guardian];
    }

    function getRecoveryDetails()
        external
        view
        returns (address[] memory pendingOwners, uint256 pendingThreshold, uint48 recoveryInitiatedTime, uint256 guardianApprovalCount)
    {
        return (_pendingOwners, _pendingThreshold, _recoveryInitiatedTime, _guardianApprovalCount);
    }

    uint256[49] private __gap;
}