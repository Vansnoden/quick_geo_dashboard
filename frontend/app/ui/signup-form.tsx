"use client";

import {
  AtSymbolIcon,
  KeyIcon,
  UserIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { useActionState, useEffect, useState, useRef } from 'react';
import { signup } from '@/app/lib/actions';
import { Button } from './buttons';
import Link from 'next/link';

export default function SignupForm() {
  const [errorMessage, formAction, isPending] = useActionState(
    signup,
    undefined,
  );
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [password, setPassword] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  // Password strength monitoring
  useEffect(() => {
    if (typeof window !== 'undefined' && password) {
      // Dynamic import for zxcvbn to avoid server-side rendering issues
      import('zxcvbn').then((zxcvbnModule) => {
        const zxcvbn = zxcvbnModule.default;
        const result = zxcvbn(password);
        setPasswordStrength(result.score);
      });
    } else {
      setPasswordStrength(0);
    }
  }, [password]);

  return (
    <div>
        <form 
          ref={formRef}
          action={formAction} 
          className="mt-8 space-y-6"
        >
          <div className="space-y-4 rounded-lg bg-white px-6 py-8 shadow-md">
            {/* Full Name Field */}
            <div>
              <label
                className="mb-2 block text-sm font-medium text-gray-700"
                htmlFor="fullname"
              >
                Full Name
              </label>
              <div className="relative">
                <input
                  className="peer block w-full rounded-md border border-gray-300 py-2.5 pl-10 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  id="fullname"
                  type="text"
                  name="fullname"
                  placeholder="John Doe"
                  required
                  disabled={isPending}
                />
                <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 peer-focus:text-purple-500" />
              </div>
            </div>

            {/* Username Field */}
            <div>
              <label
                className="mb-2 block text-sm font-medium text-gray-700"
                htmlFor="username"
              >
                Username
              </label>
              <div className="relative">
                <input
                  className="peer block w-full rounded-md border border-gray-300 py-2.5 pl-10 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  id="username"
                  type="text"
                  name="username"
                  placeholder="johndoe"
                  required
                  disabled={isPending}
                />
                <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 peer-focus:text-purple-500" />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Must be unique, at least 3 characters
              </p>
            </div>

            {/* Email Field */}
            <div>
              <label
                className="mb-2 block text-sm font-medium text-gray-700"
                htmlFor="email"
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  className="peer block w-full rounded-md border border-gray-300 py-2.5 pl-10 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  id="email"
                  type="email"
                  name="email"
                  placeholder="john@example.com"
                  required
                  disabled={isPending}
                />
                <EnvelopeIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 peer-focus:text-purple-500" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                className="mb-2 block text-sm font-medium text-gray-700"
                htmlFor="password"
              >
                Password
              </label>
              <div className="relative">
                <input
                  className="peer block w-full rounded-md border border-gray-300 py-2.5 pl-10 text-sm text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  id="password"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  minLength={4}
                  disabled={isPending}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 peer-focus:text-purple-500" />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 4 characters
              </p>
            </div>

            {/* Password Strength Indicator */}
            {password.length >= 4 && (
              <div className="mt-2">
                <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      passwordStrength === 1 ? 'w-1/4 bg-red-500' :
                      passwordStrength === 2 ? 'w-2/4 bg-yellow-500' :
                      passwordStrength === 3 ? 'w-3/4 bg-blue-500' :
                      passwordStrength === 4 ? 'w-full bg-green-500' : ''
                    }`}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {passwordStrength === 1 && 'Weak password'}
                  {passwordStrength === 2 && 'Fair password'}
                  {passwordStrength === 3 && 'Good password'}
                  {passwordStrength === 4 && 'Strong password'}
                </p>
              </div>
            )}

            {/* Error/Success Message */}
            <div className="flex min-h-10 items-end space-x-2">
              {errorMessage && (
                <div className="flex w-full items-center space-x-2 rounded-md bg-red-50 p-3 text-sm">
                  <ExclamationCircleIcon className="h-5 w-5 shrink-0 text-red-500" />
                  <p className="text-red-600">{errorMessage}</p>
                </div>
              )}
              {!errorMessage && isPending && (
                <div className="flex w-full items-center space-x-2 rounded-md bg-blue-50 p-3 text-sm">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  <p className="text-blue-600">Creating your account...</p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              className="w-full" 
              aria-disabled={isPending}
              disabled={isPending}
            >
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
          </div>
        </form>
    </div>
  );
}