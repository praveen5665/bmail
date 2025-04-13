// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EmailStorage {
    struct Email {
        address sender;
        address recipient;
        string ipfsHash;      // Hash of encrypted content stored on Pinata
        uint256 timestamp;
        bool isRead;
        bool isStarred;
        bool isDraft;
    }

    mapping(uint256 => Email) public emails;
    mapping(address => uint256[]) public userEmails;  // Maps user address to their email IDs
    uint256 public emailCount;

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

    function sendEmail(address _recipient, string memory _ipfsHash) public returns (uint256) {
        require(_recipient != address(0), "Invalid recipient address");
        require(bytes(_ipfsHash).length > 0, "Invalid IPFS hash");

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