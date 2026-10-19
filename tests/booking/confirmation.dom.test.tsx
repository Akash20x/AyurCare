import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const router = vi.hoisted(() => ({ push: vi.fn() }));
const hooks = vi.hoisted(() => ({ confirmation: vi.fn(), confirm: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('@/stores/authStore', () => ({ useAuthStore: () => ({ isAuthenticated: true }) }));
vi.mock('@/hooks', () => ({
  useBookingConfirmation: () => hooks.confirmation(),
  useConfirmBookingDraft: () => hooks.confirm(),
}));

import AppointmentConfirmationPage from '@/app/appointment/doctor/[slug]/book/page';
import { saveBookingRecoveryContext } from '@/lib/bookingRecovery';

function renderPage(children: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>);
}

const confirmation = {
  doctor: { name: 'Dr. Asha', specialization: 'Panchakarma', consultationFee: 500, venue: 'Main clinic' },
  appointment: { date: '2026-01-10', startTime: '10:00', endTime: '10:30' },
  patient: { name: 'Patient', email: 'patient@example.com', age: null, gender: null, phone: null },
};

describe('Booking confirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hooks.confirmation.mockReturnValue({ data: { data: confirmation }, isLoading: false, error: null });
    hooks.confirm.mockReturnValue({ isPending: false, isError: false, mutate: vi.fn() });
  });

  it('returns to doctor booking when confirmation gets a 409 conflict', async () => {
    saveBookingRecoveryContext({ doctorSlug: 'dr-asha' });
    hooks.confirm.mockReturnValue({
      isPending: false,
      isError: false,
      mutate: (_value: undefined, callbacks: { onError: (error: Error & { status?: number }) => void }) =>
        callbacks.onError(Object.assign(new Error('Slot unavailable'), { status: 409 })),
    });
    renderPage(<AppointmentConfirmationPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Confirm appointment' }));
    expect(screen.getByText('This booking draft or slot is no longer available. Please choose another slot.')).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: 'Choose another slot' }));
    expect(router.push).toHaveBeenCalledWith('/doctor/dr-asha/book');
  });

  it('shows success and redirects to the dashboard after confirmation', async () => {
    vi.useFakeTimers();
    hooks.confirm.mockReturnValue({
      isPending: false,
      isError: false,
      mutate: (_value: undefined, callbacks: { onSuccess: (value: { success: boolean }) => void }) => callbacks.onSuccess({ success: true }),
    });
    renderPage(<AppointmentConfirmationPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Confirm appointment' }));
    expect(screen.getByText('Appointment Confirmed!')).toBeTruthy();

    vi.advanceTimersByTime(2_000);
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });
});
