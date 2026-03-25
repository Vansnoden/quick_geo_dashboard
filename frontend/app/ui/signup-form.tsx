"use client";

import { useActionState, useEffect, useState } from "react";
import { signup } from "@/app/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowRightIcon } from "@heroicons/react/20/solid";

export default function SignupForm() {
        const [errorMessage, formAction, isPending] = useActionState(
                signup,
                undefined,
        );
        const [passwordStrength, setPasswordStrength] = useState(0);
        const [password, setPassword] = useState("");

        // Password strength monitoring
        useEffect(() => {
                if (typeof window !== "undefined" && password) {
                        import("zxcvbn").then((zxcvbnModule) => {
                                const zxcvbn = zxcvbnModule.default;
                                const result = zxcvbn(password);
                                setPasswordStrength(result.score);
                        });
                } else {
                        setPasswordStrength(0);
                }
        }, [password]);

        return (
                <form action={formAction} className="space-y-4">
                        <div className="space-y-2">
                                <Label htmlFor="fullname">Full Name</Label>
                                <Input
                                        id="fullname"
                                        name="fullname"
                                        type="text"
                                        placeholder="John Doe"
                                        required
                                        disabled={isPending}
                                />
                        </div>

                        <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                        id="username"
                                        name="username"
                                        type="text"
                                        placeholder="johndoe"
                                        required
                                        disabled={isPending}
                                />
                                <p className="text-xs text-gray-500">Must be unique, at least 3 characters</p>
                        </div>

                        <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="john@example.com"
                                        required
                                        disabled={isPending}
                                />
                        </div>

                        <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        minLength={4}
                                        disabled={isPending}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                />
                                <p className="text-xs text-gray-500">Must be at least 4 characters</p>
                        </div>

                        {password.length >= 4 && (
                                <div className="mt-2">
                                        <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-200">
                                                <div
                                                        className={`h-full transition-all duration-300 ${
                                                                passwordStrength === 1
                                                                        ? "w-1/4 bg-red-500"
                                                                        : passwordStrength === 2
                                                                        ? "w-2/4 bg-yellow-500"
                                                                        : passwordStrength === 3
                                                                        ? "w-3/4 bg-blue-500"
                                                                        : passwordStrength === 4
                                                                        ? "w-full bg-green-500"
                                                                        : ""
                                                        }`}
                                                />
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">
                                                {passwordStrength === 1 && "Weak password"}
                                                {passwordStrength === 2 && "Fair password"}
                                                {passwordStrength === 3 && "Good password"}
                                                {passwordStrength === 4 && "Strong password"}
                                        </p>
                                </div>
                        )}

                        {errorMessage && (
                                <Alert variant="destructive">
                                        <AlertDescription>{errorMessage}</AlertDescription>
                                </Alert>
                        )}

                        <Button className="w-full" disabled={isPending}>
                                {isPending ? (
                                        <span className="flex items-center justify-center">
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                Creating Account...
                                        </span>
                                ) : (
                                        <span className="flex items-center justify-center">
                                                Sign up <ArrowRightIcon className="ml-2 h-5 w-5" />
                                        </span>
                                )}
                        </Button>
                </form>
        );
}
