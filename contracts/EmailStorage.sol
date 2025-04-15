// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./StakingContract.sol";

contract EmailStorage {
    struct Email {
        address sender;
        address recipient;
        string ipfsHash;      // Hash of content stored on Pinata
        uint256 timestamp;
        bool isRead;
        bool isStarred;
        bool isDraft;
    }

    mapping(uint256 => Email) public emails;
    mapping(address => uint256[]) public userEmails;  // Maps user address to their email IDs
    uint256 public emailCount;
    
    // Reference to the staking contract
    StakingContract public stakingContract;
    
    // Minimum stake required to send emails
    uint256 public minStakeToSendEmail;
    
    // Events
    event EmailSent(
        uint256 indexed emailId,
        address indexed sender,
        address indexed recipient,
        string ipfsHash,
        uint256 timestamp
    );

    event EmailStatusUpdated(
        uint256 indexed emailId,
        bool isRead,
        bool isStarred,
        bool isDraft
    );
    
    event StakingContractUpdated(address indexed newStakingContract);
    event MinStakeUpdated(uint256 newMinStake);

    constructor(address payable _stakingContractAddress, uint256 _minStakeToSendEmail) {
        stakingContract = StakingContract(_stakingContractAddress);
        minStakeToSendEmail = _minStakeToSendEmail;
    }
    
    /**
     * @dev Update the staking contract address
     */
    function updateStakingContract(address payable _newStakingContractAddress) external {
        // In a real implementation, this would be restricted to the owner
        stakingContract = StakingContract(_newStakingContractAddress);
        emit StakingContractUpdated(_newStakingContractAddress);
    }
    
    /**
     * @dev Update the minimum stake required to send emails
     */
    function updateMinStakeToSendEmail(uint256 _newMinStake) external {
        // In a real implementation, this would be restricted to the owner
        minStakeToSendEmail = _newMinStake;
        emit MinStakeUpdated(_newMinStake);
    }

    function sendEmail(address _recipient, string memory _ipfsHash) public returns (uint256) {
        require(_recipient != address(0), "Invalid recipient address");
        require(bytes(_ipfsHash).length > 0, "Invalid IPFS hash");
        
        // Check if the sender has staked enough
        (uint256 amount, , , , , ) = stakingContract.getStakeDetails(msg.sender);
        require(
            stakingContract.isValidStaker(msg.sender) && 
            amount >= minStakeToSendEmail,
            "Insufficient stake to send email"
        );

        uint256 emailId = emailCount++;
        
        emails[emailId] = Email({
            sender: msg.sender,
            recipient: _recipient,
            ipfsHash: _ipfsHash,
            timestamp: block.timestamp,
            isRead: false,
            isStarred: false,
            isDraft: false
        });

        userEmails[msg.sender].push(emailId);
        userEmails[_recipient].push(emailId);

        emit EmailSent(emailId, msg.sender, _recipient, _ipfsHash, block.timestamp);
        return emailId;
    }

    function saveDraft(address _recipient, string memory _ipfsHash) public returns (uint256) {
        // Check if the sender has staked enough
        (uint256 amount, , , , , ) = stakingContract.getStakeDetails(msg.sender);
        require(
            stakingContract.isValidStaker(msg.sender) && 
            amount >= minStakeToSendEmail,
            "Insufficient stake to save draft"
        );
        
        uint256 emailId = emailCount++;
        
        emails[emailId] = Email({
            sender: msg.sender,
            recipient: _recipient,
            ipfsHash: _ipfsHash,
            timestamp: block.timestamp,
            isRead: false,
            isStarred: false,
            isDraft: true
        });

        userEmails[msg.sender].push(emailId);

        emit EmailSent(emailId, msg.sender, _recipient, _ipfsHash, block.timestamp);
        return emailId;
    }

    function updateEmailStatus(uint256 _emailId, bool _isRead, bool _isStarred, bool _isDraft) public {
        require(_emailId < emailCount, "Email does not exist");
        Email storage email = emails[_emailId];
        require(email.recipient == msg.sender || email.sender == msg.sender, "Not authorized");

        email.isRead = _isRead;
        email.isStarred = _isStarred;
        email.isDraft = _isDraft;

        emit EmailStatusUpdated(_emailId, _isRead, _isStarred, _isDraft);
    }

    function getUserEmails(address _user) public view returns (uint256[] memory) {
        return userEmails[_user];
    }

    function getEmail(uint256 _emailId) public view returns (
        address sender,
        address recipient,
        string memory ipfsHash,
        uint256 timestamp,
        bool isRead,
        bool isStarred,
        bool isDraft
    ) {
        require(_emailId < emailCount, "Email does not exist");
        Email storage email = emails[_emailId];
        return (
            email.sender,
            email.recipient,
            email.ipfsHash,
            email.timestamp,
            email.isRead,
            email.isStarred,
            email.isDraft
        );
    }
} 