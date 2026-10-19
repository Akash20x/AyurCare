"use client";

import { cloneElement, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Doctor, DoctorInput } from "@/types";
import { useCreateDoctor, useUpdateDoctor } from "@/hooks/useDoctors";

type DoctorFormState = Omit<DoctorInput, "languages"> & { languages: string };

const blankDoctor: DoctorFormState = { name: "", email: "", phone: "", specialization: "", consultationFee: 500, languages: "Hindi, English", clinicName: "", city: "", experience: 0, bio: "", imageUrl: "" };

function toFormState(doctor?: Doctor): DoctorFormState {
  if (!doctor) return blankDoctor;
  return { name: doctor.name, email: doctor.email ?? "", phone: doctor.phone ?? "", specialization: doctor.specialization, consultationFee: doctor.consultationFee ?? 500, languages: doctor.languages?.join(", ") ?? "Hindi, English", clinicName: doctor.clinicName ?? "", city: doctor.city ?? "", experience: doctor.experience, bio: doctor.bio ?? "", imageUrl: doctor.imageUrl ?? "" };
}

export function DoctorForm({ doctor }: { doctor?: Doctor }) {
  const router = useRouter();
  const createDoctor = useCreateDoctor();
  const updateDoctor = useUpdateDoctor();
  const [values, setValues] = useState<DoctorFormState>(() => toFormState(doctor));
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(doctor);
  const pending = createDoctor.isPending || updateDoctor.isPending;

  const update = (field: keyof DoctorFormState, value: string | number) => setValues((current) => ({ ...current, [field]: value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const languages = values.languages.split(",").map((language) => language.trim()).filter(Boolean);
    if (!values.name.trim() || !values.email.trim() || !values.specialization.trim() || values.experience < 0 || languages.length === 0) {
      setError("Complete the required fields and provide at least one language.");
      return;
    }
    const payload: DoctorInput = { ...values, name: values.name.trim(), email: values.email.trim(), specialization: values.specialization.trim(), languages, phone: values.phone || null, clinicName: values.clinicName || null, city: values.city || null, bio: values.bio || null, imageUrl: values.imageUrl || null };
    try {
      const response = isEditing && doctor ? await updateDoctor.mutateAsync({ doctorId: doctor.id, data: payload }) : await createDoctor.mutateAsync(payload);
      const savedDoctor = response.data?.doctor;
      toast.success(isEditing ? "Doctor updated" : "Doctor created");
      router.push(savedDoctor ? `/admin/doctors/${savedDoctor.id}/schedule` : "/admin/doctors");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save the doctor.");
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>{isEditing ? "Update doctor" : "Create doctor"}</CardTitle><CardDescription>Fields marked with an asterisk are required.</CardDescription></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-5" noValidate>
          {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Doctor name" required><Input value={values.name} onChange={(event) => update("name", event.target.value)} required /></Field>
            <Field label="Email" required><Input type="email" value={values.email} onChange={(event) => update("email", event.target.value)} required /></Field>
            <Field label="Phone"><Input value={values.phone ?? ""} onChange={(event) => update("phone", event.target.value)} /></Field>
            <Field label="Specialization" required><Input value={values.specialization} onChange={(event) => update("specialization", event.target.value)} required /></Field>
            <Field label="Experience (years)" required><Input type="number" min="0" max="80" value={values.experience} onChange={(event) => update("experience", Number(event.target.value))} required /></Field>
            <Field label="Consultation fee (₹)"><Input type="number" min="0" value={values.consultationFee} onChange={(event) => update("consultationFee", Number(event.target.value))} /></Field>
            <Field label="Languages" required hint="Separate each language with a comma."><Input value={values.languages} onChange={(event) => update("languages", event.target.value)} required /></Field>
            <Field label="Clinic name"><Input value={values.clinicName ?? ""} onChange={(event) => update("clinicName", event.target.value)} /></Field>
            <Field label="City"><Input value={values.city ?? ""} onChange={(event) => update("city", event.target.value)} /></Field>
            <Field label="Profile image URL"><Input type="url" value={values.imageUrl ?? ""} onChange={(event) => update("imageUrl", event.target.value)} /></Field>
          </div>
          <Field label="Bio"><textarea value={values.bio ?? ""} onChange={(event) => update("bio", event.target.value)} className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]" maxLength={2000} /></Field>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button><Button type="submit" className="bg-green-700 hover:bg-green-800 text-white" disabled={pending}>{pending ? "Saving…" : isEditing ? "Save changes" : "Create doctor"}</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactElement<{ id?: string }> }) {
  const id = `doctor-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
  return <div className="grid gap-2"><Label htmlFor={id}>{label}{required ? " *" : ""}</Label>{cloneElement(children, { id })}{hint && <p className="text-xs text-muted-foreground">{hint}</p>}</div>;
}
