import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const router = vi.hoisted(() => ({ push: vi.fn() }));
const hooks = vi.hoisted(() => ({
  draft: vi.fn(),
  requestOtp: vi.fn(),
  verifyOtp: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('@/stores/authStore', () => ({ useAuthStore: () => ({ isAuthenticated: true }) }));
vi.mock('@/hooks', () => ({
  useBookingDraft: () => hooks.draft(),
  useRequestBookingDraftOtp: () => hooks.requestOtp(),
  useVerifyBookingDraftOtp: () => hooks.verifyOtp(),
}));

import VerifyOtpPageClient from '@/app/verify-otp/VerifyOtpPageClient';
import { saveBookingRecoveryContext } from '@/lib/bookingRecovery';

function renderPage(children: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>);
}

const draft = { contactEmail: 'patient@example.com' };

describe('Booking OTP verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hooks.draft.mockReturnValue({ data: { data: draft }, isLoading: false, error: null });
    hooks.requestOtp.mockReturnValue({ isPending: false, mutate: vi.fn() });
    hooks.verifyOtp.mockReturnValue({ isPending: false, mutate: vi.fn() });
  });

  it('opens confirmation after successful six-digit OTP verification', async () => {
    const verify = vi.fn((_otp: string, callbacks: { onSuccess: () => void }) => callbacks.onSuccess());
    hooks.verifyOtp.mockReturnValue({
      isPending: false,
      mutate: verify,
    });
    const user = userEvent.setup();
    renderPage(<VerifyOtpPageClient />);

    const inputs = screen.getAllByRole('textbox');
    for (const [index, value] of ['1', '2', '3', '4', '5', '6'].entries()) {
      await user.type(inputs[index], value);
    }
    await user.click(screen.getByRole('button', { name: 'Verify OTP' }));

    expect(verify).toHaveBeenCalledWith('123456', expect.any(Object));
    expect(router.push).toHaveBeenCalledWith('/appointment/doctor/confirmation/book');
  });

  it('shows the resend wait message after a 429 rate limit', async () => {
    vi.useFakeTimers();
    hooks.requestOtp.mockReturnValue({
      isPending: false,
      mutate: (_value: undefined, callbacks: { onError: (error: Error & { status?: number }) => void }) =>
        callbacks.onError(Object.assign(new Error('Too many requests'), { status: 429 })),
    });
    renderPage(<VerifyOtpPageClient />);

    act(() => vi.advanceTimersByTime(60_000));
    fireEvent.click(screen.getByRole('button', { name: 'Resend OTP' }));

    expect(screen.getByRole('alert').textContent).toContain('Please wait for the resend timer');
  });

  it('allows resend after an expired OTP error', async () => {
    hooks.verifyOtp.mockReturnValue({
      isPending: false,
      mutate: (_otp: string, callbacks: { onError: (error: Error & { status?: number }) => void }) =>
        callbacks.onError(Object.assign(new Error('Code expired'), { status: 400 })),
    });
    const user = userEvent.setup();
    renderPage(<VerifyOtpPageClient />);

    for (const [index, value] of ['1', '2', '3', '4', '5', '6'].entries()) {
      await user.type(screen.getAllByRole('textbox')[index], value);
    }
    await user.click(screen.getByRole('button', { name: 'Verify OTP' }));

    expect(screen.getByRole('alert').textContent).toContain('expired');
    expect((screen.getByRole('button', { name: 'Resend OTP' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('returns to doctor booking when the draft is missing', async () => {
    saveBookingRecoveryContext({ doctorSlug: 'dr-asha' });
    hooks.draft.mockReturnValue({ data: undefined, isLoading: false, error: new Error('Not found') });
    renderPage(<VerifyOtpPageClient />);

    await userEvent.click(screen.getByRole('button', { name: 'Choose another slot' }));

    expect(router.push).toHaveBeenCalledWith('/doctor/dr-asha/book');
  });
});
