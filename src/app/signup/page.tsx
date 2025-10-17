"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import z from "zod";
import { userRegistrationSchema } from "@/lib/validations";
import { validateForm } from "@/lib/form";
import { Leaf, Eye, EyeOff } from "lucide-react";

const registerFormSchema = userRegistrationSchema
  .extend({
    confirmPassword: z.string().min(1, "Password confirmation is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerFormSchema>;

export default function SignupPage() {
  const { register, isLoading, clearError, error } = useAuthStore();
  const router = useRouter();

  const [formData, setFormData] = useState<RegisterFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [formErrors, setFormErrors] = useState<Partial<RegisterFormData>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
  clearError();
}, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const { data, errors } = validateForm(registerFormSchema, formData);

    if (!data) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    try {
      await register({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      router.push("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8faf8] p-4">
      <div className="w-full max-w-lg">
        {/* Logo + Heading */}
        <div className="text-center space-y-3 mb-6">
          <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-green-100">
            <Leaf className="h-6 w-6 text-green-700" />
          </div>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            Join Your Healing Journey
          </h2>
          <p className="text-sm text-gray-600">
            Experience holistic wellness with Ayurveda
          </p>
        </div>

        {/* Signup Card */}
        <Card className="shadow-sm border rounded-2xl">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-lg font-semibold">
              Create Account
            </CardTitle>
            <p className="text-gray-500 text-sm">
              Enter your information to create your account
            </p>
             {error && (
              <div className="mt-3 text-center">
                <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 inline-block">
                  {typeof error === "string" ? error : "Login failed. Please try again."}
                </p>
              </div>
            )}
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className={formErrors.name ? "border-red-500" : ""}
                />
                {formErrors.name && (
                  <p className="text-xs text-red-600 mt-1">
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                  className={formErrors.email ? "border-red-500" : ""}
                />
                {formErrors.email && (
                  <p className="text-xs text-red-600 mt-1">
                    {formErrors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a strong password"
                    className={formErrors.password ? "border-red-500" : ""}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-xs text-red-600 mt-1">
                    {formErrors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    className={
                      formErrors.confirmPassword ? "border-red-500" : ""
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((prev) => !prev)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">
                    {formErrors.confirmPassword}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="bg-green-700 hover:bg-green-800 text-white w-full"
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-6">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-green-700 font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
