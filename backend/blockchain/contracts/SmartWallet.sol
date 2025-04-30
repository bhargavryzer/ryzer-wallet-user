// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import "@openzeppelin/contracts-upgradeable@5.0.2/proxy/utils/UUPSUpgradeable.sol";
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

/// @title SmartWallet - A smart wallet with guardian-based recovery
/// @notice Manages deposits, withdrawals, and recovery with role-based access
/// @dev Uses UUPS proxy, inherits BaseWallet, supports ETH, ERC-20, ERC-3643
/// @custom:security-contact security@x.ai
contract SmartWallet is BaseWallet, UUPSUpgradeable, IWallet {
    using SafeERC20 for IERC20;
    using Address for address;
    using Address for address payable;

    // Structs
    struct UpgradeProposal {
        address newImplementation;
        uint48 proposedAt;
        bool executed;
    }

    // State variables
    address private _admin;
    mapping(address => bool) private _guardians;
    mapping(address => uint256) private _guardianIndices;
    address[] private _guardianList;
    mapping(address => bool) private _guardianApprovals;
    uint256 private _guardianCount;
    uint256 private _requiredGuardians;
    uint256 private _guardianApprovalCount;
    uint48 private _recoveryPeriod;
    address private _pendingOwner;
    uint48 private _recoveryInitiatedTime;
    bool private _emergencyStopped;
    string private _version;
    uint48 private _upgradeTimelockDelay;
    mapping(bytes32 => UpgradeProposal) private _upgradeProposals;

    // Constants
    uint256 private constant MAX_GUARDIANS = 10;
    uint48 private constant MIN_RECOVERY_PERIOD = 1 days;
    uint48 private constant DEFAULT_RECOVERY_PERIOD = 3 days;
    uint48 private constant DEFAULT_TIMELOCK_DELAY = 2 days;

    // Events
    event Initialized(address indexed admin, string version);
    event TransactionExecuted(address indexed sender, address indexed to, uint256 value, bytes data);
    event Deposit(address indexed user, address indexed token, uint256 amount);
    event Withdrawal(address indexed user, address indexed token, uint256 amount);
    event RecoveryInitiated(address indexed sender, address indexed newOwner);
    event RecoveryExecuted(address indexed sender, address indexed newOwner);
    event RecoveryCancelled(address indexed sender);
    event GuardianAdded(address indexed sender, address indexed guardian);
    event GuardianRemoved(address indexed sender, address indexed guardian);
    event RequiredGuardiansUpdated(address indexed sender, uint256 oldRequired, uint256 newRequired);
    event RecoveryPeriodUpdated(address indexed sender, uint48 oldPeriod, uint48 newPeriod);
    event EmergencyStop(address indexed sender);
    event EmergencyStopLifted(address indexed sender);
    event UpgradeProposed(address indexed sender, bytes32 indexed proposalId, address indexed newImplementation);
    event UpgradeExecuted(address indexed sender, bytes32 indexed proposalId, address indexed newImplementation);

    // Errors
    error SelfInteractionNotAllowed(address addr);
    error InvalidRecoveryPeriod(uint48 period);
    error InvalidGuardianCount(uint256 count);
    error AlreadyGuardian(address guardian);
    error NotGuardian(address guardian);
    error GuardianAlreadyApproved(address guardian);
    error NoActiveRecovery();
    error OwnerAsGuardian(address guardian);
    error RecoveryPeriodNotElapsed();
    error SmartWalletInitializationFailed(string reason);
    error Unauthorized(address sender, bytes32 role);
    error InvalidImplementation(address newImplementation);
    error UpgradeTimelockNotElapsed(bytes32 proposalId);
    error UpgradeProposalNotFound(bytes32 proposalId);
    error UpgradeProposalAlreadyExecuted(bytes32 proposalId);
    error EmergencyStopActive();
    error InsufficientTokenBalance(address token, uint256 amount);

    modifier whenNotEmergencyStopped() {
        if (_emergencyStopped) revert EmergencyStopActive();
        _;
    }


    /// @notice Initializes the smart wallet
    function initialize(address admin_) public initializer {
        if (admin_ == address(0) || admin_.code.length > 0) revert SmartWalletInitializationFailed("Invalid admin");

        __BaseWallet_init(admin_);
        __UUPSUpgradeable_init();

        _admin = admin_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(ADMIN_ROLE, admin_);
        _grantRole(PAUSER_ROLE, admin_);
        _grantRole(ADMIN_ROLE, admin_);

        _recoveryPeriod = DEFAULT_RECOVERY_PERIOD;
        _requiredGuardians = 2;
        _version = "1.0.0";
        _upgradeTimelockDelay = DEFAULT_TIMELOCK_DELAY;

        emit Initialized(admin_, _version);
    }

    /// @notice Checks if an address is an owner
    function isOwner(address account) public view override returns (bool) {
        return _admin == account;
    }

    /// @notice Deposits ETH or ERC-20 tokens
    function deposit(address token, uint256 amount) external payable nonReentrant whenNotPaused whenNotEmergencyStopped {
        if (amount == 0) revert AmountZero();
        if (token == address(this)) revert SelfInteractionNotAllowed(token);
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

    /// @notice Withdraws ETH or ERC-20 tokens
    function withdraw(address token, uint256 amount) external nonReentrant whenNotPaused whenNotEmergencyStopped onlyRole(ADMIN_ROLE) {
        if (amount == 0) revert AmountZero();
        if (token == address(this)) revert SelfInteractionNotAllowed(token);
        if (token != address(0)) {
            try IERC20Metadata(token).decimals() returns (uint8 decimals) {
                if (decimals > 18) revert InvalidTokenAddress(token);
            } catch {
                revert InvalidTokenAddress(token);
            }
        }

        if (token == address(0)) {
            if (address(this).balance < amount) revert InsufficientTokenBalance(token, amount);
            payable(msg.sender).sendValue(amount);
        } else {
            if (IERC20(token).balanceOf(address(this)) < amount) revert InsufficientTokenBalance(token, amount);
            IERC20(token).safeTransfer(msg.sender, amount);
        }

        emit Withdrawal(msg.sender, token, amount);
    }

    /// @notice Executes an external contract call
    function executeExternalCall(address to, uint256 value, bytes memory data)
        public
        override
        nonReentrant
        whenNotPaused
        whenNotEmergencyStopped
        onlyRole(ADMIN_ROLE)
        returns (CallResult memory result)
    {
        if (to == address(this)) revert SelfInteractionNotAllowed(to);
        if (to == address(0) || to.code.length == 0) revert InvalidAddress(to, "Invalid target");
        if (address(this).balance < value) revert InsufficientTokenBalance(address(0), value);

        result = super.executeExternalCall(to, value, data);
        if (!result.success) revert ExternalCallFailed(to, data);

        emit TransactionExecuted(msg.sender, to, value, data);
    }

    /// @notice Reimburses gas costs
    function reimburseGas(address recipient, uint256 amount) public override nonReentrant whenNotPaused whenNotEmergencyStopped onlyRole(ADMIN_ROLE) {
        super.reimburseGas(recipient, amount);
    }

    /// @notice Adds a guardian
    function addGuardian(address guardian) external onlyRole(ADMIN_ROLE) whenNotPaused whenNotEmergencyStopped {
        if (guardian == address(0) || guardian.code.length > 0) revert InvalidAddress(guardian, "Invalid guardian");
        if (hasRole(ADMIN_ROLE, guardian)) revert OwnerAsGuardian(guardian);
        if (_guardians[guardian]) revert AlreadyGuardian(guardian);
        if (_guardianCount >= MAX_GUARDIANS) revert InvalidGuardianCount(_guardianCount);

        _guardians[guardian] = true;
        _guardianList.push(guardian);
        _guardianIndices[guardian] = _guardianList.length;
        ++_guardianCount;

        emit GuardianAdded(msg.sender, guardian);
    }

    /// @notice Removes a guardian
    function removeGuardian(address guardian) external onlyRole(ADMIN_ROLE) whenNotPaused whenNotEmergencyStopped {
        if (!_guardians[guardian]) revert NotGuardian(guardian);

        _guardians[guardian] = false;
        --_guardianCount;

        uint256 index = _guardianIndices[guardian];
        if (index > 0 && index <= _guardianList.length && _guardianList[index - 1] == guardian) {
            if (index < _guardianList.length) {
                address lastGuardian = _guardianList[_guardianList.length - 1];
                _guardianList[index - 1] = lastGuardian;
                _guardianIndices[lastGuardian] = index;
            }
            _guardianList.pop();
            delete _guardianIndices[guardian];
        }

        if (_guardianApprovals[guardian]) {
            _guardianApprovals[guardian] = false;
            --_guardianApprovalCount;
        }

        emit GuardianRemoved(msg.sender, guardian);
    }

    /// @notice Initiates ownership recovery
    function initiateRecovery(address newOwner) external whenNotPaused whenNotEmergencyStopped {
        if (!_guardians[msg.sender]) revert NotGuardian(msg.sender);
        if (newOwner == address(0) || newOwner.code.length > 0) revert InvalidAddress(newOwner, "Invalid new owner");
        if (_guardianApprovals[msg.sender]) revert GuardianAlreadyApproved(msg.sender);

        _guardianApprovals[msg.sender] = true;
        ++_guardianApprovalCount;

        if (_guardianApprovalCount >= _requiredGuardians) {
            _pendingOwner = newOwner;
            _recoveryInitiatedTime = uint48(block.timestamp);
            emit RecoveryInitiated(msg.sender, newOwner);
        }
    }

    /// @notice Executes ownership recovery
    function executeRecovery() external nonReentrant onlyRole(ADMIN_ROLE) whenNotPaused whenNotEmergencyStopped {
        if (_guardianApprovalCount < _requiredGuardians) revert InvalidGuardianCount(_guardianApprovalCount);
        if (block.timestamp < _recoveryInitiatedTime + _recoveryPeriod) revert RecoveryPeriodNotElapsed();
        if (_recoveryInitiatedTime == 0) revert NoActiveRecovery();

        address newOwner = _pendingOwner;
        _resetRecovery();

        _admin = newOwner;
        _grantRole(ADMIN_ROLE, newOwner);
        _revokeRole(ADMIN_ROLE, msg.sender);

        emit RecoveryExecuted(msg.sender, newOwner);
    }

    /// @notice Cancels recovery
    function cancelRecovery() external nonReentrant onlyRole(ADMIN_ROLE) whenNotPaused whenNotEmergencyStopped {
        if (_recoveryInitiatedTime == 0) revert NoActiveRecovery();
        _resetRecovery();
        emit RecoveryCancelled(msg.sender);
    }

    /// @notice Sets the recovery period
    function setRecoveryPeriod(uint48 newPeriod) external onlyRole(ADMIN_ROLE) whenNotPaused whenNotEmergencyStopped {
        if (newPeriod < MIN_RECOVERY_PERIOD) revert InvalidRecoveryPeriod(newPeriod);

        uint48 oldPeriod = _recoveryPeriod;
        _recoveryPeriod = newPeriod;
        emit RecoveryPeriodUpdated(msg.sender, oldPeriod, newPeriod);
    }

    /// @notice Sets the required number of guardians
    function setRequiredGuardians(uint256 newRequired) external onlyRole(ADMIN_ROLE) whenNotPaused whenNotEmergencyStopped {
        if (newRequired == 0 || newRequired > _guardianCount || newRequired > MAX_GUARDIANS) revert InvalidGuardianCount(newRequired);

        uint256 oldRequired = _requiredGuardians;
        _requiredGuardians = newRequired;
        emit RequiredGuardiansUpdated(msg.sender, oldRequired, newRequired);
    }

    /// @notice Pauses the contract
    function pause() public override onlyRole(PAUSER_ROLE) {
        super.pause();
    }

    /// @notice Unpauses the contract
    function unpause() public override onlyRole(PAUSER_ROLE) {
        super.unpause();
    }

    /// @notice Activates emergency stop
    function emergencyStop() external onlyRole(PAUSER_ROLE) {
        _emergencyStopped = true;
        _pause();
        emit EmergencyStop(msg.sender);
    }

    /// @notice Lifts emergency stop
    function liftEmergencyStop() external onlyRole(PAUSER_ROLE) {
        _emergencyStopped = false;
        emit EmergencyStopLifted(msg.sender);
    }

    /// @notice Proposes an upgrade
    function proposeUpgrade(address newImplementation) external onlyRole(ADMIN_ROLE) returns (bytes32 proposalId) {
        if (newImplementation == address(0) || newImplementation.code.length == 0) revert InvalidImplementation(newImplementation);

        proposalId = keccak256(abi.encode(msg.sender, newImplementation, block.timestamp));
        UpgradeProposal storage proposal = _upgradeProposals[proposalId];
        if (proposal.proposedAt != 0) revert UpgradeProposalAlreadyExecuted(proposalId);

        proposal.newImplementation = newImplementation;
        proposal.proposedAt = uint48(block.timestamp);
        proposal.executed = false;

        emit UpgradeProposed(msg.sender, proposalId, newImplementation);
    }

    /// @notice Executes an upgrade
    function executeUpgrade(bytes32 proposalId) external onlyRole(ADMIN_ROLE) {
        UpgradeProposal storage proposal = _upgradeProposals[proposalId];
        if (proposal.proposedAt == 0) revert UpgradeProposalNotFound(proposalId);
        if (proposal.executed) revert UpgradeProposalAlreadyExecuted(proposalId);
        if (block.timestamp < proposal.proposedAt + _upgradeTimelockDelay) revert UpgradeTimelockNotElapsed(proposalId);

        proposal.executed = true;
        _authorizeUpgrade(proposal.newImplementation);

        emit UpgradeExecuted(msg.sender, proposalId, proposal.newImplementation);
    }

    /// @notice Authorizes an upgrade
    function _authorizeUpgrade(address newImplementation) internal view override {
        if (newImplementation == address(0) || newImplementation.code.length == 0) revert InvalidImplementation(newImplementation);
    }

    /// @notice Resets recovery state
    function _resetRecovery() private {
        _pendingOwner = address(0);
        _guardianApprovalCount = 0;
        _recoveryInitiatedTime = 0;
        uint256 len = _guardianList.length;
        for (uint256 i = 0; i < len; ++i) {
            if (_guardianApprovals[_guardianList[i]]) {
                _guardianApprovals[_guardianList[i]] = false;
            }
        }
    }

    // View functions
    function owner() external view override returns (address) {
        return _admin;
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getRecoveryPeriod() external view returns (uint48) {
        return _recoveryPeriod;
    }

    function getRequiredGuardians() external view returns (uint256) {
        return _requiredGuardians;
    }

    function isGuardian(address guardian) external view returns (bool) {
        return _guardians[guardian];
    }

    function getGuardianList() external view returns (address[] memory) {
        return _guardianList;
    }

    function getRecoveryDetails()
        external
        view
        returns (address pendingOwner, uint48 recoveryInitiatedTime, uint256 guardianApprovalCount)
    {
        return (_pendingOwner, _recoveryInitiatedTime, _guardianApprovalCount);
    }

    function getGuardianApproval(address guardian) external view returns (bool) {
        return _guardianApprovals[guardian];
    }

    function getVersion() external view returns (string memory) {
        return _version;
    }

    function getUpgradeTimelockDelay() external view returns (uint48) {
        return _upgradeTimelockDelay;
    }

    function getUpgradeProposal(bytes32 proposalId)
        external
        view
        returns (address newImplementation, uint48 proposedAt, bool executed)
    {
        UpgradeProposal storage proposal = _upgradeProposals[proposalId];
        return (proposal.newImplementation, proposal.proposedAt, proposal.executed);
    }

    function isEmergencyStopped() external view returns (bool) {
        return _emergencyStopped;
    }

    uint256[50] private __gap;
}