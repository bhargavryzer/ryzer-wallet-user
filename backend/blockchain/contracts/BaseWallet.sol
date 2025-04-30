// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import "@openzeppelin/contracts-upgradeable@5.0.2/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable@5.0.2/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable@5.0.2/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable@5.0.2/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts@5.0.2/utils/Address.sol";
import "@openzeppelin/contracts@5.0.2/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts@5.0.2/token/ERC20/IERC20.sol";

interface IERC20MetadataUpgradeable  {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
}
/// @title BaseWallet - Abstract base contract for wallet and cross-chain bridge functionality
/// @notice Provides core wallet operations (pausing, external calls, gas reimbursement) and cross-chain token bridging
/// @dev Inheriting contracts must implement isOwner. Uses UUPS proxy, AccessControl, and ReentrancyGuard.
/// @custom:security-contact security@x.ai
abstract contract BaseWallet is Initializable, PausableUpgradeable, ReentrancyGuardUpgradeable, AccessControlUpgradeable {
    using Address for address;
    using SafeERC20 for IERC20;

    // Roles
    bytes32 internal constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 internal constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 internal constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");

    // State variables
    uint48 private _chainId_;
    bool private _enforceChainId_;
    mapping(address recipient => mapping(bytes32 chainId => mapping(uint256 nonce => bool used))) private _bridgeNonces_;

    // Structs
    struct CallResult {
        bool success;
        bytes data;
    }

    // Events
    event ExternalCallExecuted(address indexed sender, address indexed target, uint256 value, bytes data);
    event GasReimbursed(address indexed sender, address indexed recipient, uint256 amount);
    event ContractPaused(address indexed sender);
    event ContractUnpaused(address indexed sender);
    event ChainIdValidationUpdated(address indexed sender, bool enforce);
    event TokensLocked(address indexed token, address indexed recipient, uint256 amount, bytes32 indexed chainId, uint256 nonce);
    event TokensMinted(address indexed token, address indexed recipient, uint256 amount, bytes32 indexed chainId, uint256 nonce);
    event TokensBurned(address indexed token, address indexed recipient, uint256 amount, bytes32 indexed chainId, uint256 nonce);
    event TokensReleased(address indexed token, address indexed recipient, uint256 amount, bytes32 indexed chainId, uint256 nonce);

    // Errors
    error InitializationFailed(string reason);
    error ExternalCallFailed(address target, bytes data);
    error InvalidChainId(uint48 chainId);
    error InsufficientBalance(uint256 amount);
    error InvalidAddress(address addr, string reason);
    error NotOwner(address caller);
    error InvalidTokenAddress(address token);
    error AmountZero();
    error NonceUsed(uint256 nonce);
    error InvalidChainIdParameter(bytes32 chainId);
    error InvalidTargetContract(address target);


    /// @notice Initializes the base wallet and bridge
    /// @dev Sets the chain ID, enables chain ID validation, and assigns roles. Callable only once.
    /// @param admin The admin address to assign roles
    function __BaseWallet_init(address admin) internal onlyInitializing {
        if (admin == address(0)) revert InvalidAddress(admin, "Zero admin address");
        __Pausable_init();
        __ReentrancyGuard_init();
        __AccessControl_init();

        uint48 chainId = uint48(block.chainid);
        if (chainId == 0) revert InitializationFailed("Invalid chain ID");
        _chainId_ = chainId;
        _enforceChainId_ = true;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(BRIDGE_ROLE, admin);
    }

    /// @notice Checks if an address is an owner
    /// @param account Address to check
    /// @return True if the address is an owner
    function isOwner(address account) public view virtual returns (bool);

    /// @notice Modifier to restrict access to owners
    modifier onlyOwner() {
        if (!isOwner(msg.sender)) revert NotOwner(msg.sender);
        _;
    }
    
    function selfbalance() public view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Executes an external contract call
    /// @param to Target address
    /// @param value ETH value to send
    /// @param data Call data
    /// @return result Struct containing success flag and return data
    function executeExternalCall(address to, uint256 value, bytes memory data)
        public
        virtual
        nonReentrant
        whenNotPaused
        onlyOwner
        returns (CallResult memory result)
    {
        if (_enforceChainId_ && block.chainid != _chainId_) revert InvalidChainId(uint48(block.chainid));
        if (to == address(0)) revert InvalidAddress(to, "Zero target address");
        if (to == address(this)) revert InvalidAddress(to, "Self-call not allowed");
        if (to.code.length == 0) revert InvalidTargetContract(to);
        if (selfbalance() < value) revert InsufficientBalance(value);

        (result.success, result.data) = to.call{value: value}(data);
        if (!result.success) revert ExternalCallFailed(to, data);
        emit ExternalCallExecuted(msg.sender, to, value, data);
    }

    /// @notice Reimburses gas costs to a recipient
    /// @param recipient The address to receive the reimbursement
    /// @param amount The amount of ETH to reimburse
    function reimburseGas(address recipient, uint256 amount) public virtual nonReentrant whenNotPaused onlyOwner {
        if (recipient == address(0)) revert InvalidAddress(recipient, "Zero recipient address");
        if (recipient == address(this)) revert InvalidAddress(recipient, "Self-reimbursement not allowed");
        if (selfbalance() < amount) revert InsufficientBalance(amount);

        (bool success, ) = recipient.call{value: amount}("");
        if (!success) revert InvalidAddress(recipient, "Reimbursement failed");
        emit GasReimbursed(msg.sender, recipient, amount);
    }

    /// @notice Locks tokens for cross-chain transfer
    /// @param token The ERC-20 token address
    /// @param amount The amount to lock
    /// @param recipient The recipient on the target chain
    /// @param chainId The target chain ID
    /// @param nonce The unique nonce for the operation
    function lockTokens(address token, uint256 amount, address recipient, bytes32 chainId, uint256 nonce)
        external
        nonReentrant
        whenNotPaused
        onlyRole(BRIDGE_ROLE)
    {
        if (token == address(0)) revert InvalidTokenAddress(token);
        if (token == address(this)) revert InvalidAddress(token, "Self-interaction not allowed");
        if (token.code.length == 0) revert InvalidTargetContract(token);
        if (amount == 0) revert AmountZero();
        if (recipient == address(0)) revert InvalidAddress(recipient, "Zero recipient address");
        if (chainId == bytes32(0)) revert InvalidChainIdParameter(chainId);
        if (_bridgeNonces_[recipient][chainId][nonce]) revert NonceUsed(nonce);

        // Validate token decimals
        try IERC20MetadataUpgradeable(token).decimals() returns (uint8 decimals) {
            if (decimals > 18) revert InvalidTokenAddress(token);
        } catch {
            revert InvalidTokenAddress(token);
        }

        _bridgeNonces_[recipient][chainId][nonce] = true;
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit TokensLocked(token, recipient, amount, chainId, nonce);
    }

    /// @notice Mints tokens on the target chain
    /// @param token The ERC-20 token address
    /// @param amount The amount to mint
    /// @param recipient The recipient address
    /// @param chainId The source chain ID
    /// @param nonce The unique nonce for the operation
    function mintTokens(address token, uint256 amount, address recipient, bytes32 chainId, uint256 nonce)
        external
        nonReentrant
        whenNotPaused
        onlyRole(BRIDGE_ROLE)
    {
        if (token == address(0)) revert InvalidTokenAddress(token);
        if (token == address(this)) revert InvalidAddress(token, "Self-interaction not allowed");
        if (token.code.length == 0) revert InvalidTargetContract(token);
        if (amount == 0) revert AmountZero();
        if (recipient == address(0)) revert InvalidAddress(recipient, "Zero recipient address");
        if (chainId == bytes32(0)) revert InvalidChainIdParameter(chainId);
        if (_bridgeNonces_[recipient][chainId][nonce]) revert NonceUsed(nonce);

        // Validate token decimals
        try IERC20MetadataUpgradeable(token).decimals() returns (uint8 decimals) {
            if (decimals > 18) revert InvalidTokenAddress(token);
        } catch {
            revert InvalidTokenAddress(token);
        }

        _bridgeNonces_[recipient][chainId][nonce] = true;
        IERC20(token).safeTransfer(recipient, amount);
        emit TokensMinted(token, recipient, amount, chainId, nonce);
    }

    /// @notice Burns tokens for cross-chain transfer
    /// @param token The ERC-20 token address
    /// @param amount The amount to burn
    /// @param recipient The recipient on the target chain
    /// @param chainId The target chain ID
    /// @param nonce The unique nonce for the operation
    function burnTokens(address token, uint256 amount, address recipient, bytes32 chainId, uint256 nonce)
        external
        nonReentrant
        whenNotPaused
        onlyRole(BRIDGE_ROLE)
    {
        if (token == address(0)) revert InvalidTokenAddress(token);
        if (token == address(this)) revert InvalidAddress(token, "Self-interaction not allowed");
        if (token.code.length == 0) revert InvalidTargetContract(token);
        if (amount == 0) revert AmountZero();
        if (recipient == address(0)) revert InvalidAddress(recipient, "Zero recipient address");
        if (chainId == bytes32(0)) revert InvalidChainIdParameter(chainId);
        if (_bridgeNonces_[recipient][chainId][nonce]) revert NonceUsed(nonce);

        // Validate token decimals
        try IERC20MetadataUpgradeable(token).decimals() returns (uint8 decimals) {
            if (decimals > 18) revert InvalidTokenAddress(token);
        } catch {
            revert InvalidTokenAddress(token);
        }

        _bridgeNonces_[recipient][chainId][nonce] = true;
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit TokensBurned(token, recipient, amount, chainId, nonce);
    }

    /// @notice Releases tokens on the source chain
    /// @param token The ERC-20 token address
    /// @param amount The amount to release
    /// @param recipient The recipient address
    /// @param chainId The source chain ID
    /// @param nonce The unique nonce for the operation
    function releaseTokens(address token, uint256 amount, address recipient, bytes32 chainId, uint256 nonce)
        external
        nonReentrant
        whenNotPaused
        onlyRole(BRIDGE_ROLE)
    {
        if (token == address(0)) revert InvalidTokenAddress(token);
        if (token == address(this)) revert InvalidAddress(token, "Self-interaction not allowed");
        if (token.code.length == 0) revert InvalidTargetContract(token);
        if (amount == 0) revert AmountZero();
        if (recipient == address(0)) revert InvalidAddress(recipient, "Zero recipient address");
        if (chainId == bytes32(0)) revert InvalidChainIdParameter(chainId);
        if (_bridgeNonces_[recipient][chainId][nonce]) revert NonceUsed(nonce);

        // Validate token decimals
        try IERC20MetadataUpgradeable(token).decimals() returns (uint8 decimals) {
            if (decimals > 18) revert InvalidTokenAddress(token);
        } catch {
            revert InvalidTokenAddress(token);
        }

        _bridgeNonces_[recipient][chainId][nonce] = true;
        IERC20(token).safeTransfer(recipient, amount);
        emit TokensReleased(token, recipient, amount, chainId, nonce);
    }

    /// @notice Pauses the contract
    function pause() public virtual onlyOwner {
        _pause();
        emit ContractPaused(msg.sender);
    }

    /// @notice Unpauses the contract
    function unpause() public virtual onlyOwner {
        _unpause();
        emit ContractUnpaused(msg.sender);
    }

    /// @notice Toggles chain ID validation
    /// @param enforce Whether to enforce chain ID validation
    function setChainIdValidation(bool enforce) external onlyOwner {
        _enforceChainId_ = enforce;
        emit ChainIdValidationUpdated(msg.sender, enforce);
    }

    // View functions
    /// @notice Gets the chain ID
    /// @return The chain ID set during initialization
    function getChainId() external view returns (uint48) {
        return _chainId_;
    }

    /// @notice Checks if a bridge nonce is used
    /// @param recipient The recipient address
    /// @param chainId The chain ID
    /// @param nonce The nonce to check
    /// @return True if the nonce is used
    function isNonceUsed(address recipient, bytes32 chainId, uint256 nonce) external view returns (bool) {
        return _bridgeNonces_[recipient][chainId][nonce];
    }

    /// @notice Checks if chain ID validation is enforced
    /// @return True if chain ID validation is enforced
    function isChainIdEnforced() external view returns (bool) {
        return _enforceChainId_;
    }

    // Storage gap for future upgrades
    uint256[49] private __gap;
}