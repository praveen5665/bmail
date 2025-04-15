// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title StakingContract
 * @dev Allows users to stake tokens to participate in the email system's proof of stake
 */
contract StakingContract is ReentrancyGuard, Ownable, Pausable {
    // Staking token (using ETH for simplicity, but could be an ERC20 token)
    address public constant ETH_ADDRESS = address(0);
    
    // Minimum stake amount
    uint256 public minStakeAmount;
    
    // Staking period in seconds (e.g., 30 days)
    uint256 public stakingPeriod;
    
    // Reward rate (percentage of stake returned as reward)
    uint256 public rewardRate; // in basis points (1% = 100)
    
    // Mapping of staker address to stake details
    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
        bool active;
        uint256 lastRewardClaim;
    }
    
    mapping(address => Stake) public stakes;
    
    // Total staked amount
    uint256 public totalStaked;
    
    // Events
    event Staked(address indexed staker, uint256 amount, uint256 startTime, uint256 endTime);
    event Unstaked(address indexed staker, uint256 amount);
    event RewardClaimed(address indexed staker, uint256 reward);
    event StakeParametersUpdated(uint256 minStakeAmount, uint256 stakingPeriod, uint256 rewardRate);
    
    constructor(
        uint256 _minStakeAmount,
        uint256 _stakingPeriod,
        uint256 _rewardRate
    ) Ownable(msg.sender) {
        minStakeAmount = _minStakeAmount;
        stakingPeriod = _stakingPeriod;
        rewardRate = _rewardRate;
    }
    
    /**
     * @dev Stake ETH to participate in the system
     */
    function stake() external payable nonReentrant whenNotPaused {
        require(msg.value >= minStakeAmount, "Stake amount below minimum");
        require(!stakes[msg.sender].active, "Already staking");
        
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + stakingPeriod;
        
        stakes[msg.sender] = Stake({
            amount: msg.value,
            startTime: startTime,
            endTime: endTime,
            active: true,
            lastRewardClaim: startTime
        });
        
        totalStaked += msg.value;
        
        emit Staked(msg.sender, msg.value, startTime, endTime);
    }
    
    /**
     * @dev Unstake ETH after the staking period
     */
    function unstake() external nonReentrant {
        Stake storage userStake = stakes[msg.sender];
        require(userStake.active, "No active stake");
        require(block.timestamp >= userStake.endTime, "Staking period not ended");
        
        uint256 amount = userStake.amount;
        userStake.active = false;
        totalStaked -= amount;
        
        // Calculate and transfer reward
        uint256 reward = calculateReward(msg.sender);
        uint256 totalAmount = amount + reward;
        
        // Reset the stake
        delete stakes[msg.sender];
        
        // Transfer the staked amount and reward
        (bool success, ) = msg.sender.call{value: totalAmount}("");
        require(success, "Transfer failed");
        
        emit Unstaked(msg.sender, amount);
        if (reward > 0) {
            emit RewardClaimed(msg.sender, reward);
        }
    }
    
    /**
     * @dev Claim reward without unstaking
     */
    function claimReward() external nonReentrant {
        Stake storage userStake = stakes[msg.sender];
        require(userStake.active, "No active stake");
        
        uint256 reward = calculateReward(msg.sender);
        require(reward > 0, "No reward to claim");
        
        userStake.lastRewardClaim = block.timestamp;
        
        (bool success, ) = msg.sender.call{value: reward}("");
        require(success, "Transfer failed");
        
        emit RewardClaimed(msg.sender, reward);
    }
    
    /**
     * @dev Calculate the reward for a staker
     */
    function calculateReward(address staker) public view returns (uint256) {
        Stake storage userStake = stakes[staker];
        if (!userStake.active) return 0;
        
        uint256 timeElapsed = block.timestamp - userStake.lastRewardClaim;
        uint256 reward = (userStake.amount * rewardRate * timeElapsed) / (365 days * 10000);
        
        return reward;
    }
    
    /**
     * @dev Check if an address is a valid staker
     */
    function isValidStaker(address staker) external view returns (bool) {
        return stakes[staker].active && block.timestamp >= stakes[staker].startTime;
    }
    
    /**
     * @dev Get stake details for an address
     */
    function getStakeDetails(address staker) external view returns (
        uint256 amount,
        uint256 startTime,
        uint256 endTime,
        bool active,
        uint256 lastRewardClaim,
        uint256 currentReward
    ) {
        Stake storage userStake = stakes[staker];
        return (
            userStake.amount,
            userStake.startTime,
            userStake.endTime,
            userStake.active,
            userStake.lastRewardClaim,
            calculateReward(staker)
        );
    }
    
    /**
     * @dev Update staking parameters (only owner)
     */
    function updateStakeParameters(
        uint256 _minStakeAmount,
        uint256 _stakingPeriod,
        uint256 _rewardRate
    ) external onlyOwner {
        minStakeAmount = _minStakeAmount;
        stakingPeriod = _stakingPeriod;
        rewardRate = _rewardRate;
        
        emit StakeParametersUpdated(_minStakeAmount, _stakingPeriod, _rewardRate);
    }
    
    /**
     * @dev Pause the contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
    
    /**
     * @dev Fallback function to accept ETH
     */
    fallback() external payable {}
} 