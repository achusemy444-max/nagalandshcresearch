// Convex connection diagnostics utility
export function diagnoseConvex() {
  console.log("=== CONVEX DIAGNOSTICS ===");
  
  // Check environment variables
  console.log("Environment Variables:");
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  const token = process.env.NEXT_PUBLIC_CONVEX_ACCESS_TOKEN;
  
  console.log(`  NEXT_PUBLIC_CONVEX_URL: ${url ? "✓ SET" : "✗ MISSING"}`);
  if (url) console.log(`    Value: ${url}`);
  
  console.log(`  NEXT_PUBLIC_CONVEX_ACCESS_TOKEN: ${token ? "✓ SET" : "✗ MISSING"}`);
  if (token) console.log(`    Starts with: ${token.substring(0, 20)}...`);
  
  // Check if Convex SDK is loaded
  console.log("\nConvex SDK Status:");
  if (typeof window !== "undefined" && window.convex) {
    console.log("  ✓ Convex SDK loaded in browser");
  } else {
    console.log("  ✗ Convex SDK NOT loaded");
  }
  
  // Try to initialize client
  console.log("\nClient Initialization:");
  try {
    if (typeof window !== "undefined" && window.convex && url && token) {
      const testClient = new window.convex.ConvexClient(url, { accessToken: token });
      console.log("  ✓ Test client created successfully");
      
      // Try to access API
      const testApi = window.convex.anyApi;
      console.log("  ✓ anyApi accessor available");
      
      if (testApi.accounts && testApi.accounts.list) {
        console.log("  ✓ accounts.list function available");
      } else {
        console.log("  ✗ accounts.list function NOT available");
      }
    } else {
      console.log("  ✗ Cannot initialize - missing SDK, URL, or token");
    }
  } catch (error) {
    console.error("  ✗ Client initialization error:", error.message);
  }
  
  console.log("=== END DIAGNOSTICS ===\n");
}

export function logMutationAttempt(functionName, args) {
  console.log(`[MUTATION] ${functionName}:`, args);
}

export function logMutationSuccess(functionName, result) {
  console.log(`[MUTATION SUCCESS] ${functionName}:`, result);
}

export function logMutationError(functionName, error) {
  console.error(`[MUTATION ERROR] ${functionName}:`, error.message || error);
}

export function logQueryAttempt(functionName, args) {
  console.log(`[QUERY] ${functionName}:`, args);
}

export function logQuerySuccess(functionName, result) {
  console.log(`[QUERY SUCCESS] ${functionName}:`, result?.length || result ? "Data received" : "Empty result");
}

export function logQueryError(functionName, error) {
  console.error(`[QUERY ERROR] ${functionName}:`, error.message || error);
}
