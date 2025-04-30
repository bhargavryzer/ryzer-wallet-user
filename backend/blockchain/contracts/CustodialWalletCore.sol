// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import "@openzeppelin/contracts-upgradeable@5.0.2/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable@5.0.2/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable@5.0.2/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable@5.0.2/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "./WalletUtils.sol";
import "./BaseWallet.sol";

interface IWallet {
    function owner() external view returns (address);
}

contract CustodialWalletCore is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable, PausableUpgradeable, IWallet {
    using WalletUtils for address;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    bytes32 public constant CUSTODIAN_ROLE = keccak256("CUSTODIAN_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    struct WithdrawalRequest {
        address token;
        address recipient;
        uint256 amount;
        uint48 requestTime;
        bool approved;
    }

    struct WithdrawalPolicy {
        uint256 maxWithdrawalLimit;
        uint256 dailyLimit;
        uint256 dailySpent;
        uint256 lastResetTimestamp;
        uint48 extraTimelock;
        bool whitelistRequired;
    }

    address internal _admin;
    address internal _custodian;
    address internal _coldStorageAddress;
    mapping(address => bool) internal _kycVerified;
    mapping(bytes32 => WithdrawalRequest) internal _withdrawalRequests;
    mapping(address => mapping(address => uint256)) internal _tokenAllowances;
    mapping(address => bool) internal _trackedTokens;
    mapping(uint256 => address) internal _tokenList;
    uint256 internal _tokenCount;
    mapping(address => bool) internal _whitelistedRecipients;
    mapping(address => WithdrawalPolicy) internal _withdrawalPolicies;
    bool internal _emergencyStopped;
    string internal _version;
    uint48 internal _withdrawalDelay;

    uint48 internal constant MIN_WITHDRAWAL_DELAY = 1 days;
    uint48 internal constant DEFAULT_WITHDRAWAL_DELAY = 1 days;
    uint256 internal constant SECONDS_PER_DAY = 1 days;

    event Initialized(address indexed admin, address indexed custodian, string version);
    event Deposit(address indexed user, address indexed token, uint256 amount);
    event Withdrawal(address indexed user, address indexed token, uint256 amount, address indexed recipient);
    event WithdrawalRequested(bytes32 indexed requestId, address indexed user, address indexed token, uint256 amount, address recipient);
    event WithdrawalApproved(bytes32 indexed requestId);
    event KycStatusUpdated(address indexed user, bool status);
    event CustodianUpdated(address indexed oldCustodian, address indexed newCustodian);
    event EmergencyStop(address indexed operator);
    event EmergencyStopLifted(address indexed operator);
    event WithdrawalDelayUpdated(address indexed operator, uint48 oldDelay, uint48 newDelay);
    event TokenTracked(address indexed token);
    event TokenRemoved(address indexed token);
    event WithdrawalPolicyUpdated(address indexed token, uint256 maxWithdrawalLimit, uint48 extraTimelock, bool whitelistRequired, uint256 dailyLimit);
    event RecipientWhitelisted(address indexed recipient, bool status);
    event ColdStorageTransfer(address indexed token, uint256 amount, address indexed coldStorage);
    event DailyLimitReset(address indexed token, uint256 resetTimestamp);

    error KycNotVerified(address user);
    error NotCustodian(address caller);
    error InvalidWithdrawalRequest(bytes32 requestId);
    error WithdrawalNotApproved(bytes32 requestId);
    error WithdrawalDelayNotElapsed(bytes32 requestId);
    error SameCustodian(address custodian);
    error Unauthorized(address caller, bytes32 role);
    error EmergencyStopActive();
    error InvalidWithdrawalDelay(uint48 delay);
    error CustodialWalletInitializationFailed(string reason);
    error WithdrawalPolicyViolation(address token, string reason);
    error RecipientNotWhitelisted(address recipient);
    error InvalidColdStorageAddress(address coldStorage);
    error TokenNotTracked(address token);
    error InvalidAddress(address Address,string message);
    error InvalidTokenAddress(address token);

    modifier whenNotEmergencyStopped() {
        if (_emergencyStopped) revert EmergencyStopActive();
        _;
    }

   function initialize(address admin_, address coldStorageAddress_) public virtual initializer {
        if (admin_ == address(0)) revert CustodialWalletInitializationFailed("Zero admin address");
        if (admin_.code.length > 0) revert CustodialWalletInitializationFailed("Admin is contract");
        if (coldStorageAddress_ == address(0)) revert InvalidColdStorageAddress(coldStorageAddress_);
        if (coldStorageAddress_.code.length > 0) revert InvalidColdStorageAddress(coldStorageAddress_);

        __AccessControl_init();
        __ReentrancyGuard_init();
        __Pausable_init();

        _admin = admin_;
        _custodian = admin_;
        _coldStorageAddress = coldStorageAddress_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(CUSTODIAN_ROLE, admin_);
        _grantRole(PAUSER_ROLE, admin_);

        _withdrawalDelay = DEFAULT_WITHDRAWAL_DELAY;
        _version = "5.0.0";
        _tokenCount = 1;
        _trackedTokens[address(0)] = true;
        _tokenList[0] = address(0);

        emit Initialized(admin_, admin_, _version);
        emit CustodianUpdated(address(0), admin_);
        emit TokenTracked(address(0));
    }

    function deposit(address token, uint256 amount) external payable nonReentrant whenNotPaused whenNotEmergencyStopped {
        if (!_kycVerified[msg.sender]) revert KycNotVerified(msg.sender);
        token.validateToken();
        if (token == address(0) && msg.value != amount) revert InvalidAddress(address(0), "Incorrect XDC amount");
        if (token != address(0) && msg.value != 0) revert InvalidAddress(address(0), "XDC not allowed for token deposit");

        if (token != address(0)) {
            IERC20Upgradeable(token).safeTransferFrom(msg.sender, address(this), amount);
            if (!_trackedTokens[token]) {
                _trackedTokens[token] = true;
                _tokenList[_tokenCount] = token;
                ++_tokenCount;
                emit TokenTracked(token);
            }
        }
        emit Deposit(msg.sender, token, amount);
    }

    // Internal function to handle core withdrawal request logic
    function _requestWithdrawalCore(
        address token,
        uint256 amount,
        address recipient
    ) internal virtual returns (bytes32 requestId) {
        if (!_kycVerified[msg.sender]) revert KycNotVerified(msg.sender);
        token.validateToken();
        if (recipient == address(0)) revert InvalidAddress(recipient, "Zero recipient address");

        WithdrawalPolicy storage policy = _withdrawalPolicies[token];
        if (policy.maxWithdrawalLimit != 0 && amount > policy.maxWithdrawalLimit) {
            revert WithdrawalPolicyViolation(token, "Exceeds max withdrawal limit");
        }
        if (policy.whitelistRequired && !_whitelistedRecipients[recipient]) {
            revert RecipientNotWhitelisted(recipient);
        }
        if (policy.dailyLimit != 0) {
            if (block.timestamp >= policy.lastResetTimestamp + SECONDS_PER_DAY) {
                policy.lastResetTimestamp = block.timestamp;
                policy.dailySpent = 0;
                emit DailyLimitReset(token, block.timestamp);
            }
            if (policy.dailySpent + amount > policy.dailyLimit) {
                revert WithdrawalPolicyViolation(token, "Exceeds daily limit");
            }
            policy.dailySpent += amount;
        }

        uint256 normalizedAmount = token.normalizeAmount(amount);
        token.validateBalance(normalizedAmount, address(this));

        requestId = keccak256(abi.encodePacked(msg.sender, token, normalizedAmount, recipient, block.timestamp));
        _withdrawalRequests[requestId] = WithdrawalRequest({
            token: token,
            recipient: recipient,
            amount: normalizedAmount,
            requestTime: uint48(block.timestamp),
            approved: false
        });

        emit WithdrawalRequested(requestId, msg.sender, token, normalizedAmount, recipient);
    }

    function requestWithdrawal(
        address token,
        uint256 amount,
        address recipient
    ) external virtual nonReentrant whenNotPaused whenNotEmergencyStopped returns (bytes32 requestId) {
        requestId = _requestWithdrawalCore(token, amount, recipient);
    }

    function approveWithdrawal(bytes32 requestId) external onlyRole(DEFAULT_ADMIN_ROLE) whenNotPaused whenNotEmergencyStopped {
        WithdrawalRequest storage request = _withdrawalRequests[requestId];
        if (request.requestTime == 0) revert InvalidWithdrawalRequest(requestId);
        if (request.approved) revert WithdrawalNotApproved(requestId);

        request.approved = true;
        emit WithdrawalApproved(requestId);
    }

    function executeWithdrawal(bytes32 requestId) external virtual nonReentrant whenNotPaused whenNotEmergencyStopped onlyRole(CUSTODIAN_ROLE) {
        WithdrawalRequest storage request = _withdrawalRequests[requestId];
        if (request.requestTime == 0) revert InvalidWithdrawalRequest(requestId);
        if (!request.approved) revert WithdrawalNotApproved(requestId);

        WithdrawalPolicy storage policy = _withdrawalPolicies[request.token];
        uint48 totalDelay = _withdrawalDelay + (policy.extraTimelock != 0 && request.amount > policy.maxWithdrawalLimit ? policy.extraTimelock : 0);
        if (block.timestamp < request.requestTime + totalDelay) revert WithdrawalDelayNotElapsed(requestId);

        uint256 transferAmount = request.token.denormalizeAmount(request.amount);
        delete _withdrawalRequests[requestId];
        request.token.transferToken(request.recipient, transferAmount, address(this));

        emit Withdrawal(msg.sender, request.token, transferAmount, request.recipient);
    }

    function moveToColdStorage(address token, uint256 amount) external nonReentrant whenNotPaused whenNotEmergencyStopped onlyRole(DEFAULT_ADMIN_ROLE) {
        token.validateToken();
        uint256 transferAmount = token.denormalizeAmount(amount);
        token.transferToken(_coldStorageAddress, transferAmount, address(this));
        emit ColdStorageTransfer(token, transferAmount, _coldStorageAddress);
    }

    function setKycStatus(address user, bool status) external whenNotPaused whenNotEmergencyStopped onlyRole(CUSTODIAN_ROLE) {
        if (user == address(0)) revert InvalidAddress(user, "Zero user address");
        if (_kycVerified[user] != status) {
            _kycVerified[user] = status;
            emit KycStatusUpdated(user, status);
        }
    }

    function updateCustodian(address newCustodian) external onlyRole(DEFAULT_ADMIN_ROLE) whenNotPaused whenNotEmergencyStopped {
        if (newCustodian == address(0)) revert InvalidAddress(newCustodian, "Zero custodian address");
        if (newCustodian.code.length > 0) revert InvalidAddress(newCustodian, "Custodian is contract");
        if (newCustodian == _custodian) revert SameCustodian(newCustodian);

        address oldCustodian = _custodian;
        _revokeRole(CUSTODIAN_ROLE, oldCustodian);
        _grantRole(CUSTODIAN_ROLE, newCustodian);
        _custodian = newCustodian;

        emit CustodianUpdated(oldCustodian, newCustodian);
    }

    function setWithdrawalDelay(uint48 newDelay) external onlyRole(DEFAULT_ADMIN_ROLE) whenNotPaused whenNotEmergencyStopped {
        if (newDelay < MIN_WITHDRAWAL_DELAY) revert InvalidWithdrawalDelay(newDelay);
        uint48 oldDelay = _withdrawalDelay;
        _withdrawalDelay = newDelay;
        emit WithdrawalDelayUpdated(msg.sender, oldDelay, newDelay);
    }

    function setWithdrawalPolicy(
        address token,
        uint256 maxWithdrawalLimit,
        uint48 extraTimelock,
        bool whitelistRequired,
        uint256 dailyLimit
    ) external onlyRole(DEFAULT_ADMIN_ROLE) whenNotPaused whenNotEmergencyStopped {
        token.validateToken();
        WithdrawalPolicy storage policy = _withdrawalPolicies[token];
        policy.maxWithdrawalLimit = maxWithdrawalLimit;
        policy.extraTimelock = extraTimelock;
        policy.whitelistRequired = whitelistRequired;
        policy.dailyLimit = dailyLimit;
        policy.lastResetTimestamp = block.timestamp;
        policy.dailySpent = 0;
        emit WithdrawalPolicyUpdated(token, maxWithdrawalLimit, extraTimelock, whitelistRequired, dailyLimit);
    }

    function setRecipientWhitelist(address recipient, bool status) external onlyRole(DEFAULT_ADMIN_ROLE) whenNotPaused whenNotEmergencyStopped {
        if (recipient == address(0)) revert InvalidAddress(recipient, "Zero recipient address");
        if (_whitelistedRecipients[recipient] != status) {
            _whitelistedRecipients[recipient] = status;
            emit RecipientWhitelisted(recipient, status);
        }
    }

    function removeTrackedToken(address token) external onlyRole(DEFAULT_ADMIN_ROLE) whenNotPaused whenNotEmergencyStopped {
        if (!_trackedTokens[token]) revert TokenNotTracked(token);
        if (token == address(0)) revert InvalidTokenAddress(token);
        if (IERC20(token).balanceOf(address(this)) != 0) revert TokenNotTracked(token);

        for (uint256 i = 0; i < _tokenCount; ++i) {
            if (_tokenList[i] == token) {
                _tokenList[i] = _tokenList[_tokenCount - 1];
                delete _tokenList[_tokenCount - 1];
                --_tokenCount;
                break;
            }
        }
        delete _trackedTokens[token];
        emit TokenRemoved(token);
    }

    function emergencyStop() external onlyRole(PAUSER_ROLE) {
        _emergencyStopped = true;
        _pause();
        emit EmergencyStop(msg.sender);
    }

    function liftEmergencyStop() external onlyRole(PAUSER_ROLE) {
        _emergencyStopped = false;
        _unpause();
        emit EmergencyStopLifted(msg.sender);
    }

    function owner() external view override returns (address) {
        return _admin;
    }

    function getCustodian() external view returns (address) {
        return _custodian;
    }

    function getColdStorageAddress() external view returns (address) {
        return _coldStorageAddress;
    }

    function isKycVerified(address user) external view returns (bool) {
        return _kycVerified[user];
    }

    function getWithdrawalRequest(bytes32 requestId) external view returns (WithdrawalRequest memory) {
        return _withdrawalRequests[requestId];
    }

    function getWithdrawalPolicy(address token) external view returns (WithdrawalPolicy memory) {
        return _withdrawalPolicies[token];
    }

    function getVersion() external view virtual returns (string memory) {
        return _version;
    }

    function getWithdrawalDelay() external view returns (uint48) {
        return _withdrawalDelay;
    }

    function isEmergencyStopped() external view returns (bool) {
        return _emergencyStopped;
    }    

    function getTokenCount() external view returns (uint256) {
        return _tokenCount;
    }

    function isWhitelistedRecipient(address recipient) external view returns (bool) {
        return _whitelistedRecipients[recipient];
    }

    uint256[50] private __gap;
}