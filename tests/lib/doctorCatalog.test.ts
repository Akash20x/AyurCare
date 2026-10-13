import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  DOCTOR_CATALOG_REVALIDATE_SECONDS,
  listDoctors,
  normalizeDoctorQuery,
} from "@/lib/server/doctorCatalog";

const response = (data: unknown) => ({
  ok: true,
  json: vi.fn().mockResolvedValue({ success: true, data }),
});

describe("doctor catalog", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("normalizes public search parameters", () => {
    expect(normalizeDoctorQuery({ q: "  Dr Mehta ", specialization: "  Panchakarma ", available: "earliest" })).toEqual({
      q: "Dr Mehta",
      specialization: "Panchakarma",
      earliestAvailable: "earliest",
    });
  });

  it("uses a 60-second Next data cache for normal doctor queries", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(response([]) as unknown as Response);

    await listDoctors({ specialization: "Panchakarma" });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("specialization=Panchakarma"),
      { next: { revalidate: DOCTOR_CATALOG_REVALIDATE_SECONDS } },
    );
  });

  it("keeps earliest-availability queries uncached", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(response([]) as unknown as Response);

    await listDoctors({ earliestAvailable: "earliest" });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("available=earliest"),
      { cache: "no-store" },
    );
  });
});
