"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  name: string; 
}

export default function BackButton({ name }: BackButtonProps) {
  const router = useRouter();

  return (
    <Button
      variant="link"
      className="mb-4 text-emerald-700 hover:underline text-sm"
      onClick={() => router.back()}
    >
      ← {name}
    </Button>
  );
}
