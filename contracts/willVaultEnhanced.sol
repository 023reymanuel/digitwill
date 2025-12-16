// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract WillVaultEnhanced is Ownable, ReentrancyGuard, Pausable {
    // Your existing state variables...
    bytes32 public dataHash;
    address[] public guardians;
    uint256 public confirmationsNeeded;
    uint256 public currentConfirmations;
    bool public released;
    
    mapping(address => bool) public isConfirmed;
    
    // Your existing events...
    event VaultLocked(address indexed owner, bytes32 indexed dataHash);
    event GuardianConfirmed(address indexed guardian);
    event VaultReleased(address indexed owner, bytes32 indexed dataHash);
    event VaultPaused(address indexed pauser);
    event VaultUnpaused(address indexed unpauser);
    
    constructor(address[] memory _guardians, uint256 _confirmationsNeeded) Ownable(msg.sender) {
        // Your existing constructor logic...
        require(_guardians.length > 0, "Must have at least one guardian");
        require(_confirmationsNeeded > 0, "Confirmations needed must be > 0");
        require(_confirmationsNeeded <= _guardians.length, "Threshold too high");
        
        for (uint256 i = 0; i < _guardians.length; i++) {
            require(_guardians[i] != address(0), "Invalid guardian address");
            guardians.push(_guardians[i]);
        }
        
        confirmationsNeeded = _confirmationsNeeded;
    }
    
    // Enhanced with Pausable
    function lockVault(bytes32 _dataHash) external onlyOwner whenNotPaused {
        require(dataHash == bytes32(0), "Vault already locked");
        dataHash = _dataHash;
        emit VaultLocked(owner(), _dataHash);
    }
    
    // Enhanced with Pausable
    function confirmRelease() external nonReentrant whenNotPaused {
        require(_isGuardian(msg.sender), "Caller is not a guardian");
        require(dataHash != bytes32(0), "Vault not locked");
        require(!released, "Vault already released");
        require(!isConfirmed[msg.sender], "Already confirmed");
        
        isConfirmed[msg.sender] = true;
        currentConfirmations++;
        
        emit GuardianConfirmed(msg.sender);
        
        if (currentConfirmations >= confirmationsNeeded) {
            released = true;
            emit VaultReleased(owner(), dataHash);
        }
    }
    
    // NEW: Emergency pause functions using OpenZeppelin's Pausable
    function emergencyPause() external onlyOwner {
        _pause();
        emit VaultPaused(msg.sender);
    }
    
    function emergencyUnpause() external onlyOwner {
        _unpause();
        emit VaultUnpaused(msg.sender);
    }
    
    // Your existing view functions...
    function getGuardians() external view returns (address[] memory) {
        return guardians;
    }
    
    function guardianCount() external view returns (uint256) {
        return guardians.length;
    }
    
    function isGuardian(address addr) public view returns (bool) {
        return _isGuardian(addr);
    }
    
    function getReleaseStatus() external view returns (
        bytes32 _dataHash,
        uint256 _confirmationsNeeded,
        uint256 _currentConfirmations,
        bool _released
    ) {
        return (
            dataHash,
            confirmationsNeeded,
            currentConfirmations,
            released
        );
    }
    
    function _isGuardian(address addr) internal view returns (bool) {
        for (uint256 i = 0; i < guardians.length; i++) {
            if (guardians[i] == addr) {
                return true;
            }
        }
        return false;
    }
}