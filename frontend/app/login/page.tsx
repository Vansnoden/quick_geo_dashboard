import LoginForm from "@/app/ui/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
        return (
                <div className="home-bg">
                        <div className="flex items-center justify-center md:h-screen">
                                <Card className="w-full max-w-md mx-auto">
                                        <CardHeader className="bg-violet-300 rounded-t-lg">
                                                <CardTitle className="text-black text-2xl text-center">
                                                        Log In
                                                </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                                <LoginForm />
                                        </CardContent>
                                </Card>
                        </div>
                </div>
        );
}
