import { createElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

const getAvailableSlots = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api', () => ({ doctorApi: { getAvailableSlots } }));

import { useAvailableSlots } from '@/hooks/useDoctors';

describe('Available appointment slots', () => {
  it('filters out past and booked slots for today', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 19, 10, 0));
    const date = '2026-10-19';
    getAvailableSlots.mockResolvedValue({ data: [
      { slotId: 'past', doctorId: 'doctor-1', date, startTime: '09:30', status: 'AVAILABLE' },
      { slotId: 'reserved', doctorId: 'doctor-1', date, startTime: '11:00', status: 'BOOKED' },
      { slotId: 'future', doctorId: 'doctor-1', date, startTime: '12:00', status: 'AVAILABLE' },
    ] });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children);

    const { result } = renderHook(
      () => useAvailableSlots({ doctorId: 'doctor-1', date }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.data?.map((slot) => slot.slotId)).toEqual(['future']));
    expect(getAvailableSlots).toHaveBeenCalledWith({ doctorId: 'doctor-1', date });
  });
});
