import { authApi, clearAllAuthData, hasAuthenticatedSession, refreshToken as apiRefreshToken } from "@/lib/api";
import { UserLoginInput, UserRegistrationInput } from "@/lib/validations";
import { OtpSendResult, OtpVerificationResult, User } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { handleAxiosError } from "@/lib/helpers"
import { clearBookingRecoveryContext } from "@/lib/bookingRecovery";

type SessionStateResult = {
  authenticated: boolean;
  shouldRefresh: boolean;
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean | null;
  isLoading: boolean;
  error: string | null;
  otp: string | null;
  otpDelivery: OtpSendResult | null;
  otpVerification: OtpVerificationResult | null;
  otpLoading: boolean;
  otpError: string | null;
}

interface AuthActions {
  register: (data: UserRegistrationInput) => Promise<void>;
  login: (data: UserLoginInput) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  getSession: () => Promise<SessionStateResult>;
  refreshToken: () => Promise<boolean>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  checkAuthStatus: () => boolean;
  generateOtp: (email: string) => Promise<OtpSendResult>;
  verifyOtp: (email: string, otp: string) => Promise<OtpVerificationResult | null>;
  clearOtp: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: null,
      isLoading: false,
      error: null,
      otp: null,
      otpDelivery: null,
      otpVerification: null,
      otpLoading: false,
      otpError: null,

      // ------------------ Register ------------------
      register: async (data: UserRegistrationInput) => {
        try {
          set({ isLoading: true });
          const res = await authApi.register(data);

          if (res.data) {
            const { session } = await authApi.getSession();
            set({
              user: hasAuthenticatedSession(session) ? session.user : res.data.user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error(res.message || "Registration failed");
          }
        } catch (err) {
          const { message } = handleAxiosError(err, "Registration failed");
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      // ------------------ Login ------------------
      login: async (data: UserLoginInput) => {
        try {
          set({ isLoading: true });
          const res = await authApi.login(data);

          if (res.data) {
            const { session } = await authApi.getSession();
            set({
              user: hasAuthenticatedSession(session) ? session.user : res.data.user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error(res.message || "Login failed");
          }
        } catch (err) {
          const { message } = handleAxiosError(err, "Login failed");
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      loginWithGoogle: async (credential: string) => {
        try {
          set({ isLoading: true, error: null });
          const res = await authApi.loginWithGoogle(credential);

          if (!res.data) throw new Error(res.message || "Google sign-in failed");

          const { session } = await authApi.getSession();
          set({
            user: hasAuthenticatedSession(session) ? session.user : res.data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          const { message } = handleAxiosError(err, "Google sign-in failed");
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      // ------------------ Logout ------------------
      logout: async () => {
        try {
          await authApi.logout();
        } catch (err) {
          const { message } = handleAxiosError(err, "Logout request failed");
          console.warn(message);
        } finally {
          clearAllAuthData();
          clearBookingRecoveryContext();
          set({
            user: null,
            isAuthenticated: false,
            otp: null,
            otpDelivery: null,
            otpVerification: null,
          });
        }
      },

      // ------------------ Get current user ------------------
      getSession: async () => {
        try {
          set({ isLoading: true, isAuthenticated: false });
          const { session, shouldRefresh } = await authApi.getSession();

          if (hasAuthenticatedSession(session)) {
            set({ user: session.user, isAuthenticated: true, isLoading: false });
            return { authenticated: true, shouldRefresh: false };
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false });
            return { authenticated: false, shouldRefresh };
          }
        } catch (err) {
          const { message } = handleAxiosError(err, "getSession failed");
          set({ user: null, isAuthenticated: false, isLoading: false, error: message });
          return { authenticated: false, shouldRefresh: false };
        }
      },

      // ------------------ Refresh token ------------------
      refreshToken: async () => {
        try {
          await apiRefreshToken();
          return (await get().getSession()).authenticated;
        } catch (err) {
          const { message } = handleAxiosError(err, "Refresh token failed");
          console.warn(message);
          clearAllAuthData();
          clearBookingRecoveryContext();
          set({ user: null, isAuthenticated: false });
          return false;
        }
      },

      // ------------------ OTP Handling ------------------
      generateOtp: async (email) => {
        try {
          set({ otpLoading: true, otpError: null });
          const res = await authApi.generateOtp(email);
          if (!res.data) throw new Error(res.message || "Failed to generate OTP");
          set({ otp: null, otpDelivery: res.data, otpVerification: null, otpLoading: false });
          return res.data;
        } catch (err) {
          const { message } = handleAxiosError(err, "Failed to generate OTP");
          set({ otpError: message, otpLoading: false });
          throw new Error(message);
        }
      },

      verifyOtp: async (email, otpCode) => {
        try {
          set({ otpLoading: true, otpError: null });
          const res = await authApi.verifyOtp(email, otpCode);
          if (!res.data) throw new Error(res.message || "Failed to verify OTP");
          set({ otpVerification: res.data, otpLoading: false });
          return res.data;
        } catch (err) {
          const { message } = handleAxiosError(err, "Failed to verify OTP");
          set({ otpError: message, otpLoading: false });
          return null;
        }
      },

      clearOtp: () => set({ otp: null, otpDelivery: null, otpVerification: null, otpError: null }),
      clearError: () => set({ error: null }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      // ------------------ Check auth status ------------------
      checkAuthStatus: () => {
        const state = get();
        return !!(state.user && state.isAuthenticated);
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
