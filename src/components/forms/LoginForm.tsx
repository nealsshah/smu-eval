"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@/lib/validations/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
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
        setError("Incorrect email or password. Check your credentials and try again.");
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
      setError("Something went wrong. Please try again in a moment.");
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-2xl shadow-black/20 p-8 border border-white/10">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <div role="alert" className="bg-red-50 text-red-700 text-sm px-3 py-2.5 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-smu-text mb-1.5">
            Email
          </label>
          <Input
            type="email"
            placeholder="you@smu.edu.sg"
            className="h-11 bg-smu-surface/50 border-smu-border focus:border-smu-gold focus:ring-smu-gold/20"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-smu-text mb-1.5">
            Password
          </label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="h-11 bg-smu-surface/50 border-smu-border pr-10 focus:border-smu-gold focus:ring-smu-gold/20"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-smu-text transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-smu-gold hover:bg-smu-gold-hover text-white font-semibold text-sm tracking-wide transition-all duration-200 hover:shadow-lg hover:shadow-smu-gold/20"
        >
          {loading ? (
            "Logging in..."
          ) : (
            <span className="flex items-center gap-2">
              Log in
              <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </Button>
      </form>

      <p className="text-center mt-5">
        <a href="#" className="text-xs text-muted-foreground hover:text-smu-navy transition-colors">
          Forgot your password?
        </a>
      </p>
    </div>
  );
}
