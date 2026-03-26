import LoginForm from "@/components/login-form";

 
export default function LoginPage() {
  return (
    <div className="home-bg">
      <div className="flex items-center justify-center md:h-screen">
        <div className="relative mx-auto flex w-full max-w-100 flex-col space-y-2.5 p-4 md:-mt-32">
          <div className="flex h-20 w-full items-end rounded-lg bg-violet-300 p-3 md:h-36">
            <div className="w-32 text-black md:w-36">
              Log In
            </div>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
