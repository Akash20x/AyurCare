import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Doctor } from '@/types';
import { getBookingRecoveryContext } from '@/lib/bookingRecovery';

const router = vi.hoisted(() => ({ push: vi.fn() }));
const search = vi.hoisted(() => ({ value: '' }));
const auth = vi.hoisted(() => ({ state: { isAuthenticated: false, user: null as { name: string; email: string } | null } }));
const booking = vi.hoisted(() => ({
  consultationMode: 'in_person',
  selectedDate: '2099-01-10' as string | null,
  selectedSlotId: 'slot-1' as string | null,
  setConsultationMode: vi.fn(),
  setSelectedDate: vi.fn(),
  setSelectedSlotId: vi.fn(),
}));
const hooks = vi.hoisted(() => ({
  createDraft: vi.fn(),
  requestOtp: vi.fn(),
  reschedule: vi.fn(),
}));

vi.mock('next/dynamic', () => ({ default: () => () => <div /> }));
vi.mock('next/navigation', () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams(search.value),
}));
vi.mock('@/stores/authStore', () => ({ useAuthStore: () => auth.state }));
vi.mock('@/stores/doctorStore', () => ({
  useDoctorStore: () => booking,
}));
vi.mock('@/hooks', () => ({
  filterSlots: (slots: unknown[]) => slots,
  useAvailableDates: () => ({ data: {
    dates: ['2099-01-10', '2099-01-11'],
    slots: [{ slotId: 'slot-1', doctorId: 'doctor-1', date: '2099-01-10', startTime: '10:00', endTime: '10:30', status: 'AVAILABLE' }],
  }, isLoading: false }),
  useCreateBookingDraft: () => hooks.createDraft(),
  useRequestBookingDraftOtp: () => hooks.requestOtp(),
  useRescheduleAppointment: () => hooks.reschedule(),
}));

import BookAppointmentClient from '@/app/doctor/[slug]/book/BookAppointmentClient';

const doctor = {
  id: 'doctor-1',
  name: 'Dr. Asha',
  specialization: 'Panchakarma',
  experience: 8,
  consultationMode: 'in_person',
  consultationFee: 500,
} satisfies Doctor;

