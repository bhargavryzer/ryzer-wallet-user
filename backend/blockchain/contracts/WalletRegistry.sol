// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import "@openzeppelin/contracts-upgradeable@5.0.2/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable@5.0.2/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable@5.0.2/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable@5.0.2/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable@5.0.2/utils/PausableUpgradeable.sol";

/// @title IWallet - Interface for wallet contracts
interface IWallet {
    function owner() external view returns (address);
}

/// @title WalletRegistry - Registry for managing wallet registrations
/// @notice Tracks wallet ownership and types with upgradeable logic
/// @dev Uses UUPS proxy, supports role-based access and timelocked upgrades
/// @custom:security-contact security@x.ai
contract WalletRegistry is Initializable, UUPSUpgradeable, AccessControlUpgradeable, ReentrancyGuardUpgradeable, PausableUpgradeable {
    // Roles
    bytes32 internal constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 internal constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 internal constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // Enum
    enum WalletType { Custodial, MPC, Smart }

    // Structs
    struct WalletInfo {
        address owner;
        WalletType walletType;
        bool isRegistered;
    }

    struct UpgradeProposal {
        address newImplementation;
        uint48 proposedAt;
        bool executed;
    }

    // State variables
    mapping(address wallet => WalletInfo info) private _walletRegistry;
    mapping(address owner => address[] wallets) private _ownerToWallets;
    mapping(address wallet => uint256 index) private _walletToIndex;
    uint256 private _registeredWalletCount;
    string private _version;
    uint48 private _upgradeTimelockDelay;
    mapping(bytes32 proposalId => UpgradeProposal proposal) private _upgradeProposals;
    bool private _emergencyStopped;

    // Events
    event Initialized(address indexed admin, string version);
    event WalletRegistered(address indexed sender, address indexed wallet, address indexed owner, WalletType walletType);
    event WalletDeregistered(address indexed sender, address indexed wallet, address indexed owner);
    event WalletOwnerUpdated(address indexed sender, address indexed wallet, address indexed oldOwner, address newOwner);
    event ContractPaused(address indexed sender);
    event ContractUnpaused(address indexed sender);
    event UpgradeProposed(address indexed sender, bytes32 indexed proposalId, address indexed newImplementation);
    event UpgradeExecuted(address indexed sender, bytes32 indexed proposalId, address indexed newImplementation);
    event EmergencyStop(address indexed sender);
    event EmergencyStopLifted(address indexed sender);

    // Errors
    error InvalidWalletAddress(address wallet, string reason);
    error InvalidOwnerAddress(address owner);
    error WalletAlreadyRegistered(address wallet);
    error WalletNotRegistered(address wallet);
    error InvalidWalletType(uint256 walletType);
    error ArrayLengthMismatch(uint256 walletsLength, uint256 ownersLength, uint256 typesLength);
    error Unauthorized(address sender, bytes32 role);
    error InvalidImplementation(address newImplementation);
    error OwnershipMismatch(address expectedOwner, address actualOwner);
    error UpgradeTimelockNotElapsed(bytes32 proposalId);
    error UpgradeProposalNotFound(bytes32 proposalId);
    error UpgradeProposalAlreadyExecuted(bytes32 proposalId);
    error InvalidTimelockDelay(uint48 timelockDelay);
    error EmergencyStopActive();

    modifier whenNotEmergencyStopped() {
        if (_emergencyStopped) revert EmergencyStopActive();
        _;
    }

    /// @notice Initializes the registry
    function initialize(address admin_, uint48 timelockDelay_) public initializer {
        if (admin_ == address(0) || admin_.code.length > 0) revert InvalidOwnerAddress(admin_);
        if (timelockDelay_ < 1 hours || timelockDelay_ > 7 days) revert InvalidTimelockDelay(timelockDelay_);

        __AccessControl_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __Pausable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(ADMIN_ROLE, admin_);
        _grantRole(PAUSER_ROLE, admin_);
        _grantRole(UPGRADER_ROLE, admin_);

        _version = "1.0.0";
        _upgradeTimelockDelay = timelockDelay_;

        emit Initialized(admin_, _version);
    }

    /// @notice Registers a single wallet
    function registerWallet(address wallet, address owner, WalletType walletType)
        external
        nonReentrant
        whenNotPaused
        whenNotEmergencyStopped
        onlyRole(ADMIN_ROLE)
    {
        _validateWalletRegistration(wallet, owner, walletType);

        mapping(address => WalletInfo) storage registry = _walletRegistry;
        WalletInfo storage info = registry[wallet];
        if (info.isRegistered) revert WalletAlreadyRegistered(wallet);

        info.owner = owner;
        info.walletType = walletType;
        info.isRegistered = true;

        address[] storage ownerWallets = _ownerToWallets[owner];
        ownerWallets.push(wallet);
        _walletToIndex[wallet] = ownerWallets.length - 1;
        ++_registeredWalletCount;

        try IWallet(wallet).owner() returns (address actualOwner) {
            if (actualOwner != owner) {
                _removeWallet(wallet, owner);
                revert OwnershipMismatch(owner, actualOwner);
            }
        } catch {
            _removeWallet(wallet, owner);
            revert InvalidWalletAddress(wallet, "Invalid wallet interface");
        }

        emit WalletRegistered(msg.sender, wallet, owner, walletType);
    }

    /// @notice Registers multiple wallets
    function bulkRegisterWallets(address[] calldata wallets, address[] calldata owners, WalletType[] calldata walletTypes)
        external
        nonReentrant
        whenNotPaused
        whenNotEmergencyStopped
        onlyRole(ADMIN_ROLE)
    {
        uint256 len = wallets.length;
        if (len != owners.length || len != walletTypes.length) revert ArrayLengthMismatch(len, owners.length, walletTypes.length);

        mapping(address => WalletInfo) storage registry = _walletRegistry;
        for (uint256 i = 0; i < len; ++i) {
            _validateWalletRegistration(wallets[i], owners[i], walletTypes[i]);

            WalletInfo storage info = registry[wallets[i]];
            if (info.isRegistered) revert WalletAlreadyRegistered(wallets[i]);

            info.owner = owners[i];
            info.walletType = walletTypes[i];
            info.isRegistered = true;

            address[] storage ownerWallets = _ownerToWallets[owners[i]];
            ownerWallets.push(wallets[i]);
            _walletToIndex[wallets[i]] = ownerWallets.length - 1;
            ++_registeredWalletCount;

            try IWallet(wallets[i]).owner() returns (address actualOwner) {
                if (actualOwner != owners[i]) {
                    _removeWallet(wallets[i], owners[i]);
                    revert OwnershipMismatch(owners[i], actualOwner);
                }
            } catch {
                _removeWallet(wallets[i], owners[i]);
                revert InvalidWalletAddress(wallets[i], "Invalid wallet interface");
            }

            emit WalletRegistered(msg.sender, wallets[i], owners[i], walletTypes[i]);
        }
    }

    /// @notice Deregisters a wallet
    function deregisterWallet(address wallet) external nonReentrant whenNotPaused whenNotEmergencyStopped onlyRole(ADMIN_ROLE) {
        mapping(address => WalletInfo) storage registry = _walletRegistry;
        WalletInfo storage info = registry[wallet];
        if (!info.isRegistered) revert WalletNotRegistered(wallet);

        address owner = info.owner;
        _removeWallet(wallet, owner);

        emit WalletDeregistered(msg.sender, wallet, owner);
    }

    /// @notice Updates the owner of a wallet
    function updateWalletOwner(address wallet, address newOwner) external nonReentrant whenNotPaused whenNotEmergencyStopped {
        mapping(address => WalletInfo) storage registry = _walletRegistry;
        WalletInfo storage info = registry[wallet];
        if (!info.isRegistered) revert WalletNotRegistered(wallet);
        if (newOwner == address(0) || newOwner.code.length > 0) revert InvalidOwnerAddress(newOwner);
        if (msg.sender != info.owner && !hasRole(ADMIN_ROLE, msg.sender)) revert Unauthorized(msg.sender, ADMIN_ROLE);

        address oldOwner = info.owner;

        info.owner = newOwner;
        _removeWalletFromOwner(wallet, oldOwner);
        address[] storage newOwnerWallets = _ownerToWallets[newOwner];
        newOwnerWallets.push(wallet);
        _walletToIndex[wallet] = newOwnerWallets.length - 1;

        try IWallet(wallet).owner() returns (address actualOwner) {
            if (actualOwner != newOwner) {
                _removeWalletFromOwner(wallet, newOwner);
                _ownerToWallets[oldOwner].push(wallet);
                _walletToIndex[wallet] = _ownerToWallets[oldOwner].length - 1;
                info.owner = oldOwner;
                revert OwnershipMismatch(newOwner, actualOwner);
            }
        } catch {
            _removeWalletFromOwner(wallet, newOwner);
            _ownerToWallets[oldOwner].push(wallet);
            _walletToIndex[wallet] = _ownerToWallets[oldOwner].length - 1;
            info.owner = oldOwner;
            revert InvalidWalletAddress(wallet, "Invalid wallet interface");
        }

        emit WalletOwnerUpdated(msg.sender, wallet, oldOwner, newOwner);
    }

    /// @notice Pauses the contract
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
        emit ContractPaused(msg.sender);
    }

    /// @notice Unpauses the contract
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
        emit ContractUnpaused(msg.sender);
    }

    /// @notice Activates emergency stop
    function emergencyStop() external onlyRole(ADMIN_ROLE) {
        _emergencyStopped = true;
        _pause();
        emit EmergencyStop(msg.sender);
    }

    /// @notice Lifts emergency stop
    function liftEmergencyStop() external onlyRole(ADMIN_ROLE) {
        _emergencyStopped = false;
        emit EmergencyStopLifted(msg.sender);
    }

    /// @notice Proposes an upgrade
    function proposeUpgrade(address newImplementation) external onlyRole(UPGRADER_ROLE) returns (bytes32 proposalId) {
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
    function executeUpgrade(bytes32 proposalId) external onlyRole(UPGRADER_ROLE) {
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

    // View functions
    function getWalletInfo(address wallet)
        external
        view
        returns (address owner, WalletType walletType, bool isRegistered)
    {
        WalletInfo storage info = _walletRegistry[wallet];
        return (info.owner, info.walletType, info.isRegistered);
    }

    function getWalletsByOwner(address owner) external view returns (address[] memory wallets) {
        return _ownerToWallets[owner];
    }

    function getRegisteredWalletCount() external view returns (uint256) {
        return _registeredWalletCount;
    }

    function isWalletRegistered(address wallet) external view returns (bool) {
        return _walletRegistry[wallet].isRegistered;
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

    function _validateWalletRegistration(address wallet, address owner, WalletType walletType) private view {
        if (wallet == address(0)) revert InvalidWalletAddress(wallet, "Zero address");
        if (wallet == address(this)) revert InvalidWalletAddress(wallet, "Self-reference");
        if (wallet.code.length == 0) revert InvalidWalletAddress(wallet, "Not a contract");
        if (owner == address(0) || owner.code.length > 0) revert InvalidOwnerAddress(owner);
        if (uint256(walletType) > uint256(WalletType.Smart)) revert InvalidWalletType(uint256(walletType));
    }

    function _removeWallet(address wallet, address owner) private {
        _removeWalletFromOwner(wallet, owner);
        delete _walletRegistry[wallet];
        delete _walletToIndex[wallet];
        if (_registeredWalletCount > 0) --_registeredWalletCount;
    }

    function _removeWalletFromOwner(address wallet, address owner) private {
        address[] storage ownerWallets = _ownerToWallets[owner];
        uint256 index = _walletToIndex[wallet];
        uint256 len = ownerWallets.length;

        if (len > 0 && index < len && ownerWallets[index] == wallet) {
            if (index < len - 1) {
                ownerWallets[index] = ownerWallets[len - 1];
                _walletToIndex[ownerWallets[index]] = index;
            }
            ownerWallets.pop();
        }
    }

    uint256[50] private __gap;
}