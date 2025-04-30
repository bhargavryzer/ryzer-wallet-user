// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import "@openzeppelin/contracts@5.0.2/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts@5.0.2/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts@5.0.2/utils/Address.sol";

/// @title IERC20Metadata - Interface for ERC-20 decimals
interface IERC20Metadata is IERC20 {
    function decimals() external view returns (uint8);
}


library WalletUtils {
    using SafeERC20 for IERC20;
    using Address for address;

    error InvalidTokenAddress(address token);
    error InvalidAddress(address Address,string message);
    error InsufficientBalance(uint256 amount);
    error SelfInteractionNotAllowed(address addr);
    error AmountZero();

    function validateToken(address token) internal view {
        if (token != address(0)) {
            if (token.code.length == 0) revert InvalidTokenAddress(token);
        }
    }

    function normalizeAmount(address token, uint256 amount) internal view returns (uint256) {
        if (token == address(0)) return amount;
        try IERC20Metadata(token).decimals() returns (uint8 decimals) {
            if (decimals > 18) revert InvalidTokenAddress(token);
            return amount * 10 ** (18 - decimals);
        } catch {
            revert InvalidTokenAddress(token);
        }
    }

    function denormalizeAmount(address token, uint256 amount) internal view returns (uint256) {
        if (token == address(0)) return amount;
        try IERC20Metadata(token).decimals() returns (uint8 decimals) {
            if (decimals > 18) revert InvalidTokenAddress(token);
            return amount / 10 ** (18 - decimals);
        } catch {
            revert InvalidTokenAddress(token);
        }
    }

    function transferToken(address token, address recipient, uint256 amount, address self) internal {
        if (amount == 0) revert AmountZero();
        if (token == self) revert SelfInteractionNotAllowed(token);
        if (recipient == address(0)) revert InvalidAddress(recipient, "Zero recipient address");

        if (token == address(0)) {
            if (self.balance < amount) revert InsufficientBalance(amount);
            payable(recipient).transfer(amount);
        } else {
            if (IERC20(token).balanceOf(self) < amount) revert InsufficientBalance(amount);
            IERC20(token).safeTransfer(recipient, amount);
        }
    }

    function validateBalance(address token, uint256 amount, address self) internal view {
        if (token == address(0)) {
            if (self.balance < amount) revert InsufficientBalance(amount);
        } else {
            if (IERC20(token).balanceOf(self) < amount) revert InsufficientBalance(amount);
        }
    }
}