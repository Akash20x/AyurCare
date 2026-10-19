import "server-only";

import { cache } from "react";
import type { Doctor, DoctorQuery, PaginatedDoctorResponse } from "@/types";
import { toSlug } from "@/lib/helpers";

const API_BASE_URL = (
  process.env.API_INTERNAL_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api"
).replace(/\/$/, "");

export const DOCTOR_CATALOG_REVALIDATE_SECONDS = 60;

export type DoctorCatalogResult<T> = {
  data: T;
  error: string | null;
};

function stringValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeDoctorQuery(query: Record<string, string | string[] | undefined>): DoctorQuery {
  const normalized: DoctorQuery = {};
  const q = stringValue(query.q);
  const specialization = stringValue(query.specialization);

  if (q) normalized.q = q;
  if (specialization) normalized.specialization = specialization;
  if (stringValue(query.available) === "earliest") normalized.earliestAvailable = "earliest";

  return normalized;
}

function doctorListUrl(query: DoctorQuery) {
  const params = new URLSearchParams();

  if (query.q) params.set("q", query.q);
  if (query.specialization) params.set("specialization", query.specialization);
  if (query.consultationMode) params.set("consultation_mode", query.consultationMode);
  if (query.earliestAvailable === "earliest") params.set("available", "earliest");
  if (query.limit) params.set("limit", String(query.limit));

  const queryString = params.toString();
  return `${API_BASE_URL}/doctors${queryString ? `?${queryString}` : ""}`;
}

export const listDoctorPage = cache(async (query: DoctorQuery = {}): Promise<DoctorCatalogResult<PaginatedDoctorResponse>> => {
  const isAvailabilityQuery = query.earliestAvailable === "earliest";

  try {
    const response = await fetch(doctorListUrl(query), isAvailabilityQuery
      ? { cache: "no-store" }
      : { next: { revalidate: DOCTOR_CATALOG_REVALIDATE_SECONDS } });

    if (!response.ok) {
      return {
        data: { success: false, data: [], currentPage: query.page ?? 1, pageSize: 0, totalPages: 0, totalResults: 0 },
        error: "Unable to load doctors right now.",
      };
    }

    const payload = await response.json() as PaginatedDoctorResponse;
    return {
      data: {
        ...payload,
        data: Array.isArray(payload.data) ? payload.data : [],
      },
      error: null,
    };
  } catch {
    return {
      data: { success: false, data: [], currentPage: query.page ?? 1, pageSize: 0, totalPages: 0, totalResults: 0 },
      error: "Unable to load doctors right now.",
    };
  }
});

export const listDoctors = cache(async (query: DoctorQuery = {}): Promise<DoctorCatalogResult<Doctor[]>> => {
  const result = await listDoctorPage(query);
  return { data: result.data.data ?? [], error: result.error };
});

export const getDoctorBySlug = cache(async (slug: string): Promise<DoctorCatalogResult<Doctor | null>> => {
  const normalizedSlug = toSlug(slug);
  const result = await listDoctors({ q: normalizedSlug.replace(/-/g, " ") });

  if (result.error) return { data: null, error: result.error };

  return {
    data: result.data.find((doctor) => toSlug(doctor.name) === normalizedSlug) ?? null,
    error: null,
  };
});
