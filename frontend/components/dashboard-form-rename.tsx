'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { renameDashboard } from '@/lib/actions';
import { XMarkIcon, PencilIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/buttons';

interface Props {
    dashboardId: number;
    currentName: string;
    onClose: () => void;
}

export default function RenameDashboardModal({ dashboardId, currentName, onClose }: Props) {
    const [name, setName] = useState(currentName);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [touched, setTouched] = useState(false);
    const router = useRouter();

    const isValid = name.trim().length >= 3 && name.trim() !== currentName;
    const showNameUnchanged = touched && name.trim() === currentName && name !== '';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;

        setIsSubmitting(true);
        setError(null);

        try {
            await renameDashboard(dashboardId, name.trim());
            router.refresh();
            onClose();
        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : 'Failed to rename dashboard';
            setError(message);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-linear-to-r from-purple-600 to-violet-600 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <PencilIcon className="w-5 h-5" />
                        Rename Dashboard
                    </h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-6">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                            Dashboard Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="name"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setTouched(true);
                            }}
                            onBlur={() => setTouched(true)}
                            className="block w-full rounded-lg border border-gray-300 py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required
                            disabled={isSubmitting}
                        />
                        {touched && name.trim().length < 3 && name !== '' && (
                            <p className="mt-2 text-sm text-red-600">Name must be at least 3 characters</p>
                        )}
                        {showNameUnchanged && (
                            <p className="mt-2 text-sm text-yellow-600">Name unchanged</p>
                        )}
                    </div>
                    {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <Button type="submit" disabled={!isValid || isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
