"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Eye, EyeOff, Loader2, Zap, ArrowRight, Check } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const { register, isLoading } = useAuth();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const passwordChecks = {
        length: password.length >= 6,
        match: password === confirmPassword && confirmPassword.length > 0
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        const result = await register(email, password, firstName, lastName);
        if (result.success) {
            router.push("/");
        } else {
            setError(result.error || "Registration failed");
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-500 p-12 flex-col justify-between relative overflow-hidden">
                {/* Decorative gradient overlay */}
                <div className="absolute inset-0 bg-white/5" />

                {/* Logo */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <Zap className="size-7 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-white">P.I.S.</span>
                    </div>
                </div>

                {/* Main content */}
                <div className="relative z-10 space-y-6">
                    <h1 className="text-4xl font-bold text-white leading-tight">
                        Start Your<br />Journey Today
                    </h1>
                    <p className="text-lg text-white/80 max-w-md">
                        Join thousands of users who have transformed their productivity with energy-aware task management.
                    </p>

                    {/* Benefits */}
                    <div className="space-y-3 pt-4">
                        {["Track your cognitive energy levels", "Prioritize tasks intelligently", "Achieve more with less burnout"].map((benefit, i) => (
                            <div key={i} className="flex items-center gap-3 text-white/90">
                                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                                    <Check className="size-3 text-white" />
                                </div>
                                <span>{benefit}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 text-white/60 text-sm">
                    © 2026 P.I.S. All rights reserved.
                </div>
            </div>

            {/* Right Panel - Register Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
                            <Zap className="size-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-slate-800">P.I.S.</span>
                    </div>

                    <div className="space-y-2 mb-8">
                        <h2 className="text-3xl font-bold text-slate-900">Create account</h2>
                        <p className="text-slate-500">Get started with your free account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">
                                    First name
                                </label>
                                <input
                                    id="firstName"
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                    placeholder="John"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">
                                    Last name
                                </label>
                                <input
                                    id="lastName"
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                    placeholder="Doe"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                                Email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all pr-12"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                                Confirm password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {/* Password requirements */}
                        <div className="flex gap-4 text-xs">
                            <div className={`flex items-center gap-1.5 ${passwordChecks.length ? 'text-emerald-600' : 'text-slate-400'}`}>
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${passwordChecks.length ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                                    {passwordChecks.length && <Check className="size-2.5 text-white" />}
                                </div>
                                At least 6 characters
                            </div>
                            <div className={`flex items-center gap-1.5 ${passwordChecks.match ? 'text-emerald-600' : 'text-slate-400'}`}>
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${passwordChecks.match ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                                    {passwordChecks.match && <Check className="size-2.5 text-white" />}
                                </div>
                                Passwords match
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !passwordChecks.length || !passwordChecks.match}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-60 group shadow-lg shadow-emerald-200"
                        >
                            {isLoading ? (
                                <Loader2 className="size-5 animate-spin" />
                            ) : (
                                <>
                                    Create account
                                    <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-slate-500">
                        Already have an account?{" "}
                        <Link href="/login" className="text-emerald-600 hover:text-emerald-800 font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
