"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/authStore";
import { useDoctorById } from "@/hooks";

function slugify(value: string): string {
  return value 
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function VerifyOtpPageClient() {
  const params = useSearchParams();
  const router = useRouter();

  const doctorId = params.get("doctorId");
  const date = params.get("date");
  const mode = params.get("mode");
  const appointmentId = params.get("appointmentId");
  const oldSlotId = params.get("oldSlotId");
  const isReschedule = !!appointmentId && appointmentId.trim() !== "";
  const slotId = isReschedule ? params.get("newSlotId") : params.get("slotId");

  const { user, isAuthenticated, generateOtp, verifyOtp, otp, otpLoading, otpError } =
    useAuthStore();

  const { data } = useDoctorById(doctorId);
  const doctor = data?.data;

  const [values, setValues] = useState<string[]>(Array(6).fill(""));
  const [countdown, setCountdown] = useState(60);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refs = useRef<HTMLInputElement[]>([]);
  const otpGeneratedRef = useRef(false);

  // Redirect if not authenticated
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (isAuthenticated === false && !token) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Generate OTP when authenticated
  const handleGenerateOtp = useCallback(async () => {
    if (!user?.email) return;
    setError(null);
    await generateOtp(user.email);
    setCountdown(60);
    setIsResendDisabled(true);
    refs.current[0]?.focus();
  }, [user?.email, generateOtp]);

  useEffect(() => {
    if (isAuthenticated && user?.email && !otpGeneratedRef.current) {
      handleGenerateOtp();
      otpGeneratedRef.current = true;
    }
  }, [isAuthenticated, user?.email, handleGenerateOtp]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const handleResend = () => { if (!isResendDisabled) handleGenerateOtp(); };

  // OTP input handlers
  const handleChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newValues = [...values];
    newValues[index] = value;
    setValues(newValues);
    if (value && index < 5) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !values[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    if (!/^\d+$/.test(pasteData)) return;
    const newValues = [...values];
    for (let i = 0; i < 6; i++) newValues[i] = pasteData[i] || "";
    setValues(newValues);
    const nextIndex = newValues.findIndex((v) => v === "");
    if (nextIndex !== -1) refs.current[nextIndex]?.focus();
    else refs.current[5]?.focus();
  };

  const handleVerifyOtp = async () => {
    const inputOtp = values.join("");
    if (inputOtp.length !== 6) return;

    const success = await verifyOtp(user?.email || "", inputOtp);
    if (!success) return;

    try {
      const doctorSlug = slugify(doctor?.name || "");
      if (isReschedule) {
        router.push(
          `/appointment/doctor/${doctorSlug}/reschedule?date=${date}&slotId=${slotId}&appointmentId=${appointmentId}&oldSlotId=${oldSlotId}&doctorId=${doctorId}&mode=${mode}`
        );
      } else {
        router.push(
          `/appointment/doctor/${doctorSlug}/book?date=${date}&slotId=${slotId}&mode=${mode}`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch doctor details");
    }
  };

  const inputOtp = values.join("");

  if (isAuthenticated === undefined || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-gray-50 p-4">
      <Card className="w-full max-w-md rounded-2xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl text-center font-bold">Verify OTP</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-center text-gray-600 text-sm">
            Enter the 6-digit code sent to your registered mobile number
          </p>

          {(error || otpError) && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg text-center">
              {error || otpError}
            </div>
          )}

          <div className="flex justify-center gap-2">
            {values.map((v, i) => (
              <input
                key={i}
                ref={(el) => { refs.current[i] = el!; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={v}
                onChange={(e) => handleChange(e.target.value, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                onPaste={handlePaste}
                className="w-12 h-12 border rounded-lg text-center text-2xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            ))}
          </div>

          <p className="text-center text-gray-500 text-sm">Resend OTP in: {formatTime(countdown)}</p>

          <Button
            className="w-full bg-green-500 hover:bg-green-600 text-white"
            onClick={handleVerifyOtp}
            disabled={otpLoading || inputOtp.length !== 6}
          >
            {otpLoading ? "Verifying..." : "Verify OTP"}
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleResend}
            disabled={isResendDisabled || otpLoading}
          >
            Resend OTP
          </Button>

          {otp && (
            <div className="mt-4 p-2 bg-green-50 text-green-700 rounded-lg text-center text-sm">
              <strong>Mock OTP (For Testing):</strong> {otp}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
