import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

const router = vi.hoisted(() => ({ push: vi.fn(), back: vi.fn() }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
const hooks = vi.hoisted(() => ({ confirm: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams(
    'appointmentId=appointment-1&oldSlotId=old-slot&slotId=new-slot&doctorId=doctor-1&date=2099-01-10',
  ),
}));
vi.mock('sonner', () => ({ toast }));
vi.mock('@/stores/authStore', () => ({ useAuthStore: () => ({ isAuthenticated: true }) }));
vi.mock('@/hooks', () => ({
  useDoctorById: () => ({
    data: { data: { id: 'doctor-1', name: 'Dr. Asha', specialization: 'Panchakarma' } },
    isLoading: false,
    error: null,
  }),
  useSlot: () => ({
    data: { data: { slotId: 'new-slot', date: '2099-01-10', startTime: '10:00', endTime: '10:30' } },
    isLoading: false,
    error: null,
  }),
  useConfirmReschedule: () => hooks.confirm(),
}));

import RescheduleConfirmationPage from '@/app/appointment/doctor/[slug]/reschedule/page';

describe('Reschedule confirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits old and new slot IDs and redirects on success', () => {
    const confirm = vi.fn((_input, callbacks: { onSuccess: () => void }) => callbacks.onSuccess());
    hooks.confirm.mockReturnValue({ isPending: false, mutate: confirm });
    render(<RescheduleConfirmationPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Reschedule Appointment' }));

    expect(confirm).toHaveBeenCalledWith({
      appointmentId: 'appointment-1',
      oldSlotId: 'old-slot',
      newSlotId: 'new-slot',
      doctorId: 'doctor-1',
    }, expect.any(Object));
    expect(toast.success).toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith('/dashboard');
  });

  it('shows the API error and stays on confirmation if rescheduling fails', () => {
    hooks.confirm.mockReturnValue({
      isPending: false,
      mutate: (_input: unknown, callbacks: { onError: (error: Error) => void }) =>
        callbacks.onError(new Error('Slot no longer available')),
    });
    render(<RescheduleConfirmationPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Reschedule Appointment' }));

    expect(toast.error).toHaveBeenCalledWith('Slot no longer available');
    expect(router.push).not.toHaveBeenCalledWith('/dashboard');
  });
});
