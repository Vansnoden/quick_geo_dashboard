import SignupForm from "@/app/ui/signup-form";
import Link from "next/link";
import { lusitana } from "@/app/ui/fonts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
        return (
                <div className="home-bg">
                        <div className="flex items-center justify-center md:h-screen">
                                <Card className="w-full max-w-md mx-auto">
                                        <CardHeader className="bg-violet-300 rounded-t-lg">
                                                <CardTitle className="text-black text-2xl text-center">
                                                        Create your account
                                                </CardTitle>
                                                <p className="mt-2 text-center text-sm text-black">
                                                        Or{' '}
                                                        <Link href="/login" className="font-medium text-violet-500 hover:text-white">
                                                                sign in to existing account
                                                        </Link>
                                                </p>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                                <SignupForm />
                                        </CardContent>
                                </Card>
                        </div>
                </div>
        );
}
