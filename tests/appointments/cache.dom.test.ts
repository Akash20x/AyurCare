import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { User } from '@/types';

const apiMock = vi.hoisted(() => ({
  list: vi.fn(),
  cancel: vi.fn(),
  confirm: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  appointmentApi: { list: apiMock.list, cancel: apiMock.cancel },
  bookingDraftApi: { confirm: apiMock.confirm },
}));

import { useAuthStore } from '@/stores/authStore';
import {
  appointmentKeys,
  useAppointments,
  useCancelAppointment,
  useConfirmBookingDraft,
} from '@/hooks/useAppointments';

const patient: User = { id: 'patient-1', name: 'Patient', email: 'patient@example.com' };

function withQueryClient() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);

  return { client, wrapper };
}

describe('Appointment query cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it('waits for login and scopes appointment lists by user', async () => {
    apiMock.list.mockResolvedValueOnce({ data: [{ id: 'appointment-1' }] })
      .mockResolvedValueOnce({ data: [{ id: 'appointment-2' }] });
    const { client, wrapper } = withQueryClient();
    const { result } = renderHook(() => useAppointments(), { wrapper });

    expect(apiMock.list).not.toHaveBeenCalled();

    act(() => useAuthStore.setState({ user: patient, isAuthenticated: true }));
    await waitFor(() => expect(result.current.data?.data[0].id).toBe('appointment-1'));

    act(() => useAuthStore.setState({
      user: { ...patient, id: 'patient-2' },
      isAuthenticated: true,
    }));
    await waitFor(() => expect(result.current.data?.data[0].id).toBe('appointment-2'));

    expect(client.getQueryData<{ data: { id: string }[] }>(appointmentKeys.lists('patient-1'))?.data[0].id)
      .toBe('appointment-1');
    expect(apiMock.list).toHaveBeenCalledTimes(2);
  });

  it('refetches appointments after cancellation', async () => {
    useAuthStore.setState({ user: patient, isAuthenticated: true });
    apiMock.list.mockResolvedValueOnce({ data: [{ id: 'appointment-1' }] })
      .mockResolvedValueOnce({ data: [] });
    apiMock.cancel.mockResolvedValue({ success: true });
    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => ({
      appointments: useAppointments(),
      cancel: useCancelAppointment(),
    }), { wrapper });

    await waitFor(() => expect(result.current.appointments.data?.data).toHaveLength(1));
    await act(async () => result.current.cancel.mutateAsync({ id: 'appointment-1' }));

    await waitFor(() => expect(result.current.appointments.data?.data).toEqual([]));
    expect(apiMock.cancel).toHaveBeenCalledWith('appointment-1');
  });

  it('clears the draft and refetches appointments after confirmation', async () => {
    useAuthStore.setState({ user: patient, isAuthenticated: true });
    apiMock.list.mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [{ id: 'appointment-2' }] });
    apiMock.confirm.mockResolvedValue({ success: true, data: { id: 'appointment-2' } });
    const { client, wrapper } = withQueryClient();
    client.setQueryData(['bookingDraft', patient.id], { data: { id: 'draft-1' } });
    const { result } = renderHook(() => ({
      appointments: useAppointments(),
      confirm: useConfirmBookingDraft(),
    }), { wrapper });

    await waitFor(() => expect(result.current.appointments.data?.data).toEqual([]));
    await act(async () => result.current.confirm.mutateAsync());

    await waitFor(() => expect(result.current.appointments.data?.data[0].id).toBe('appointment-2'));
    expect(client.getQueryData(['bookingDraft', patient.id])).toBeUndefined();
  });
});
