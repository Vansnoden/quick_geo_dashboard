'use client';

import { Dashboard } from '@/app/lib/definitions';
import Link from 'next/link';
import { createDashboard, updateDashboard } from '@/app/lib/actions';
import { Button } from '../buttons';
import { useState } from 'react';
import { 
  DocumentTextIcon, 
  XMarkIcon, 
  CheckCircleIcon,
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export default function DashboardFormCreate({ 
  dashboard, 
  onClose 
}: { 
  dashboard?: Dashboard;
  onClose?: () => void; 
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(dashboard?.name || '');
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const isValid = name.trim().length >= 3;
  const showError = touched && !isValid;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!isValid) {
      setTouched(true);
      setError('Dashboard name must be at least 3 characters');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      // Create a new FormData object
      const formData = new FormData();
      formData.append('name', name.trim());

      let result = null;
      
      if (dashboard?.id) {
        // Update existing dashboard
        result = await updateDashboard(Number(dashboard.id), formData);
      } else {
        // Create new dashboard
        result = await createDashboard(formData);
      }
      
      // If we get a result object with errors/message, it's a validation error
      if (result && typeof result === 'object') {
        if ('errors' in result && result.errors) {
          const errorMsg = Object.values(result.errors).flat().join(', ');
          setError(errorMsg || 'Validation failed');
          setIsSubmitting(false);
          return;
        }
        
        if ('message' in result && result.message) {
          setError(result.message as string);
          setIsSubmitting(false);
          return;
        }
      }
      
      // Success - the actions will redirect, so we don't need to do anything here
      // But in case they don't (e.g., in modal context), we handle it
      router.refresh();
      
      if (onClose) {
        onClose();
      } else {
        router.push('/admin/dashboards');
      }
      
    } catch (err) {
      // Check if this is a redirect (success case in Next.js)
      // Next.js redirects throw errors with a digest property
      if (err && typeof err === 'object' && 'digest' in err) {
        // This is a redirect - success!
        if (onClose) {
          onClose();
        }
        return;
      }
      
      // Real error
      console.error('Form submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save dashboard');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-linear-to-r from-purple-600 to-violet-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5" />
            {dashboard ? 'Edit Dashboard' : 'Create New Dashboard'}
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Close"
              disabled={isSubmitting}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Form - changed from action to onSubmit */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label 
              htmlFor="name" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Dashboard Name <span className="text-red-500">*</span>
            </label>
            
            <div className="relative">
              <input
                id="name"
                name="name" 
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setTouched(true);
                  setError(null);
                }}
                onBlur={() => setTouched(true)}
                placeholder="e.g., Malaria Surveillance Dashboard"
                className={`
                  block w-full rounded-lg border py-3 px-4 
                  text-gray-900 placeholder:text-gray-400
                  focus:outline-none focus:ring-2 focus:ring-purple-500
                  transition-all duration-200
                  ${showError 
                    ? 'border-red-300 bg-red-50 focus:ring-red-500' 
                    : isValid && touched
                    ? 'border-green-300 bg-green-50 focus:ring-green-500'
                    : 'border-gray-300 hover:border-gray-400'
                  }
                `}
                required
                disabled={isSubmitting}
                maxLength={100}
              />
              
              {touched && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isValid ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
                  )}
                </div>
              )}
            </div>

            {showError && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <ExclamationCircleIcon className="w-4 h-4" />
                Name must be at least 3 characters
              </p>
            )}

            <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
              <span>Min. 3 characters</span>
              <span className={name.length > 90 ? 'text-yellow-600 font-medium' : ''}>
                {name.length}/100
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <ExclamationCircleIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
            ) : (
              <Link
                href="/admin/dashboards"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </Link>
            )}
            
            <Button 
              type="submit" 
              disabled={!isValid || isSubmitting}
              className="min-w-30"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                <span>{dashboard ? 'Update' : 'Create'} Dashboard</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}