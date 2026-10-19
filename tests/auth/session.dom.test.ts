import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@/types';

const apiMock = vi.hoisted(() => ({
  clearAllAuthData: vi.fn(),
  getSession: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  loginWithGoogle: vi.fn(),
  logout: vi.fn(),
  generateOtp: vi.fn(),
  verifyOtp: vi.fn(),
  refreshToken: vi.fn(),
}));
const recoveryMock = vi.hoisted(() => ({ clearBookingRecoveryContext: vi.fn() }));

vi.mock('@/lib/api', () => ({
  authApi: {
    getSession: apiMock.getSession,
    login: apiMock.login,
    register: apiMock.register,
    loginWithGoogle: apiMock.loginWithGoogle,
    logout: apiMock.logout,
    generateOtp: apiMock.generateOtp,
    verifyOtp: apiMock.verifyOtp,
  },
  clearAllAuthData: apiMock.clearAllAuthData,
  refreshToken: apiMock.refreshToken,
  hasAuthenticatedSession: (session: { success: boolean; user: object }) => session.success && 'id' in session.user,
}));

vi.mock('@/lib/bookingRecovery', () => recoveryMock);

import { useAuthStore } from '@/stores/authStore';

const user: User = { id: 'user-1', name: 'Asha', email: 'asha@example.com', role: 'user' };

function resetStore() {
  useAuthStore.setState({
    user: null,
    isAuthenticated: null,
    isLoading: false,
    error: null,
    otp: null,
    otpDelivery: null,
    otpVerification: null,
    otpLoading: false,
    otpError: null,
  });
}

describe('Auth store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    resetStore();
  });

  it('uses the session user after login', async () => {
    apiMock.login.mockResolvedValue({ data: { user: { ...user, name: 'Fallback' } } });
    apiMock.getSession.mockResolvedValue({ session: { success: true, user }, shouldRefresh: false });

    await useAuthStore.getState().login({ email: user.email, password: 'Secret1!' });

    expect(useAuthStore.getState()).toMatchObject({ user, isAuthenticated: true, isLoading: false });
  });

  it('stores the login error and stops loading when login fails', async () => {
    apiMock.login.mockRejectedValue(new Error('Invalid credentials'));

    await expect(useAuthStore.getState().login({ email: user.email, password: 'wrong' }))
      .rejects.toThrow('Invalid credentials');

    expect(useAuthStore.getState()).toMatchObject({
      isAuthenticated: null,
      isLoading: false,
      error: 'Invalid credentials',
    });
  });

  it('marks an unauthenticated session for token refresh', async () => {
    apiMock.getSession.mockResolvedValue({ session: { success: false, user: {} }, shouldRefresh: true });

    await expect(useAuthStore.getState().getSession()).resolves.toEqual({ authenticated: false, shouldRefresh: true });
    expect(useAuthStore.getState()).toMatchObject({ user: null, isAuthenticated: false, isLoading: false });
  });

  it('clears the user and saved booking details when token refresh fails', async () => {
    useAuthStore.setState({ user, isAuthenticated: true });
    apiMock.refreshToken.mockRejectedValue(new Error('Expired refresh token'));

    await expect(useAuthStore.getState().refreshToken()).resolves.toBe(false);

    expect(apiMock.clearAllAuthData).toHaveBeenCalledOnce();
    expect(recoveryMock.clearBookingRecoveryContext).toHaveBeenCalledOnce();
    expect(useAuthStore.getState()).toMatchObject({ user: null, isAuthenticated: false });
  });

  it('clears local auth data even if the logout API fails', async () => {
    useAuthStore.setState({
      user,
      isAuthenticated: true,
      otpDelivery: { email: user.email, expiresInMinutes: 10, emailDelivery: 'sent' },
    });
    apiMock.logout.mockRejectedValue(new Error('Offline'));

    await useAuthStore.getState().logout();

    expect(apiMock.clearAllAuthData).toHaveBeenCalledOnce();
    expect(recoveryMock.clearBookingRecoveryContext).toHaveBeenCalledOnce();
    expect(useAuthStore.getState()).toMatchObject({ user: null, isAuthenticated: false, otpDelivery: null });
  });

  it('stores successful OTP verification, reports expiry, and clears OTP state', async () => {
    const delivery = { email: user.email, expiresInMinutes: 10, emailDelivery: 'sent' } as const;
    const verification = { email: user.email, verifiedUntil: '2026-01-01T10:00:00Z' };
    apiMock.generateOtp.mockResolvedValue({ data: delivery });
    apiMock.verifyOtp.mockResolvedValue({ data: verification });

    await expect(useAuthStore.getState().generateOtp(user.email)).resolves.toEqual(delivery);
    await expect(useAuthStore.getState().verifyOtp(user.email, '123456')).resolves.toEqual(verification);
    expect(useAuthStore.getState().otpVerification).toEqual(verification);

    apiMock.verifyOtp.mockRejectedValue(new Error('Expired OTP'));
    await expect(useAuthStore.getState().verifyOtp(user.email, '123456')).resolves.toBeNull();
    expect(useAuthStore.getState().otpError).toBe('Expired OTP');

    useAuthStore.getState().clearOtp();
    expect(useAuthStore.getState()).toMatchObject({ otpDelivery: null, otpVerification: null, otpError: null });
  });
});
