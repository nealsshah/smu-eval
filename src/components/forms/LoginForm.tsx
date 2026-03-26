"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@/lib/validations/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { event } from "@/lib/analytics/gtag";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      event("login_success", { method: "credentials" });

      // Fetch session to determine role redirect
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      const role = session?.user?.role;

      if (role === "student") router.push("/student/dashboard");
      else if (role === "professor") router.push("/professor/dashboard");
      else if (role === "admin") router.push("/admin/dashboard");
      else router.push("/");
    } catch {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-lg shadow-md border border-smu-border p-8">
        {/* Avatar */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-smu-navy flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <h2 className="text-xl font-bold text-center text-smu-text mb-1">
          Student Login
        </h2>
        <div className="w-full h-px bg-smu-border my-4" />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-smu-text mb-1.5">
              Email
            </label>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-smu-gold rounded-l" />
              <Input
                type="email"
                placeholder="Enter your email"
                className="pl-4 border-smu-border"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-smu-text mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-smu-gold rounded-l" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="pl-4 pr-10 border-smu-border"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-smu-text"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-smu-gold hover:bg-smu-gold-hover text-white font-semibold py-5 text-base"
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <p className="text-center mt-4">
          <a href="#" className="text-sm text-smu-navy hover:underline">
            Forgot Password?
          </a>
        </p>
      </div>
    </div>
  );
}
