// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import "@openzeppelin/contracts@5.0.2/proxy/Clones.sol";
import "@openzeppelin/contracts-upgradeable@5.0.2/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable@5.0.2/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable@5.0.2/access/Ownable2StepUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable@5.0.2/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable@5.0.2/utils/ReentrancyGuardUpgradeable.sol";

/// @title IWalletRegistry - Interface for wallet registry
interface IWalletRegistry {
    enum WalletType { Custodial, MPC, Smart }
    function registerWallet(address wallet, address owner, WalletType walletType) external;
    function grantRole(bytes32 role, address account) external;
}

/// @title IWallet - Interface for wallet contracts
interface IWallet {
    function owner() external view returns (address);
    function setKycStatus(bool status) external;
}

/// @title RyzerFactory - Factory for deploying wallets
/// @notice Deploys and initializes wallets (CustodialCore, CustodialAdvanced, MPC, Smart) using minimal proxies
/// @dev Uses UUPS proxy, supports pausing, ownership management, role granting, and KYC status updates
/// @custom:security-contact security@x.ai
contract RyzerFactory is Initializable, UUPSUpgradeable, Ownable2StepUpgradeable, PausableUpgradeable, ReentrancyGuardUpgradeable {
    // Enum
    enum WalletType { CustodialCore, CustodialAdvanced, MPC, Smart }

    // Role constant
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // State variables
    address private _custodialWalletCoreImpl;
    address private _custodialWalletAdvancedImpl;
    address private _mpcWalletImpl;
    address private _smartWalletImpl;
    address private _registry;
    string private _version;

    // Events
    event Initialized(address indexed owner, address custodialCoreImpl, address custodialAdvancedImpl, address mpcImpl, address smartImpl, address registry);
    event WalletCreated(address indexed wallet, WalletType indexed walletType, address indexed owner, bytes32 salt);
    event ImplementationUpdated(WalletType indexed walletType, address indexed oldImplementation, address indexed newImplementation);
    event RegistryUpdated(address indexed sender, address indexed oldRegistry, address indexed newRegistry);
    event RoleGranted(address indexed sender, bytes32 indexed role, address indexed account);
    event KycStatusUpdated(address indexed sender, address indexed wallet, bool status);

    // Errors
    error InvalidAddress(address addr, string reason);
    error InvalidOwner(address owner);
    error InvalidWalletType();
    error InitializationFailed(string reason);
    error OwnershipMismatch(address expectedOwner, address actualOwner);
    error SameRegistry(address registry);
    error InvalidInitData(string reason);
    error InvalidMPCOwners(uint256 count);
    error InvalidGuardianCount(uint256 count);

    /// @notice Initializes the factory with wallet implementations and registry
    function initialize(
        address custodialCoreImpl,
        address custodialAdvancedImpl,
        address mpcImpl,
        address smartImpl,
        address registry
    ) public initializer {
        if (custodialCoreImpl == address(0) || custodialCoreImpl.code.length == 0) revert InvalidAddress(custodialCoreImpl, "CustodialCore implementation");
        if (custodialAdvancedImpl == address(0) || custodialAdvancedImpl.code.length == 0) revert InvalidAddress(custodialAdvancedImpl, "CustodialAdvanced implementation");
        if (mpcImpl == address(0) || mpcImpl.code.length == 0) revert InvalidAddress(mpcImpl, "MPC implementation");
        if (smartImpl == address(0) || smartImpl.code.length == 0) revert InvalidAddress(smartImpl, "Smart implementation");
        if (registry == address(0) || registry.code.length == 0) revert InvalidAddress(registry, "Registry");

        __UUPSUpgradeable_init();
        __Pausable_init();
        __Ownable2Step_init();

        _custodialWalletCoreImpl = custodialCoreImpl;
        _custodialWalletAdvancedImpl = custodialAdvancedImpl;
        _mpcWalletImpl = mpcImpl;
        _smartWalletImpl = smartImpl;
        _registry = registry;
        _version = "1.0.0";

        // Grant ADMIN_ROLE to this contract in WalletRegistry
        IWalletRegistry(registry).grantRole(ADMIN_ROLE, address(this));

        emit Initialized(msg.sender, custodialCoreImpl, custodialAdvancedImpl, mpcImpl, smartImpl, registry);
    }

    /// @notice Creates a wallet with default initialization
    function createWallet(WalletType walletType, address owner, address bridgeAddress, bytes32 salt)
        external
        nonReentrant
        whenNotPaused
        returns (address wallet)
    {
        if (owner == address(0) || owner.code.length > 0) revert InvalidOwner(owner);
        if (walletType == WalletType.MPC) revert InvalidWalletType();
        if (walletType == WalletType.CustodialAdvanced && bridgeAddress == address(0)) {
            revert InvalidAddress(bridgeAddress, "Invalid bridge address");
        }

        address implementation;
        bytes memory initData;

        if (walletType == WalletType.CustodialCore) {
            implementation = _custodialWalletCoreImpl;
            initData = abi.encodeWithSelector(bytes4(keccak256("initialize(address,address)")), owner, owner);
        } else if (walletType == WalletType.CustodialAdvanced) {
            implementation = _custodialWalletAdvancedImpl;
            initData = abi.encodeWithSelector(bytes4(keccak256("initialize(address,address,address)")), owner, owner, bridgeAddress);
        } else if (walletType == WalletType.Smart) {
            implementation = _smartWalletImpl;
            initData = abi.encodeWithSelector(bytes4(keccak256("initialize(address)")), owner);
        } else {
            revert InvalidWalletType();
        }

        return _createWallet(implementation, initData, walletType, owner, salt);
    }

    /// @notice Creates an MPC wallet
    function createMPCWallet(address[] memory owners, uint256 threshold, bytes32 salt)
        external
        nonReentrant
        whenNotPaused
        returns (address wallet)
    {
        if (owners.length < 2 || owners.length > 5) revert InvalidMPCOwners(owners.length);
        if (threshold == 0 || threshold > owners.length) revert InvalidInitData("Invalid threshold");
        address prevOwner = address(0);
        for (uint256 i = 0; i < owners.length; ++i) {
            if (owners[i] == address(0) || owners[i].code.length > 0) revert InvalidOwner(owners[i]);
            if (owners[i] <= prevOwner) revert InvalidInitData("Duplicate or unsorted owner");
            prevOwner = owners[i];
        }

        bytes memory initData = abi.encodeWithSelector(bytes4(keccak256("initialize(address[],uint256)")), owners, threshold);
        return _createWallet(_mpcWalletImpl, initData, WalletType.MPC, owners[0], salt);
    }

    /// @notice Creates a SmartWallet with guardians
    function createSmartWalletWithGuardians(address admin, address[] memory guardians, uint256 requiredGuardians, bytes32 salt)
        external
        nonReentrant
        whenNotPaused
        returns (address wallet)
    {
        if (admin == address(0) || admin.code.length > 0) revert InvalidOwner(admin);
        if (requiredGuardians == 0 || requiredGuardians > guardians.length) revert InvalidGuardianCount(requiredGuardians);
        address prevGuardian = address(0);
        for (uint256 i = 0; i < guardians.length; ++i) {
            if (guardians[i] == address(0) || guardians[i].code.length > 0) revert InvalidOwner(guardians[i]);
            if (guardians[i] <= prevGuardian) revert InvalidInitData("Duplicate or unsorted guardian");
            prevGuardian = guardians[i];
        }

        bytes memory initData = abi.encodeWithSelector(bytes4(keccak256("initialize(address)")), admin);
        wallet = _createWallet(_smartWalletImpl, initData, WalletType.Smart, admin, salt);

        for (uint256 i = 0; i < guardians.length; ++i) {
            (bool _success, bytes memory _result) = wallet.call(
                abi.encodeWithSelector(bytes4(keccak256("addGuardian(address)")), guardians[i])
            );
            if (!_success) revert InitializationFailed(string(abi.encodePacked("Guardian add failed: ", _result)));
        }

        (bool success, bytes memory result) = wallet.call(
            abi.encodeWithSelector(bytes4(keccak256("setRequiredGuardians(uint256)")), requiredGuardians)
        );
        if (!success) revert InitializationFailed(string(abi.encodePacked("Set guardians failed: ", result)));

        return wallet;
    }

    /// @notice Creates a wallet with custom init data
    function createWalletWithInitData(WalletType walletType, address owner, bytes32 salt, bytes memory initData)
        external
        nonReentrant
        whenNotPaused
        returns (address wallet)
    {
        if (owner == address(0) || owner.code.length > 0) revert InvalidOwner(owner);

        address implementation;
        if (walletType == WalletType.CustodialCore) {
            implementation = _custodialWalletCoreImpl;
            if (initData.length < 4 || bytes4(initData) != bytes4(keccak256("initialize(address,address)"))) {
                revert InvalidInitData("Invalid CustodialCore init data");
            }
        } else if (walletType == WalletType.CustodialAdvanced) {
            implementation = _custodialWalletAdvancedImpl;
            if (initData.length < 4 || bytes4(initData) != bytes4(keccak256("initialize(address,address,address)"))) {
                revert InvalidInitData("Invalid CustodialAdvanced init data");
            }
        } else if (walletType == WalletType.MPC) {
            implementation = _mpcWalletImpl;
            if (initData.length < 4 || bytes4(initData) != bytes4(keccak256("initialize(address[],uint256)"))) {
                revert InvalidInitData("Invalid MPC init data");
            }
        } else if (walletType == WalletType.Smart) {
            implementation = _smartWalletImpl;
            if (initData.length < 4 || bytes4(initData) != bytes4(keccak256("initialize(address)"))) {
                revert InvalidInitData("Invalid Smart init data");
            }
        } else {
            revert InvalidWalletType();
        }

        return _createWallet(implementation, initData, walletType, owner, salt);
    }

    /// @notice Deploys and initializes a wallet
    function _createWallet(address implementation, bytes memory initData, WalletType walletType, address owner, bytes32 salt)
        private
        returns (address wallet)
    {
        if (implementation == address(0)) revert InvalidAddress(implementation, "Implementation not set");

        wallet = Clones.cloneDeterministic(implementation, salt);
        (bool success, bytes memory result) = wallet.call(initData);
        if (!success) {
            string memory reason = result.length > 0 ? string(abi.encodePacked("Initialization failed: ", result)) : "Unknown initialization error";
            revert InitializationFailed(reason);
        }

        try IWallet(wallet).owner() returns (address actualOwner) {
            if (actualOwner != owner) revert OwnershipMismatch(owner, actualOwner);
        } catch {
            revert InvalidAddress(wallet, "Invalid wallet interface");
        }

        // Map RyzerFactory.WalletType to IWalletRegistry.WalletType
        IWalletRegistry.WalletType registryWalletType;
        if (walletType == WalletType.CustodialCore || walletType == WalletType.CustodialAdvanced) {
            registryWalletType = IWalletRegistry.WalletType.Custodial;
        } else if (walletType == WalletType.MPC) {
            registryWalletType = IWalletRegistry.WalletType.MPC;
        } else if (walletType == WalletType.Smart) {
            registryWalletType = IWalletRegistry.WalletType.Smart;
        } else {
            revert InvalidWalletType();
        }

        IWalletRegistry(_registry).registerWallet(wallet, owner, registryWalletType);
        emit WalletCreated(wallet, walletType, owner, salt);

        return wallet;
    }

    /// @notice Encodes initData for CustodialWalletCore
    function encodeCustodialCoreInitData(address admin, address coldStorage) external pure returns (bytes memory initData) {
        if (admin == address(0) || coldStorage == address(0)) revert InvalidOwner(admin);
        return abi.encodeWithSelector(bytes4(keccak256("initialize(address,address)")), admin, coldStorage);
    }

    /// @notice Encodes initData for CustodialWalletAdvanced
    function encodeCustodialAdvancedInitData(address admin, address coldStorage, address bridgeAddress) external pure returns (bytes memory initData) {
        if (admin == address(0) || coldStorage == address(0)) revert InvalidOwner(admin);
        return abi.encodeWithSelector(bytes4(keccak256("initialize(address,address,address)")), admin, coldStorage, bridgeAddress);
    }

    /// @notice Encodes initData for MPCWallet
    function encodeMPCInitData(address[] memory owners, uint256 threshold) external pure returns (bytes memory initData) {
        if (owners.length < 2 || owners.length > 5) revert InvalidMPCOwners(owners.length);
        if (threshold == 0 || threshold > owners.length) revert InvalidInitData("Invalid threshold");
        return abi.encodeWithSelector(bytes4(keccak256("initialize(address[],uint256)")), owners, threshold);
    }

    /// @notice Encodes initData for SmartWallet
    function encodeSmartInitData(address admin) external pure returns (bytes memory initData) {
        if (admin == address(0)) revert InvalidOwner(admin);
        return abi.encodeWithSelector(bytes4(keccak256("initialize(address)")), admin);
    }

    /// @notice Predicts wallet address
    function predictWalletAddress(address implementation, bytes32 salt) external view returns (address predictedAddress) {
        if (implementation == address(0)) revert InvalidAddress(implementation, "Invalid implementation");
        return Clones.predictDeterministicAddress(implementation, salt, address(this));
    }

    /// @notice Updates an implementation
    function setImplementation(WalletType walletType, address implementation) external onlyOwner {
        if (implementation == address(0) || implementation.code.length == 0) revert InvalidAddress(implementation, "Invalid implementation");

        bytes4 selector;
        bool success;
        if (walletType == WalletType.CustodialCore) {
            selector = bytes4(keccak256("initialize(address,address)"));
            (success, ) = implementation.call(abi.encodeWithSelector(selector, address(this), address(this)));
        } else if (walletType == WalletType.CustodialAdvanced) {
            selector = bytes4(keccak256("initialize(address,address,address)"));
            (success, ) = implementation.call(abi.encodeWithSelector(selector, address(this), address(this), address(0)));
        } else if (walletType == WalletType.MPC) {
            selector = bytes4(keccak256("initialize(address[],uint256)"));
            address[] memory owners = new address[](2);
            owners[0] = address(this);
            owners[1] = address(0x1);
            (success, ) = implementation.call(abi.encodeWithSelector(selector, owners, 2));
        } else if (walletType == WalletType.Smart) {
            selector = bytes4(keccak256("initialize(address)"));
            (success, ) = implementation.call(abi.encodeWithSelector(selector, address(this)));
        } else {
            revert InvalidWalletType();
        }

        if (!success) revert InvalidAddress(implementation, "Invalid initialize function");

        address oldImplementation;
        if (walletType == WalletType.CustodialCore) {
            oldImplementation = _custodialWalletCoreImpl;
            _custodialWalletCoreImpl = implementation;
        } else if (walletType == WalletType.CustodialAdvanced) {
            oldImplementation = _custodialWalletAdvancedImpl;
            _custodialWalletAdvancedImpl = implementation;
        } else if (walletType == WalletType.MPC) {
            oldImplementation = _mpcWalletImpl;
            _mpcWalletImpl = implementation;
        } else if (walletType == WalletType.Smart) {
            oldImplementation = _smartWalletImpl;
            _smartWalletImpl = implementation;
        }

        emit ImplementationUpdated(walletType, oldImplementation, implementation);
    }

    /// @notice Updates the registry
    function setRegistry(address newRegistry) external onlyOwner {
        if (newRegistry == address(0) || newRegistry.code.length == 0) revert InvalidAddress(newRegistry, "Invalid registry");
        if (newRegistry == _registry) revert SameRegistry(newRegistry);

        try IWalletRegistry(newRegistry).registerWallet(address(0), address(0), IWalletRegistry.WalletType.Custodial) {} catch {
            revert InvalidAddress(newRegistry, "Invalid registry implementation");
        }

        address oldRegistry = _registry;
        _registry = newRegistry;
        emit RegistryUpdated(msg.sender, oldRegistry, newRegistry);
    }

    /// @notice Grants a role in the WalletRegistry
    /// @dev Only callable by the owner; forwards to WalletRegistry's grantRole
    function grantRole(bytes32 role, address account) external onlyOwner {
        if (account == address(0)) revert InvalidAddress(account, "Invalid account");
        IWalletRegistry(_registry).grantRole(role, account);
        emit RoleGranted(msg.sender, role, account);
    }

    /// @notice Sets KYC status for a wallet
    /// @dev Only callable by the owner; assumes wallet implements setKycStatus
    function setKycStatus(address wallet, bool status) external onlyOwner {
        if (wallet == address(0) || wallet.code.length == 0) revert InvalidAddress(wallet, "Invalid wallet");
        IWallet(wallet).setKycStatus(status);
        emit KycStatusUpdated(msg.sender, wallet, status);
    }

    // View functions
    function getImplementation(WalletType walletType) external view returns (address) {
        if (walletType == WalletType.CustodialCore) return _custodialWalletCoreImpl;
        if (walletType == WalletType.CustodialAdvanced) return _custodialWalletAdvancedImpl;
        if (walletType == WalletType.MPC) return _mpcWalletImpl;
        if (walletType == WalletType.Smart) return _smartWalletImpl;
        revert InvalidWalletType();
    }

    function getFactoryConfig() external view returns (address custodialCoreImpl, address custodialAdvancedImpl, address mpcImpl, address smartImpl) {
        return (_custodialWalletCoreImpl, _custodialWalletAdvancedImpl, _mpcWalletImpl, _smartWalletImpl);
    }

    function getRegistry() external view returns (address) {
        return _registry;
    }

    function getVersion() external view returns (string memory) {
        return _version;
    }

    function pause() external onlyOwner {
        _pause();
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        _unpause();
        emit Unpaused(msg.sender);
    }

    function _authorizeUpgrade(address newImplementation) internal view override onlyOwner {
        if (newImplementation == address(0) || newImplementation.code.length == 0) revert InvalidAddress(newImplementation, "Invalid implementation");
    }

    uint256[48] private __gap;
}