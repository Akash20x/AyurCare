import { DoctorForm } from "@/components/admin/DoctorForm";

export default function NewDoctorPage() {
  return <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12"><div className="mb-8"><p className="text-sm font-medium text-green-700">Doctor directory</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Add a doctor</h1><p className="mt-2 text-muted-foreground">Create the information patients use to find and book a consultation.</p></div><DoctorForm /></main>;
}
