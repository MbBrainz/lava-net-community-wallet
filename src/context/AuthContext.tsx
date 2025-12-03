"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  useDynamicContext,
  useIsLoggedIn,
  useUserWallets,
  useConnectWithOtp,
  useEmbeddedWallet,
} from "@dynamic-labs/sdk-react-core";

// Types
export interface AuthUser {
  id: string;
  email: string | null;
  walletAddress: string | null;
  createdAt: Date | null;
}

export interface WalletInfo {
  address: string;
  chainType: "evm";
  chainId: string;
  isConnected: boolean;
}

interface AuthContextType {
  // Auth state
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  user: AuthUser | null;

  // Wallet state
  primaryWallet: WalletInfo | null;
  wallets: WalletInfo[];
  hasEmbeddedWallet: boolean;
  isCreatingWallet: boolean;

  // Auth actions
  sendOtpToEmail: (email: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  resendOtp: () => Promise<void>;
  logout: () => Promise<void>;

  // Email verification state
  isOtpPending: boolean;
  pendingEmail: string | null;
  otpError: string | null;
  isSendingOtp: boolean;
  isVerifyingOtp: boolean;
  clearOtpError: () => void;
  resetAuthFlow: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const {
    user: dynamicUser,
    primaryWallet,
    handleLogOut,
    sdkHasLoaded,
  } = useDynamicContext();

  const isLoggedIn = useIsLoggedIn();
  const userWallets = useUserWallets();
  
  // Headless OTP hook from Dynamic SDK
  const { connectWithEmail, verifyOneTimePassword } = useConnectWithOtp();
  
  // Embedded wallet hook for creating wallets
  const { createEmbeddedWallet, userHasEmbeddedWallet } = useEmbeddedWallet();

  // Local state
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOtpPending, setIsOtpPending] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  
  // Track if we've attempted wallet creation to avoid duplicates
  const walletCreationAttempted = useRef(false);

  // Initialize when SDK loads
  useEffect(() => {
    if (sdkHasLoaded) {
      setIsInitialized(true);
    }
  }, [sdkHasLoaded]);
  
  // Auto-create embedded wallet after successful login if user doesn't have one
  useEffect(() => {
    const createWalletIfNeeded = async () => {
      // Check if user has embedded wallet (handle both function and boolean cases)
      const hasWallet = typeof userHasEmbeddedWallet === 'function' 
        ? userHasEmbeddedWallet() 
        : userHasEmbeddedWallet;
      
      // Only proceed if:
      // 1. SDK is loaded
      // 2. User is logged in
      // 3. User doesn't have an embedded wallet
      // 4. We haven't already attempted creation
      // 5. We're not currently creating
      if (
        sdkHasLoaded &&
        isLoggedIn &&
        dynamicUser &&
        !hasWallet &&
        !walletCreationAttempted.current &&
        !isCreatingWallet
      ) {
        walletCreationAttempted.current = true;
        setIsCreatingWallet(true);
        
        console.log("[Auth] User logged in without embedded wallet, creating one...");
        
        try {
          // Create embedded wallet - Dynamic will create for enabled chains (EVM)
          await createEmbeddedWallet();
          console.log("[Auth] Embedded wallet created successfully");
        } catch (error) {
          console.error("[Auth] Failed to create embedded wallet:", error);
          // Reset flag to allow retry
          walletCreationAttempted.current = false;
        } finally {
          setIsCreatingWallet(false);
        }
      }
    };
    
    createWalletIfNeeded();
  }, [sdkHasLoaded, isLoggedIn, dynamicUser, userHasEmbeddedWallet, createEmbeddedWallet, isCreatingWallet]);
  
  // Reset wallet creation flag on logout
  useEffect(() => {
    if (!isLoggedIn) {
      walletCreationAttempted.current = false;
    }
  }, [isLoggedIn]);

  // Transform Dynamic user to our AuthUser format
  const user: AuthUser | null = useMemo(() => {
    if (!dynamicUser || !dynamicUser.userId) return null;

    // Get the EVM wallet address if available
    const walletAddress = primaryWallet?.address || null;

    return {
      id: dynamicUser.userId,
      email: dynamicUser.email || null,
      walletAddress,
      createdAt: new Date(), // Use current date as fallback
    };
  }, [dynamicUser, primaryWallet]);

