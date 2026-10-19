import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { getDoctorBySlug, listDoctorPage } from '@/lib/server/doctorCatalog';

const doctor = {
  id: 'doctor-1',
  name: 'Dr. Asha Sharma',
  specialization: 'Panchakarma',
  consultationMode: 'in_person',
  experience: 8,
};

describe('Doctor catalog', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('requests uncached doctor data for earliest-availability sorting', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [doctor] }),
    });

    const result = await listDoctorPage({ earliestAvailable: 'earliest' });

    expect(result.data.data).toEqual([doctor]);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('available=earliest'),
      { cache: 'no-store' },
    );
  });

  it('matches a doctor slug to the exact doctor among similar names', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [
        { ...doctor, id: 'doctor-2', name: 'Dr. Asha Mehta' },
        doctor,
      ] }),
    });

    const result = await getDoctorBySlug('dr-asha-sharma');

    expect(result.data?.id).toBe('doctor-1');
    expect(result.error).toBeNull();
  });

  it('returns an empty list and error when the catalog request fails', async () => {
    fetchMock.mockRejectedValue(new Error('Network unavailable'));

    const result = await listDoctorPage({});

    expect(result.data.data).toEqual([]);
    expect(result.error).toBe('Unable to load doctors right now.');
  });
});
