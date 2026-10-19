"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/stores/authStore";

type GoogleSignInButtonProps = {
  onSuccess: () => void;
};

export function GoogleSignInButton({ onSuccess }: GoogleSignInButtonProps) {
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const [error, setError] = useState<string | null>(null);
  const [buttonWidth, setButtonWidth] = useState(400);
  const containerRef = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      // Google supports button widths from 200px to 400px. Keep it inside the
      // card rather than using a desktop-sized fixed width on narrow screens.
      setButtonWidth(Math.min(400, Math.max(200, Math.floor(container.clientWidth))));
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  if (!clientId) return null;

  return (
    <div className="space-y-7">
      <div ref={containerRef} className="flex w-full justify-center">
        <GoogleLogin
          onSuccess={async ({ credential }) => {
            if (!credential) {
              setError("Google did not return a sign-in credential. Please try again.");
              return;
            }

            setError(null);
            try {
              await loginWithGoogle(credential);
              onSuccess();
            } catch {
              // The Zustand store records the API message; keep a local fallback too.
              setError("Google sign-in failed. Please try again.");
            }
          }}
          onError={() => setError("Google sign-in was cancelled or unavailable. Please try again.")}
          text="continue_with"
          theme="outline"
          size="large"
          shape="pill"
          logo_alignment="center"
          width={buttonWidth}
        />
      </div>
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <span className="w-full border-t border-stone-200" />
        </div>
        <div className="relative flex justify-center text-base">
          <span className="bg-card px-3 text-slate-500">Or with email</span>
        </div>
      </div>
      {error && <p className="text-center text-xs text-red-600" role="alert">{error}</p>}
    </div>
  );
}