describe('Booking form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    search.value = '';
    auth.state = { isAuthenticated: false, user: { name: 'Asha', email: 'asha@example.com' } };
    booking.selectedDate = '2099-01-10';
    booking.selectedSlotId = 'slot-1';
    hooks.createDraft.mockReturnValue({ isPending: false, mutate: vi.fn() });
    hooks.requestOtp.mockReturnValue({ isPending: false, mutate: vi.fn() });
    hooks.reschedule.mockReturnValue({ isPending: false, mutate: vi.fn() });
  });

  it('redirects unauthenticated users to login with the selected slot preserved', async () => {
    render(<BookAppointmentClient doctor={doctor} slug="dr-asha" />);
    expect(screen.queryByLabelText('Email address *')).toBeNull();
    expect(screen.queryByLabelText('Patient name *')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Sign in to continue' }));

    const loginUrl = new URL(router.push.mock.calls[0][0], 'http://localhost');
    const returnUrl = new URL(loginUrl.searchParams.get('next')!, 'http://localhost');
    expect(loginUrl.pathname).toBe('/login');
    expect(returnUrl.pathname).toBe('/doctor/dr-asha/book');
    expect(returnUrl.searchParams.get('slotId')).toBe('slot-1');
    expect(returnUrl.searchParams.get('date')).toBe('2099-01-10');
  });

  it('creates a booking draft, requests OTP, and opens verification', async () => {
    auth.state = { isAuthenticated: true, user: { name: 'Asha', email: 'asha@example.com' } };
    const createDraft = vi.fn((_input, callbacks) => callbacks.onSuccess());
    const requestOtp = vi.fn((_input, callbacks) => callbacks.onSuccess());
    hooks.createDraft.mockReturnValue({ isPending: false, mutate: createDraft });
    hooks.requestOtp.mockReturnValue({ isPending: false, mutate: requestOtp });
    render(<BookAppointmentClient doctor={doctor} slug="dr-asha" />);

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(createDraft).toHaveBeenCalledWith(expect.objectContaining({
      doctorId: 'doctor-1', timeSlotId: 'slot-1', contactEmail: 'asha@example.com',
      patient: expect.objectContaining({ name: 'Asha' }),
    }), expect.any(Object));
    expect(requestOtp).toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith('/verify-otp');
    expect(getBookingRecoveryContext()).toEqual({ doctorSlug: 'dr-asha' });
  });

  it('requires a new time when the selected slot belongs to a previous date', () => {
    auth.state = { isAuthenticated: true, user: { name: 'Asha', email: 'asha@example.com' } };
    booking.selectedDate = '2099-01-11';
    booking.selectedSlotId = 'slot-1';

    render(<BookAppointmentClient doctor={doctor} slug="dr-asha" />);

    expect(screen.getByText('Please select a date and time to continue')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Continue' })).toHaveProperty('disabled', true);
  });

  it('blocks draft creation for an invalid contact email', async () => {
    auth.state = { isAuthenticated: true, user: { name: 'Asha', email: 'bad-email' } };
    const createDraft = vi.fn();
    hooks.createDraft.mockReturnValue({ isPending: false, mutate: createDraft });
    render(<BookAppointmentClient doctor={doctor} slug="dr-asha" />);

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByText('Enter a valid contact email address.')).toBeTruthy();
    expect(createDraft).not.toHaveBeenCalled();
  });

  it('shows the slot conflict when draft creation fails', async () => {
    auth.state = { isAuthenticated: true, user: { name: 'Asha', email: 'asha@example.com' } };
    hooks.createDraft.mockReturnValue({
      isPending: false,
      mutate: (_input: unknown, callbacks: { onError: (error: Error) => void }) => callbacks.onError(new Error('Slot unavailable')),
    });
    render(<BookAppointmentClient doctor={doctor} slug="dr-asha" />);

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByText('Slot unavailable')).toBeTruthy();
  });

  it('stays on the booking form when the OTP request fails', async () => {
    auth.state = { isAuthenticated: true, user: { name: 'Asha', email: 'asha@example.com' } };
    hooks.createDraft.mockReturnValue({
      isPending: false,
      mutate: (_input: unknown, callbacks: { onSuccess: () => void }) => callbacks.onSuccess(),
    });
    hooks.requestOtp.mockReturnValue({
      isPending: false,
      mutate: (_input: unknown, callbacks: { onError: (error: Error) => void }) =>
        callbacks.onError(new Error('Unable to send code')),
    });
    render(<BookAppointmentClient doctor={doctor} slug="dr-asha" />);

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByText('Unable to send code')).toBeTruthy();
    expect(router.push).not.toHaveBeenCalledWith('/verify-otp');
  });

  it('locks the replacement slot and opens reschedule confirmation', async () => {
    search.value = 'appointmentId=appointment-1&oldSlotId=old-slot';
    auth.state = { isAuthenticated: true, user: { name: 'Asha', email: 'asha@example.com' } };
    const reschedule = vi.fn((_input, callbacks: { onSuccess: () => void }) => callbacks.onSuccess());
    hooks.reschedule.mockReturnValue({ isPending: false, mutate: reschedule });
    render(<BookAppointmentClient doctor={doctor} slug="dr-asha" />);

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(reschedule).toHaveBeenCalledWith(
      { id: 'appointment-1', newTimeSlotId: 'slot-1' },
      expect.any(Object),
    );
    const target = new URL(router.push.mock.calls[0][0], 'http://localhost');
    expect(target.pathname).toBe('/appointment/doctor/dr-asha/reschedule');
    expect(target.searchParams.get('oldSlotId')).toBe('old-slot');
    expect(target.searchParams.get('slotId')).toBe('slot-1');
  });
});
