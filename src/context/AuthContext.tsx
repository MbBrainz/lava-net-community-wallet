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
  useDynamicWaas,
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
  
  // Embedded wallet hook (using useDynamicWaas per latest docs)
  // Note: Wallets are automatically created during sign-up if enabled in Dynamic dashboard
  const { getWaasWallets } = useDynamicWaas();

  // Local state
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOtpPending, setIsOtpPending] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  
  // Track if we've checked wallet status to avoid duplicate checks
  const walletStatusChecked = useRef(false);
  
  // Track if user has embedded wallet (derived from wallet check)
  const [hasEmbeddedWallet, setHasEmbeddedWallet] = useState(false);

  // Initialize when SDK loads
  useEffect(() => {
    if (sdkHasLoaded) {
      setIsInitialized(true);
    }
  }, [sdkHasLoaded]);
  
  // Check embedded wallet status after login
  // Note: Wallets are automatically created during sign-up if "Create on Sign up" 
  // toggle is enabled in Dynamic dashboard. This is just for logging/verification.
  useEffect(() => {
    const checkWalletStatus = async () => {
      if (
        sdkHasLoaded &&
        isLoggedIn &&
        dynamicUser &&
        !walletStatusChecked.current
      ) {
        walletStatusChecked.current = true;
        
        try {
          // Check if user has embedded wallets (should be auto-created during signup)
          const waasWallets = await getWaasWallets();
          
          if (waasWallets.length === 0) {
            console.log("[Auth] User logged in but no embedded wallet found. Ensure 'Create on Sign up' is enabled in Dynamic dashboard.");
            setHasEmbeddedWallet(false);
          } else {
            console.log("[Auth] User has embedded wallet(s):", waasWallets.length);
            setHasEmbeddedWallet(true);
          }
        } catch (error) {
          console.error("[Auth] Error checking wallet status:", error);
          setHasEmbeddedWallet(false);
        }
      }
    };
    
    checkWalletStatus();
  }, [sdkHasLoaded, isLoggedIn, dynamicUser, getWaasWallets]);
  
  // Reset wallet check flag and state on logout
  useEffect(() => {
    if (!isLoggedIn) {
      walletStatusChecked.current = false;
      setHasEmbeddedWallet(false);
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


  const value: AuthContextType = {
    isAuthenticated: isLoggedIn,
    isLoading: !sdkHasLoaded,
    isInitialized,
    user,
    primaryWallet: primaryWalletInfo,
    wallets,
    hasEmbeddedWallet,
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
