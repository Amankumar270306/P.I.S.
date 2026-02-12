"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { updateUser, UserUpdateDTO, UserProfile } from "@/lib/api";
import { User, Phone, Briefcase, Calendar, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
    const { user, setUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        age: "",
        profession: ""
    });

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                phone: user.phone || "",
                age: user.age?.toString() || "",
                profession: user.profession || ""
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsLoading(true);
        setMessage(null);

        try {
            const updateData: UserUpdateDTO = {
                first_name: formData.firstName || undefined,
                last_name: formData.lastName || undefined,
                phone: formData.phone || undefined,
                age: formData.age ? parseInt(formData.age) : undefined,
                profession: formData.profession || undefined
            };

            const updatedUser = await updateUser(user.id, updateData);

            // Update local auth context
            setUser({
                ...user,
                firstName: updatedUser.first_name,
                lastName: updatedUser.last_name,
                phone: updatedUser.phone,
                age: updatedUser.age,
                profession: updatedUser.profession
            });

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.detail || 'Failed to update profile'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-4 transition-colors"
                >
                    <ArrowLeft className="size-4" />
                    <span className="text-sm">Back to Dashboard</span>
                </Link>
                <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
                <p className="text-slate-500 text-sm mt-1">Manage your account and profile</p>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* User Avatar Header */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8">
                    <div className="flex items-center gap-4">
                        <div className="size-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                            <span className="text-3xl font-bold text-white">
                                {user?.firstName?.charAt(0).toUpperCase() || "U"}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">{user?.firstName} {user?.lastName}</h2>
                            <p className="text-white/80 text-sm">{user?.email}</p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Message */}
                    {message && (
                        <div className={`p-4 rounded-lg text-sm ${message.type === 'success'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    {/* First Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            <User className="inline size-4 mr-2" />
                            First Name
                        </label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            placeholder="Your first name"
                        />
                    </div>

                    {/* Last Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            <User className="inline size-4 mr-2" />
                            Last Name
                        </label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            placeholder="Your last name"
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            <Phone className="inline size-4 mr-2" />
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            placeholder="+91 1234567890"
                        />
                    </div>

                    {/* Age */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            <Calendar className="inline size-4 mr-2" />
                            Age
                        </label>
                        <input
                            type="number"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            min="1"
                            max="120"
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            placeholder="Your age"
                        />
                    </div>

                    {/* Profession */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            <Briefcase className="inline size-4 mr-2" />
                            Profession
                        </label>
                        <input
                            type="text"
                            name="profession"
                            value={formData.profession}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            placeholder="e.g. Software Engineer, Student, Designer"
                        />
                    </div>

                    {/* Email (Read-only) */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            Email (cannot be changed)
                        </label>
                        <input
                            type="email"
                            value={user?.email || ""}
                            disabled
                            className="w-full px-4 py-3 rounded-lg border border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save className="size-4" />
                                Save Changes
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
