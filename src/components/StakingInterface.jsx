"use client";

import { useState, useEffect } from "react";
import {
  getStakingDetails,
  getStakingParameters,
  stake,
  unstake,
  claimReward,
  isValidStaker,
} from "../utils/stakingService";
import { connectWallet } from "../utils/web3Config";
import { checkEnvironmentVariables } from "../utils/checkEnv";
import { checkContractDeployment } from "../utils/checkContract";
import { ethers } from "ethers";

export default function StakingInterface() {
  const [userAddress, setUserAddress] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");
  const [stakeDetails, setStakeDetails] = useState(null);
  const [stakingParameters, setStakingParameters] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isValidStakerStatus, setIsValidStakerStatus] = useState(false);

  // Function to clear error message
  const clearError = () => {
    setError("");
  };

  // Function to clear success message
  const clearSuccess = () => {
    setSuccess("");
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        // Check environment variables first
        const envVarsValid = checkEnvironmentVariables();
        if (!envVarsValid) {
          setError(
            "Missing environment variables. Please check your .env.local file."
          );
          setLoading(false);
          return;
        }

        // Check contract deployment
        const deploymentResults = await checkContractDeployment();
        if (deploymentResults.error) {
          setError(
            `Error checking contract deployment: ${deploymentResults.error}`
          );
          setLoading(false);
          return;
        }

        // Check if the staking contract is deployed
        if (!deploymentResults.staking?.deployed) {
          setError(
            `Staking contract is not deployed: ${
              deploymentResults.staking?.error || "Unknown error"
            }`
          );
          setLoading(false);
          return;
        }

        // Get user address
        const address = await connectWallet();
        setUserAddress(address);

        // Check if user is a valid staker
        const isValid = await isValidStaker(address);
        setIsValidStakerStatus(isValid);

        // Get staking parameters
        const params = await getStakingParameters();
        if (params.success) {
          // Convert values to proper format
          const formattedParams = {
            minStakeAmount: ethers.formatEther(
              params.parameters.minStakeAmount
            ),
            stakingPeriod:
              Number(params.parameters.stakingPeriod) / (24 * 60 * 60), // Convert seconds to days
            rewardRate: Number(params.parameters.rewardRate) / 100, // Convert basis points to percentage
            totalStaked: ethers.formatEther(params.parameters.totalStaked),
          };
          setStakingParameters(formattedParams);
        }

        // Get stake details if user is a valid staker
        if (isValid) {
          const details = await getStakingDetails(address);
          if (details.success) {
            // Convert values to proper format
            const formattedDetails = {
              amount: ethers.formatEther(details.stakeDetails.amount),
              startTime: new Date(
                Number(details.stakeDetails.startTime) * 1000
              ).toLocaleDateString(),
              endTime: new Date(
                Number(details.stakeDetails.endTime) * 1000
              ).toLocaleDateString(),
              active: details.stakeDetails.active,
              lastRewardClaim: new Date(
                Number(details.stakeDetails.lastRewardClaim) * 1000
              ).toLocaleDateString(),
              currentReward: ethers.formatEther(
                details.stakeDetails.currentReward
              ),
            };
            setStakeDetails(formattedDetails);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);

        // If the error is about a pending request, retry after a delay
        if (error.code === -32002) {
          setError(
            "Wallet connection request is pending. Please check your MetaMask extension."
          );

          // Retry after 3 seconds
          setTimeout(() => {
            fetchData();
          }, 3000);
        } else {
          setError("Failed to fetch data. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleStake = async () => {
    if (!stakeAmount || isNaN(stakeAmount) || parseFloat(stakeAmount) <= 0) {
      setError("Please enter a valid stake amount");
      return;
    }

    // Validate against minimum stake amount
    if (
      stakingParameters &&
      parseFloat(stakeAmount) < parseFloat(stakingParameters.minStakeAmount)
    ) {
      setError(
        `Stake amount must be at least ${stakingParameters.minStakeAmount} ETH`
      );
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await stake(stakeAmount);
      if (result.success) {
        setSuccess(
          `Successfully staked ${stakeAmount} ETH. Transaction hash: ${result.transactionHash}`
        );
        setStakeAmount("");

        // Refresh staking details
        const details = await getStakingDetails(userAddress);
        if (details.success) {
          setStakeDetails(details.stakeDetails);
          setIsValidStakerStatus(true);
        }
      } else {
        setError(`Failed to stake: ${result.error}`);
      }
    } catch (error) {
      console.error("Error staking:", error);
      setError(`Error staking: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await unstake();
      if (result.success) {
        setSuccess(
          `Successfully unstaked. Transaction hash: ${result.transactionHash}`
        );

        // Refresh staking details
        setStakeDetails(null);
        setIsValidStakerStatus(false);
      } else {
        setError(`Failed to unstake: ${result.error}`);
      }
    } catch (error) {
      console.error("Error unstaking:", error);
      setError(`Error unstaking: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await claimReward();
      if (result.success) {
        setSuccess(
          `Successfully claimed reward. Transaction hash: ${result.transactionHash}`
        );

        // Refresh staking details
        const detailsResult = await getStakingDetails(userAddress);
        if (detailsResult.success) {
          setStakeDetails(detailsResult.stakeDetails);
        }
      } else {
        setError(`Failed to claim reward: ${result.error}`);
      }
    } catch (error) {
      console.error("Error claiming reward:", error);
      setError(`Error claiming reward: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Proof of Stake</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="absolute top-0 right-0 p-2 text-red-700 hover:text-red-900"
            aria-label="Close error message"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 relative">
          <span>{success}</span>
          <button
            onClick={clearSuccess}
            className="absolute top-0 right-0 p-2 text-green-700 hover:text-green-900"
            aria-label="Close success message"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {stakingParameters && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-800">
            Staking Parameters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded border border-gray-200">
              <p className="text-sm text-gray-600">Minimum Stake</p>
              <p className="font-medium text-gray-800">
                {parseFloat(stakingParameters.minStakeAmount).toFixed(4)} ETH
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded border border-gray-200">
              <p className="text-sm text-gray-600">Staking Period</p>
              <p className="font-medium text-gray-800">
                {stakingParameters.stakingPeriod} days
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded border border-gray-200">
              <p className="text-sm text-gray-600">Reward Rate</p>
              <p className="font-medium text-gray-800">
                {stakingParameters.rewardRate}% per year
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded border border-gray-200">
              <p className="text-sm text-gray-600">Total Staked</p>
              <p className="font-medium text-gray-800">
                {parseFloat(stakingParameters.totalStaked).toFixed(4)} ETH
              </p>
            </div>
          </div>
        </div>
      )}

      {stakeDetails ? (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-800">
            Your Stake
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 p-3 rounded border border-gray-200">
              <p className="text-sm text-gray-600">Staked Amount</p>
              <p className="font-medium text-gray-800">
                {parseFloat(stakeDetails.amount).toFixed(4)} ETH
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded border border-gray-200">
              <p className="text-sm text-gray-600">Current Reward</p>
              <p className="font-medium text-gray-800">
                {parseFloat(stakeDetails.currentReward).toFixed(4)} ETH
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded border border-gray-200">
              <p className="text-sm text-gray-600">Start Date</p>
              <p className="font-medium text-gray-800">
                {stakeDetails.startTime}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded border border-gray-200">
              <p className="text-sm text-gray-600">End Date</p>
              <p className="font-medium text-gray-800">
                {stakeDetails.endTime}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleClaimReward}
              disabled={loading || parseFloat(stakeDetails.currentReward) <= 0}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "Claim Reward"}
            </button>

            <button
              onClick={handleUnstake}
              disabled={loading || new Date() < new Date(stakeDetails.endTime)}
              className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "Unstake"}
            </button>
          </div>

          {new Date() < new Date(stakeDetails.endTime) && (
            <p className="text-sm text-gray-600 mt-2">
              You can unstake after{" "}
              {new Date(stakeDetails.endTime).toLocaleDateString()}
            </p>
          )}
        </div>
      ) : (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-800">
            Stake ETH
          </h3>
          <p className="text-gray-600 mb-4">
            Stake ETH to participate in the email system and earn rewards.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 items-start">
            <div className="flex-grow">
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="Amount in ETH"
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                min={stakingParameters?.minStakeAmount || 0}
                step="0.01"
              />
              {stakingParameters && (
                <p className="text-sm text-gray-600 mt-1">
                  Minimum stake: {stakingParameters.minStakeAmount} ETH
                </p>
              )}
            </div>

            <button
              onClick={handleStake}
              disabled={
                loading ||
                !stakeAmount ||
                parseFloat(stakeAmount) <
                  (stakingParameters?.minStakeAmount || 0)
              }
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "Stake"}
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <p>
          <strong className="text-gray-800">How it works:</strong> Stake ETH to
          participate in the email system. The more you stake, the more
          privileges you have. You can earn rewards for staking.
        </p>
        <p className="mt-2">
          <strong className="text-gray-800">Note:</strong> You need to stake a
          minimum amount to send emails.
        </p>
      </div>
    </div>
  );
}
