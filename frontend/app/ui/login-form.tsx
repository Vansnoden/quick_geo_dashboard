"use client";
import { lusitana } from "@/app/ui/fonts";
import { ArrowRightIcon } from "@heroicons/react/20/solid";
import { useActionState } from "react";
import { authenticate } from "@/app/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

export default function LoginForm() {
        const [errorMessage, formAction, isPending] = useActionState(
                authenticate,
                undefined,
        );

        return (
                <form action={formAction} className="space-y-4">
                        <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                        id="username"
                                        name="username"
                                        type="text"
                                        placeholder="Enter your username"
                                        required
                                />
                        </div>
                        <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="Enter password"
                                        required
                                        minLength={4}
                                />
                        </div>
                        {errorMessage && (
                                <Alert variant="destructive">
                                        <AlertDescription>{errorMessage}</AlertDescription>
                                </Alert>
                        )}
                        <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending ? "Logging in..." : "Log in"}
                                <ArrowRightIcon className="ml-2 h-5 w-5" />
                        </Button>
                        <div className="text-center text-sm text-gray-600">
                                Don't have an account?{' '}
                                <Link href="/signup" className="font-medium text-purple-600 hover:text-purple-500">
                                        Sign up here
                                </Link>
                        </div>
                </form>
        );
}
