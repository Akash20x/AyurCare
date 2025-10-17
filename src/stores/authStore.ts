import { authApi, clearAllAuthData, setAuthTokens, refreshToken as apiRefreshToken } from "@/lib/api";
import { UserLoginInput, UserRegistrationInput } from "@/lib/validations";
import { User } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { handleAxiosError } from "@/lib/helpers/apiHelpers"

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean | null;
  isLoading: boolean;
  error: string | null;
  otp: string | null;
  otpLoading: boolean;
  otpError: string | null;
}

interface AuthActions {
  register: (data: UserRegistrationInput) => Promise<void>;
  login: (data: UserLoginInput) => Promise<void>;
  logout: () => Promise<void>;
  getMe: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  checkAuthStatus: () => boolean;
  generateOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<boolean>;
  clearOtp: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: null,
      isLoading: false,
      error: null,
      otp: null,
      otpLoading: false,
      otpError: null,

      // ------------------ Register ------------------
      register: async (data: UserRegistrationInput) => {
        try {
          set({ isLoading: true });
          const res = await authApi.register(data);

          if (res.data) {
            setAuthTokens(res.data.accessToken);
            set({
              user: res.data.user,
              token: res.data.accessToken,
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
            setAuthTokens(res.data.accessToken);
            set({
              user: res.data.user,
              token: res.data.accessToken,
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

      // ------------------ Logout ------------------
      logout: async () => {
        try {
          await authApi.logout();
        } catch (err) {
          const { message } = handleAxiosError(err, "Logout request failed");
          console.warn(message);
        } finally {
          clearAllAuthData();
          set({ user: null, token: null, isAuthenticated: false });
        }
      },

      // ------------------ Get current user ------------------
      getMe: async () => {
        try {
          set({ isLoading: true, isAuthenticated: false });
          const res = await authApi.getMe();

          if (res.data) {
            set({ user: res.data, isAuthenticated: true, isLoading: false });
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        } catch (err) {
          const { message } = handleAxiosError(err, "getMe failed");
          set({ user: null, isAuthenticated: false, isLoading: false, error: message });
        }
      },

      // ------------------ Refresh token ------------------
      refreshToken: async () => {
        try {
          await apiRefreshToken();
          const accessToken = localStorage.getItem("accessToken")!;
          set({ token: accessToken });
        } catch (err) {
          const { message } = handleAxiosError(err, "Refresh token failed");
          console.warn(message);
          await get().logout();
        }
      },

      // ------------------ OTP Handling ------------------
      generateOtp: async (email) => {
        try {
          set({ otpLoading: true, otpError: null });
          const res = await authApi.generateOtp(email);
          set({ otp: res?.data?.otp, otpLoading: false });
        } catch (err) {
          const { message } = handleAxiosError(err, "Failed to generate OTP");
          set({ otpError: message, otpLoading: false });
        }
      },

      verifyOtp: async (email, otpCode) => {
        try {
          set({ otpLoading: true, otpError: null });
          await authApi.verifyOtp(email, otpCode);
          set({ otpLoading: false });
          return true;
        } catch (err) {
          const { message } = handleAxiosError(err, "Failed to verify OTP");
          set({ otpError: message, otpLoading: false });
          return false;
        }
      },

      clearOtp: () => set({ otp: null, otpError: null }),
      clearError: () => set({ error: null }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      // ------------------ Check auth status ------------------
      checkAuthStatus: () => {
        const state = get();
        return !!(state.user && state.token && state.isAuthenticated);
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
