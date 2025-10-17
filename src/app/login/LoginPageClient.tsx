"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { UserLoginInput, userLoginSchema } from "@/lib/validations";
import { validateForm } from "@/lib/form";
import { Leaf } from "lucide-react";

export default function LoginPageClient() {
  const { login, isLoading, clearError, error } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState<UserLoginInput>({
    email: "",
    password: "",
  });

  const [formErrors, setFormErrors] = useState<Partial<UserLoginInput>>({});

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const { data, errors } = validateForm(userLoginSchema, formData);

    if (!data) {
      setFormErrors(errors);
      return;
    }

    try {
      await login(formData);
      const next = searchParams.get("next");
      router.push(next || "/dashboard");
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  return (
    <div className="h-[calc(100vh-2rem)] 2xl:h-[calc(100vh-4rem)] flex items-center justify-center bg-[#f8faf8] p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-green-100">
            <Leaf className="h-6 w-6 text-green-700" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 text-sm">
            Sign in to continue your Ayurvedic wellness journey
          </p>
        </div>

        <Card className="shadow-sm border rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-center font-semibold">Sign In</CardTitle>
            <p className="text-center text-gray-500 text-sm">
              Enter your credentials to access your account
            </p>

            {error && (
              <div className="mt-3 text-center">
                <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 inline-block">
                  {typeof error === "string" ? error : "Login failed. Please try again."}
                </p>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className={formErrors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {formErrors.email && <p className="text-xs text-red-600">{formErrors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className={formErrors.password ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {formErrors.password && (
                  <p className="text-xs text-red-600">{formErrors.password}</p>
                )}
              </div>

              <Button type="submit" className="w-full bg-green-700 hover:bg-green-800 text-white cursor-pointer">
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-green-700 hover:underline font-medium cursor-pointer">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div> 
  );
}
