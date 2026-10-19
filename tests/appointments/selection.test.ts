import { describe, expect, it, vi } from 'vitest';
import { getNextAppointment } from '@/lib/appointments';
import { can24HoursBefore } from '@/lib/helpers';
import type { AppointmentListItem } from '@/types';

function appointment(id: string, date: string, startTime: string, status: AppointmentListItem['status'] = 'BOOKED'): AppointmentListItem {
  return {
    id,
    status,
    contactEmail: 'patient@example.com',
    consultationFee: 500,
    patientName: 'Patient',
    doctor: { name: 'Dr. Asha', specialization: 'Panchakarma' },
    timeSlot: { date, startTime, endTime: '11:00' },
  };
}

describe('Upcoming appointment selection', () => {
  it('returns no upcoming appointment for past, cancelled, or unscheduled bookings', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T10:00:00'));

    expect(getNextAppointment([])).toBeNull();
    expect(getNextAppointment([
      appointment('past', '2026-01-01', '09:00'),
      appointment('cancelled', '2026-01-02', '09:00', 'CANCELLED'),
      { ...appointment('missing-slot', '2026-01-02', '09:00'), timeSlot: null },
    ])).toBeNull();
  });

  it('selects the nearest future booked appointment', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T10:00:00'));
    const appointments = [
      appointment('later', '2026-01-03', '09:00'),
      appointment('next', '2026-01-01', '11:00'),
      appointment('tomorrow', '2026-01-02', '09:00'),
    ];

    expect(getNextAppointment(appointments)?.id).toBe('next');
  });

  it('allows cancellation at 24 hours but not at 23 hours 59 minutes', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T10:00:00'));

    expect(can24HoursBefore('2026-01-02', '10:00')).toBe(true);
    expect(can24HoursBefore('2026-01-02', '09:59')).toBe(false);
  });
});
