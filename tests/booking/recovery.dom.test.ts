import { describe, expect, it } from 'vitest';
import {
  clearBookingRecoveryContext,
  getBookingRecoveryContext,
  saveBookingRecoveryContext,
} from '@/lib/bookingRecovery';

describe('Selected doctor saved for an interrupted booking', () => {
  it('saves the selected doctor and clears it when no longer needed', () => {
    saveBookingRecoveryContext({ doctorSlug: 'dr-asha' });
    expect(getBookingRecoveryContext()).toEqual({ doctorSlug: 'dr-asha' });

    clearBookingRecoveryContext();
    expect(getBookingRecoveryContext()).toBeNull();
  });

  it('ignores empty or corrupted saved doctor data', () => {
    saveBookingRecoveryContext({ doctorSlug: '' });
    expect(getBookingRecoveryContext()).toBeNull();

    window.sessionStorage.setItem('ayurcare:booking-recovery', '{invalid');
    expect(getBookingRecoveryContext()).toBeNull();

    window.sessionStorage.setItem('ayurcare:booking-recovery', JSON.stringify({ doctorSlug: 42 }));
    expect(getBookingRecoveryContext()).toBeNull();
  });
});
