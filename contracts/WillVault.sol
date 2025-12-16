// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract WillVault is Ownable, ReentrancyGuard {
    // Public state variables
    bytes32 public dataHash;
    address[] public guardians;
    uint256 public confirmationsNeeded;
    uint256 public currentConfirmations;
    bool public released;
    
    mapping(address => bool) public isConfirmed;
    
    event VaultLocked(address indexed owner, bytes32 indexed dataHash);
    event GuardianConfirmed(address indexed guardian);
    event VaultReleased(address indexed owner, bytes32 indexed dataHash);
    
    constructor(address[] memory _guardians, uint256 _confirmationsNeeded) Ownable(msg.sender) {
        require(_guardians.length > 0, "Must have at least one guardian");
        require(_confirmationsNeeded > 0, "Confirmations needed must be > 0");
        require(_confirmationsNeeded <= _guardians.length, "Threshold too high");
        
        for (uint256 i = 0; i < _guardians.length; i++) {
            require(_guardians[i] != address(0), "Invalid guardian address");
            guardians.push(_guardians[i]);
        }
        
        confirmationsNeeded = _confirmationsNeeded;
    }
    
    function lockVault(bytes32 _dataHash) external onlyOwner {
        require(dataHash == bytes32(0), "Vault already locked");
        dataHash = _dataHash;
        emit VaultLocked(owner(), _dataHash);
    }
    
    function confirmRelease() external nonReentrant {
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
    
    // View functions - SIMPLIFIED: Use public variables and one helper
    function getGuardians() external view returns (address[] memory) {
        return guardians;
    }
    
    // Remove getGuardianCount - just use guardians.length or create a simple getter
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