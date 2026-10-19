import { beforeEach, describe, expect, it, vi } from 'vitest';

const axiosMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  request: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => axiosMock),
  },
}));

import { appointmentApi, authApi, bookingDraftApi } from '@/lib/api';

const unauthorized = { response: { status: 401, data: { error: 'Session expired' } } };

describe('Authenticated API requests', () => {
  beforeEach(() => {
    axiosMock.get.mockReset();
    axiosMock.post.mockReset();
    axiosMock.request.mockReset();
  });

  it('clears stored auth data when token refresh fails', async () => {
    window.localStorage.setItem('auth-storage', 'persisted');
    axiosMock.request.mockRejectedValueOnce(unauthorized);
    axiosMock.post.mockRejectedValueOnce(new Error('Refresh failed'));

    await expect(appointmentApi.list()).rejects.toMatchObject({
      message: 'Authentication failed',
      status: 401,
    });

    expect(window.localStorage.getItem('auth-storage')).toBeNull();
  });

  it('preserves the 409 status, error code, and message when booking confirmation fails', async () => {
    axiosMock.request.mockRejectedValueOnce({
      message: 'Request failed',
      response: { status: 409, data: { error: 'Slot unavailable', code: 'LOCK_INVALID' } },
    });

    await expect(bookingDraftApi.confirm()).rejects.toMatchObject({
      message: 'Slot unavailable',
      status: 409,
      code: 'LOCK_INVALID',
    });
  });

  it('does not refresh the session for invalid login credentials', async () => {
    axiosMock.request.mockRejectedValueOnce({
      message: 'Request failed',
      response: { status: 401, data: { error: 'Invalid credentials' } },
    });

    await expect(authApi.login({ email: 'patient@example.com', password: 'wrong' }))
      .rejects.toMatchObject({ message: 'Invalid credentials', status: 401 });
    expect(axiosMock.post).not.toHaveBeenCalled();
  });

});
