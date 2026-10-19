import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Doctor } from '@/types';

const router = vi.hoisted(() => ({ push: vi.fn() }));
const navigation = vi.hoisted(() => ({ search: '' }));
const patient = vi.hoisted(() => ({
  id: 'patient-1',
  name: 'Asha',
  email: 'asha@example.com',
  role: 'user' as const,
}));
const auth = vi.hoisted(() => ({
  state: {
    user: null as typeof patient | null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    clearError: vi.fn(),
    login: vi.fn(),
  },
}));
const api = vi.hoisted(() => ({
  slots: vi.fn(),
  create: vi.fn(),
  getDraft: vi.fn(),
  requestOtp: vi.fn(),
  verifyOtp: vi.fn(),
  getConfirmation: vi.fn(),
  confirm: vi.fn(),
}));
const selection = vi.hoisted(() => ({
  state: {
    consultationMode: 'in_person' as const,
    selectedDate: null as string | null,
    selectedSlotId: null as string | null,
    setConsultationMode: vi.fn(),
    setSelectedDate: vi.fn(),
    setSelectedSlotId: vi.fn(),
  },
}));

vi.mock('next/dynamic', () => ({ default: () => () => <div /> }));
vi.mock('next/navigation', () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams(navigation.search),
}));
vi.mock('@/components/auth/GoogleSignInButton', () => ({ GoogleSignInButton: () => null }));
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector?: (state: typeof auth.state) => unknown) =>
    selector ? selector(auth.state) : auth.state,
}));
vi.mock('@/stores/doctorStore', () => ({ useDoctorStore: () => selection.state }));
vi.mock('@/lib/api', () => ({
  appointmentApi: {},
  doctorApi: { getAvailableSlots: api.slots },
  bookingDraftApi: {
    create: api.create,
    get: api.getDraft,
    requestOtp: api.requestOtp,
    verifyOtp: api.verifyOtp,
    getConfirmation: api.getConfirmation,
    confirm: api.confirm,
  },
}));

import LoginPageClient from '@/app/login/LoginPageClient';
import BookAppointmentClient from '@/app/doctor/[slug]/book/BookAppointmentClient';
import VerifyOtpPageClient from '@/app/verify-otp/VerifyOtpPageClient';
import AppointmentConfirmationPage from '@/app/appointment/doctor/[slug]/book/page';
import { formatDateKey } from '@/lib/helpers';

const doctor: Doctor = {
  id: 'doctor-1',
  name: 'Dr. Asha',
  specialization: 'Panchakarma',
  consultationMode: 'in_person',
  experience: 8,
};

describe('Patient booking flow', () => {
  it('completes login, draft creation, OTP verification, and confirmation', async () => {
    vi.clearAllMocks();
    auth.state.user = null;
    auth.state.isAuthenticated = false;
    const date = new Date();
    date.setDate(date.getDate() + 3);
    const dateKey = formatDateKey(date);
    selection.state.selectedDate = dateKey;
    selection.state.selectedSlotId = 'slot-1';
    const bookingPath = `/doctor/dr-asha/book?date=${dateKey}&slotId=slot-1`;
    navigation.search = new URLSearchParams({ next: bookingPath }).toString();
    auth.state.login.mockImplementation(async () => {
      auth.state.user = patient;
      auth.state.isAuthenticated = true;
    });
    api.slots.mockResolvedValue({ data: [{
      slotId: 'slot-1',
      doctorId: doctor.id,
      date: dateKey,
      startTime: '10:00',
      endTime: '10:30',
      status: 'AVAILABLE',
    }] });
    api.create.mockResolvedValue({ success: true, data: { id: 'draft-1' } });
    api.requestOtp.mockResolvedValue({ success: true, data: { email: patient.email } });
    api.getDraft.mockResolvedValue({ success: true, data: { contactEmail: patient.email } });
    api.verifyOtp.mockResolvedValue({ success: true, data: { verified: true } });
    api.getConfirmation.mockResolvedValue({ success: true, data: {
      doctor: { name: doctor.name, specialization: doctor.specialization, venue: 'Main clinic' },
      appointment: { date: dateKey, startTime: '10:00', endTime: '10:30' },
      patient: { name: patient.name, email: patient.email, age: null, gender: null, phone: null },
    } });
    api.confirm.mockResolvedValue({ success: true, data: { id: 'appointment-1' } });
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const user = userEvent.setup();
    const page = (component: React.ReactNode) =>
      <QueryClientProvider client={client}>{component}</QueryClientProvider>;
    const view = render(page(<LoginPageClient />));

    await user.type(screen.getByLabelText('Email'), patient.email);
    await user.type(screen.getByLabelText('Password'), 'Secret1!');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith(bookingPath));

    navigation.search = new URL(bookingPath, 'http://localhost').search;
    view.rerender(page(<BookAppointmentClient doctor={doctor} slug="dr-asha" />));
    await waitFor(() => expect((screen.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(false));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/verify-otp'));
    expect(api.create).toHaveBeenCalledWith(expect.objectContaining({ timeSlotId: 'slot-1' }));

    view.rerender(page(<VerifyOtpPageClient />));
    await screen.findByRole('button', { name: 'Verify OTP' });
    for (const [index, digit] of ['1', '2', '3', '4', '5', '6'].entries()) {
      await user.type(screen.getAllByRole('textbox')[index], digit);
    }
    await user.click(screen.getByRole('button', { name: 'Verify OTP' }));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/appointment/doctor/confirmation/book'));

    view.rerender(page(<AppointmentConfirmationPage />));
    await user.click(await screen.findByRole('button', { name: 'Confirm appointment' }));
    await screen.findByText('Appointment Confirmed!');
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/dashboard'), { timeout: 3500 });
    expect(api.confirm).toHaveBeenCalledOnce();
  });
});
