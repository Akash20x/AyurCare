export type SpecializationValue =
  | "Panchakarma"
  | "Kayachikitsa"
  | "Shalya Tantra"
  | "Shalakya Tantra"
  | "Kaumarbhritya"
  | "Rasayana"
  | "Prasuti & Striroga"
  | "Agada Tantra"
  | "Swasthavritta"
  | "Manas Roga"
  | "Dravyaguna"
  | "Roga Nidana";

export interface Specialization {
  value: SpecializationValue;
  label: string;
}

export const SPECIALIZATIONS: ReadonlyArray<Specialization> = [
  { value: "Panchakarma", label: "Panchakarma" },
  { value: "Kayachikitsa", label: "Kayachikitsa (Internal Medicine)" },
  { value: "Shalya Tantra", label: "Shalya Tantra (Surgery)" },
  { value: "Shalakya Tantra", label: "Shalakya Tantra (Eye/ENT)" },
  { value: "Kaumarbhritya", label: "Kaumarbhritya (Pediatrics)" },
  { value: "Rasayana", label: "Rasayana & Geriatrics" },
  { value: "Prasuti & Striroga", label: "Prasuti & Striroga (Women’s Health)" },
  { value: "Agada Tantra", label: "Agada Tantra (Toxicology)" },
  { value: "Swasthavritta", label: "Swasthavritta (Preventive & Lifestyle)" },
  { value: "Manas Roga", label: "Manas Roga (Mind-Body)" },
  { value: "Dravyaguna", label: "Dravyaguna (Medicinal Plants)" },
  { value: "Roga Nidana", label: "Roga Nidana & Vikriti Vijnana (Diagnostics)" }
];

export const SPECIALIZATION_VALUES: ReadonlyArray<SpecializationValue> = SPECIALIZATIONS.map(
  s => s.value
);

export function getSpecializationLabel(value: SpecializationValue): string {
  const found = SPECIALIZATIONS.find(s => s.value === value);
  return found ? found.label : value;
}


























