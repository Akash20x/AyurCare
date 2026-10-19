import { createElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const api = vi.hoisted(() => ({ getAvailableSlots: vi.fn() }));
const mutations = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock('@/lib/api', () => ({ doctorApi: api }));
vi.mock('@/hooks/useDoctors', () => ({
  useCreateTimeSlots: () => ({ isPending: false, mutateAsync: mutations.create }),
  useCreateBatchTimeSlots: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));
vi.mock('@/components/ui/calendar', () => ({ Calendar: () => <div /> }));

describe('Admin slot scheduling', () => {
  it('shows newly created slots for the selected date', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 19, 8, 0));
    let created = false;
    api.getAvailableSlots.mockImplementation(async () => ({
      data: created ? [{
        slotId: 'slot-1',
        doctorId: 'doctor-1',
        date: '2026-10-19',
        startTime: '10:00',
        endTime: '10:30',
        status: 'AVAILABLE',
      }] : [],
    }));
    mutations.create.mockImplementation(async () => { created = true; });
    const { ScheduleManager } = await import('@/components/admin/ScheduleManager');
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children);
    render(<ScheduleManager doctorId="doctor-1" />, { wrapper });

    await screen.findByText('No future available slots on this date.');
    fireEvent.click(screen.getByRole('button', { name: 'Create slots' }));

    await waitFor(() => expect(screen.getByText('10:00 AM–10:30 AM')).toBeTruthy());
    expect(mutations.create).toHaveBeenCalledWith({
      doctorId: 'doctor-1',
      date: '2026-10-19',
      startTime: '09:00',
      endTime: '12:00',
    });
  });
});