  // Transform wallets to our format
  const wallets: WalletInfo[] = useMemo(() => {
    return userWallets.map((wallet) => ({
      address: wallet.address,
      chainType: "evm" as const,
      chainId: wallet.chain || "unknown",
      isConnected: true, // Embedded wallets are always considered connected
    }));
  }, [userWallets]);

  // Get primary wallet info
  const primaryWalletInfo: WalletInfo | null = useMemo(() => {
    if (!primaryWallet) return null;
    return {
      address: primaryWallet.address,
      chainType: "evm" as const,
      chainId: primaryWallet.chain || "unknown",
      isConnected: true, // Embedded wallets are always considered connected
    };
  }, [primaryWallet]);

  // Send OTP to email - initiates headless OTP flow
  const sendOtpToEmail = useCallback(async (email: string) => {
    try {
      setOtpError(null);
      setIsSendingOtp(true);
      setPendingEmail(email);

      // Use Dynamic's headless OTP - sends email with verification code
      await connectWithEmail(email);
      
      setIsOtpPending(true);
      console.log("[Auth] OTP sent to:", email);
    } catch (error) {
      console.error("[Auth] Failed to send OTP:", error);
      setOtpError("Failed to send verification code. Please try again.");
      setPendingEmail(null);
      throw error;
    } finally {
      setIsSendingOtp(false);
    }
  }, [connectWithEmail]);

  // Verify OTP - completes authentication
  const verifyOtp = useCallback(async (otp: string) => {
    try {
      setOtpError(null);
      setIsVerifyingOtp(true);

      // Use Dynamic's headless OTP verification
      await verifyOneTimePassword(otp);
      
      console.log("[Auth] OTP verified successfully");
      // Success - the isLoggedIn state will update automatically
    } catch (error) {
      console.error("[Auth] OTP verification failed:", error);
      setOtpError("Invalid verification code. Please try again.");
      throw error;
    } finally {
      setIsVerifyingOtp(false);
    }
  }, [verifyOneTimePassword]);

  // Resend OTP
  const resendOtp = useCallback(async () => {
    if (!pendingEmail) {
      throw new Error("No pending email to resend OTP to");
    }
    await sendOtpToEmail(pendingEmail);
  }, [pendingEmail, sendOtpToEmail]);

  // Clear OTP error
  const clearOtpError = useCallback(() => {
    setOtpError(null);
  }, []);

  // Reset auth flow (go back to email step)
  const resetAuthFlow = useCallback(() => {
    setIsOtpPending(false);
    setPendingEmail(null);
    setOtpError(null);
    setIsSendingOtp(false);
    setIsVerifyingOtp(false);
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await handleLogOut();
      resetAuthFlow();
    } catch (error) {
      console.error("[Auth] Logout error:", error);
      throw error;
    }
  }, [handleLogOut, resetAuthFlow]);

  // Reset auth flow state when user logs in
  useEffect(() => {
    if (isLoggedIn) {
      setIsOtpPending(false);
      // Keep pendingEmail for reference if needed
    }
  }, [isLoggedIn]);

  // Get hasEmbeddedWallet value (handle both function and boolean cases)
  const hasEmbeddedWallet = typeof userHasEmbeddedWallet === 'function' 
    ? userHasEmbeddedWallet() 
    : userHasEmbeddedWallet;

  const value: AuthContextType = {
    isAuthenticated: isLoggedIn,
    isLoading: !sdkHasLoaded || isCreatingWallet,
    isInitialized,
    user,
    primaryWallet: primaryWalletInfo,
    wallets,
    hasEmbeddedWallet,
    isCreatingWallet,
    sendOtpToEmail,
    verifyOtp,
    resendOtp,
    logout,
    isOtpPending,
    pendingEmail,
    otpError,
    isSendingOtp,
    isVerifyingOtp,
    clearOtpError,
    resetAuthFlow,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
