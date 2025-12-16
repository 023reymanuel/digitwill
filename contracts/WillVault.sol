// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title Digital Will Vault
 * @dev A multi-signature vault for storing and releasing sensitive information
 * 1. Owner stores a data hash (encrypted key) in the vault
 * 2. Multiple guardians are appointed
 * 3. When needed, guardians confirm the release
 * 4. Once enough guardians confirm, the vault is released
 */

 contract WillVault {
    address public owner;  // creates vault
    bytes32 public dataHash;  // encrypted key 
    address[] public guardians;  // appointed guardians list
    uint256 public confirmationsNeeded;  // number of confirmations needed
    bool public released;  // vault release status
    uint256 public currentConfirmations;  // current number of confirmations

    mapping(address => bool) public isConfirmed;

    event VaultLocked(address indexed owner, bytes32 indexed dataHash);
    event GuardianConfirmed(address indexed guardian);
    event VaultReleased(address indexed owner, bytes32 indexed dataHash);

    error OnlyOwner();                       
    error OnlyGuardian();                   
    error VaultAlreadyLocked();              
    error VaultNotLocked();                 
    error VaultAlreadyReleased();         
    error AlreadyConfirmed();

constructor(address[] memory _guardians, uint256 _confirmationsNeeded) {
    require(_guardians.length > 0, "Must have at least one guardian");
    require(_confirmationsNeeded > 0, "Confirmations needed must be > 0");
    require(_confirmationsNeeded <= _guardians.length, "Threshold too high");

    owner = msg.sender;
    guardians = _guardians;
    confirmationsNeeded = _confirmationsNeeded;
}
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }    
    
    modifier onlyGuardian() {
        if (!_isGuardian(msg.sender)) revert OnlyGuardian();
        _;
    }

    function lockVault(bytes32 _dataHash) external onlyOwner {
        if (dataHash != bytes32(0)) revert VaultAlreadyLocked();
        
        dataHash = _dataHash;
        emit VaultLocked(owner, _dataHash);
    }

    function confirmRelease() external onlyGuardian {
        if (dataHash == bytes32(0)) revert VaultNotLocked();
        if (released) revert VaultAlreadyReleased();
        if (isConfirmed[msg.sender]) revert AlreadyConfirmed();
        
        isConfirmed[msg.sender] = true;
        currentConfirmations++;
        
        emit GuardianConfirmed(msg.sender);
        
        // Check if we've reached the threshold
        if (currentConfirmations >= confirmationsNeeded) {
            released = true;
            emit VaultReleased(owner, dataHash);
        }
    }

    function getReleaseStatus() external view returns (
        bytes32 dataHash_,
        uint256 confirmationsNeeded_,
        uint256 currentConfirmations_,
        bool released_
    ) {
        return (
            dataHash,
            confirmationsNeeded,
            currentConfirmations,
            released
        );
    }

    function getGuardians() external view returns (address[] memory) {
        return guardians;
    }

    function isGuardian(address _addr) external view returns (bool) {
        return _isGuardian(_addr);
    }

    function _isGuardian(address _addr) internal view returns (bool) {
        for (uint256 i = 0; i < guardians.length; i++) {
            if (guardians[i] == _addr) {
                return true;
            }
        }
        return false;
    }
}

