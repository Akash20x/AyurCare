"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBookingDraft, useRequestBookingDraftOtp, useVerifyBookingDraftOtp } from "@/hooks";
import { clearBookingRecoveryContext, getBookingRecoveryContext } from "@/lib/bookingRecovery";
import { useAuthStore } from "@/stores/authStore";

type RequestError = Error & { status?: number; code?: string };

function maskEmail(email: string) {
  const [localPart, domain] = email.split("@");
  if (!domain) return email;
  return `${localPart.slice(0, 1)}${"*".repeat(Math.max(localPart.length - 1, 3))}@${domain}`;
}

function isExpiredOtp(error: RequestError) {
  return error.status === 400 && /expired|not found/i.test(error.message);
}

export default function VerifyOtpPageClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [values, setValues] = useState<string[]>(Array(6).fill(""));
  const [countdown, setCountdown] = useState(60);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftUnavailable, setDraftUnavailable] = useState(false);
  const refs = useRef<HTMLInputElement[]>([]);
  const { data: draftResponse, isLoading: draftLoading, error: draftError } = useBookingDraft();
  const draft = draftResponse?.data;
  const requestOtpMutation = useRequestBookingDraftOtp();
  const verifyOtpMutation = useVerifyBookingDraftOtp();

  const clearDraftCache = () => queryClient.removeQueries({ queryKey: ["bookingDraft"] });
  const returnToSelection = () => {
    const doctorSlug = getBookingRecoveryContext()?.doctorSlug;
    clearDraftCache();
    clearBookingRecoveryContext();
    router.push(doctorSlug ? `/doctor/${doctorSlug}/book` : "/explore");
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (isAuthenticated === false && !token) router.push("/login");
  }, [isAuthenticated, router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((previous) => {
        if (previous <= 1) {
          setIsResendDisabled(false);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleMutationError = (mutationError: RequestError, fallback: string) => {
    if (mutationError.status === 404) {
      clearDraftCache();
      setDraftUnavailable(true);
    } else if (mutationError.status === 429) {
      setError("Please wait for the resend timer before requesting another code.");
    } else if (isExpiredOtp(mutationError)) {
      setError("This verification code has expired. Request a new code to continue.");
      setIsResendDisabled(false);
    } else {
      setError(mutationError.message || fallback);
    }
  };

  const handleResend = () => {
    if (isResendDisabled) return;
    setError(null);
    requestOtpMutation.mutate(undefined, {
      onSuccess: () => {
        setCountdown(60);
        setIsResendDisabled(true);
        setValues(Array(6).fill(""));
        refs.current[0]?.focus();
      },
      onError: (mutationError) => handleMutationError(mutationError, "Unable to resend the code."),
    });
  };

  const handleChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) return;
    const nextValues = [...values];
    nextValues[index] = value;
    setValues(nextValues);
    if (value && index < 5) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === "Backspace" && !values[index] && index > 0) refs.current[index - 1]?.focus();
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pastedValue = event.clipboardData.getData("text").trim();
    if (!/^\d+$/.test(pastedValue)) return;
    const nextValues = Array.from({ length: 6 }, (_, index) => pastedValue[index] || "");
    setValues(nextValues);
    refs.current[Math.min(pastedValue.length, 6) - 1]?.focus();
  };

  const handleVerifyOtp = () => {
    const otp = values.join("");
    if (otp.length !== 6) return;
    setError(null);
    verifyOtpMutation.mutate(otp, {
      onSuccess: () => router.push("/appointment/doctor/confirmation/book"),
      onError: (mutationError) => handleMutationError(mutationError, "Unable to verify the code."),
    });
  };

  if (isAuthenticated === undefined || draftLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-gray-50 p-4"><div role="status" aria-label="Loading verification" className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl"><span className="sr-only">Loading verification</span><Skeleton className="mx-auto h-7 w-28" /><Skeleton className="mx-auto mt-6 h-4 w-64" /><div className="mt-8 flex justify-center gap-2">{[1, 2, 3, 4, 5, 6].map((item) => <Skeleton key={item} className="size-12 rounded-lg" />)}</div><Skeleton className="mt-8 h-10 w-full" /><Skeleton className="mt-3 h-10 w-full" /></div></div>;
  }

  if (draftUnavailable || draftError || !draft) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-gray-50 p-4">
        <Card className="w-full max-w-md rounded-2xl shadow-xl">
          <CardContent className="py-8 text-center space-y-4">
            <p className="text-red-600">This booking draft is unavailable or has expired.</p>
            <Button onClick={returnToSelection}>Choose another slot</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const inputOtp = values.join("");
  const otpLoading = requestOtpMutation.isPending || verifyOtpMutation.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-gray-50 p-4">
      <Card className="w-full max-w-md rounded-2xl shadow-xl">
        <CardHeader><CardTitle className="text-xl text-center font-bold">Verify OTP</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-gray-600 text-sm">Enter the 6-digit code sent to {maskEmail(draft.contactEmail)}</p>
          {error && <div role="alert" className="text-sm text-red-600 bg-red-50 p-3 rounded-lg text-center">{error}</div>}
          <div className="flex justify-center gap-2">
            {values.map((value, index) => <input key={index} ref={(element) => { if (element) refs.current[index] = element; }} type="text" inputMode="numeric" maxLength={1} value={value} onChange={(event) => handleChange(event.target.value, index)} onKeyDown={(event) => handleKeyDown(event, index)} onPaste={handlePaste} className="w-12 h-12 border rounded-lg text-center text-2xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500" />)}
          </div>
          <p className="text-center text-gray-500 text-sm" aria-live="polite">Resend OTP in: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}</p>
          <div className="space-y-3">
            <Button className="w-full bg-green-500 hover:bg-green-600 text-white" onClick={handleVerifyOtp} disabled={otpLoading || inputOtp.length !== 6}>{verifyOtpMutation.isPending ? "Verifying..." : "Verify OTP"}</Button>
            <Button variant="outline" className="w-full" onClick={handleResend} disabled={isResendDisabled || otpLoading}>{requestOtpMutation.isPending ? "Sending..." : "Resend OTP"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
