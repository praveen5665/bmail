// Check environment variables
export const checkEnvironmentVariables = () => {
  console.log("Checking environment variables...");
  
  const envVars = {
    NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
    NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS,
  };
  
  console.log("Environment variables:", envVars);
  
  // Check if variables are set
  const missingVars = Object.entries(envVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);
  
  if (missingVars.length > 0) {
    console.error("Missing environment variables:", missingVars);
    return false;
  }
  
  console.log("All required environment variables are set");
  return true;
}; 