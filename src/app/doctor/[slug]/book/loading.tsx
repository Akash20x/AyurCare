export default function BookingLoading() {
  return (
    <div className="min-h-screen p-6" aria-label="Loading booking page">
      <div className="mx-auto max-w-4xl space-y-6 animate-pulse">
        <div className="h-10 w-32 rounded bg-gray-200" />
        <div className="h-24 rounded-xl bg-gray-200" />
        <div className="grid gap-6 lg:grid-cols-2"><div className="h-64 rounded-xl bg-gray-200" /><div className="h-64 rounded-xl bg-gray-200" /></div>
      </div>
    </div>
  );
}
