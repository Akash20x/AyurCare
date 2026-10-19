import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

const router = vi.hoisted(() => ({ push: vi.fn() }));
const hooks = vi.hoisted(() => ({ appointment: vi.fn(), cancel: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => router,
  useParams: () => ({ id: 'appointment-1' }),
}));
vi.mock('@/stores/authStore', () => ({ useAuthStore: () => ({ isAuthenticated: true }) }));
vi.mock('@/hooks', () => ({
  useAppointment: () => hooks.appointment(),
  useCancelAppointment: () => hooks.cancel(),
}));

import AppointmentDetailsPage from '@/app/appointment/[id]/page';

const appointment = {
  id: 'appointment-1',
  status: 'BOOKED',
  doctor: { name: 'Dr. Asha', specialization: 'Panchakarma' },
  patientName: 'Patient',
  patientAge: null,
  patientGender: null,
  patientPhone: null,
  contactEmail: 'patient@example.com',
  consultationFee: 500,
  notes: null,
  timeSlot: { id: 'slot-1', date: '2026-10-21', startTime: '10:00', endTime: '10:30' },
};

describe('Appointment cancellation UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 19, 10, 0));
    hooks.appointment.mockReturnValue({ data: { data: appointment }, isLoading: false, error: null });
    hooks.cancel.mockReturnValue({ isPending: false, mutate: vi.fn() });
  });

  it('shows the slot-release message and requires confirmation for early cancellation', () => {
    const cancel = vi.fn((_input, callbacks: { onSuccess: () => void }) => callbacks.onSuccess());
    hooks.cancel.mockReturnValue({ isPending: false, mutate: cancel });
    render(<AppointmentDetailsPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel appointment' }));
    expect(screen.getByText(/This time slot will be released for other patients/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'No, Keep It' }));
    expect(cancel).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel appointment' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, Cancel' }));
    expect(cancel).toHaveBeenCalledWith({ id: 'appointment-1' }, expect.any(Object));
    expect(screen.queryByRole('button', { name: 'Yes, Cancel' })).toBeNull();
  });

  it('hides cancellation and rescheduling inside the 24-hour window', () => {
    hooks.appointment.mockReturnValue({
      data: { data: { ...appointment, timeSlot: { ...appointment.timeSlot, date: '2026-10-20', startTime: '09:00' } } },
      isLoading: false,
      error: null,
    });
    render(<AppointmentDetailsPage />);

    expect(screen.queryByRole('button', { name: 'Reschedule' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cancel appointment' })).toBeNull();
    expect(screen.getByText(/available until 24 hours before the appointment/)).toBeTruthy();
  });
});
