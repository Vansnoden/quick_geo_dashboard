import SignupForm from '@/components/signup-form';
import Link from 'next/link';
import { lusitana } from '@/components/fonts';

export default function SignupPage() {
    return (
        <div className="home-bg">
            <div className="flex items-center justify-center md:h-screen">
                <div className="relative mx-auto flex w-full max-w-100 flex-col space-y-2.5 p-4 md:-mt-32">
                    <div className="flex h-20 w-full items-end rounded-lg bg-violet-300 p-3 md:h-36">
                        <div className="text-black w-full max-w-md">
                            <h2 className={`${lusitana.className} text-center text-3xl font-bold tracking-tight text-gray-900`}>
                                Create your account
                            </h2>
                            <p className="mt-2 text-center text-sm text-black">
                                Or{' '}
                                <Link href="/login" className="font-medium text-violet-500 hover:text-white">
                                sign in to existing account
                                </Link>
                            </p>
                        </div>
                    </div>
                    <SignupForm />
                </div>
            </div>
        </div>
    )
}
