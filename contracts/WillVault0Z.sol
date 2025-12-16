// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Correct OpenZeppelin imports for Solidity
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol"; // CHANGED in v5!

/**
 * @title Digital Will Vault
 * @notice Multi-signature vault for digital wills
 */
contract WillVaultOZ is Ownable, ReentrancyGuard {
    bytes32 private _dataHash;
    address[] private _guardians;
    uint256 private _confirmationsNeeded;
    uint256 private _currentConfirmations;
    bool private _released;
    
    mapping(address => bool) private _isConfirmed;
    
    event VaultLocked(address indexed owner, bytes32 indexed dataHash);
    event GuardianConfirmed(address indexed guardian);
    event VaultReleased(address indexed owner, bytes32 indexed dataHash);
    
    constructor(address[] memory guardians, uint256 confirmationsNeeded) Ownable(msg.sender) {
        require(guardians.length > 0, "Must have at least one guardian");
        require(confirmationsNeeded > 0, "Confirmations needed must be > 0");
        require(confirmationsNeeded <= guardians.length, "Threshold too high");
        
        for (uint256 i = 0; i < guardians.length; i++) {
            require(guardians[i] != address(0), "Invalid guardian address");
            _guardians.push(guardians[i]);
        }
        
        _confirmationsNeeded = confirmationsNeeded;
    }
    
    function lockVault(bytes32 dataHash) external onlyOwner {
        require(_dataHash == bytes32(0), "Vault already locked");
        _dataHash = dataHash;
        emit VaultLocked(owner(), dataHash);
    }
    
    function confirmRelease() external nonReentrant {
        require(_isGuardian(msg.sender), "Caller is not a guardian");
        require(_dataHash != bytes32(0), "Vault not locked");
        require(!_released, "Vault already released");
        require(!_isConfirmed[msg.sender], "Already confirmed");
        
        _isConfirmed[msg.sender] = true;
        _currentConfirmations++;
        
        emit GuardianConfirmed(msg.sender);
        
        if (_currentConfirmations >= _confirmationsNeeded) {
            _released = true;
            emit VaultReleased(owner(), _dataHash);
        }
    }
    
    function getReleaseStatus() external view returns (
        bytes32 dataHash,
        uint256 confirmationsNeeded,
        uint256 currentConfirmations,
        bool released
    ) {
        return (
            _dataHash,
            _confirmationsNeeded,
            _currentConfirmations,
            _released
        );
    }
    
    function getGuardians() external view returns (address[] memory) {
        return _guardians;
    }
    
    function isGuardian(address addr) external view returns (bool) {
        return _isGuardian(addr);
    }
    
    function _isGuardian(address addr) internal view returns (bool) {
        for (uint256 i = 0; i < _guardians.length; i++) {
            if (_guardians[i] == addr) {
                return true;
            }
        }
        return false;
    }
}