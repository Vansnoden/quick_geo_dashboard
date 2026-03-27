'use client';

import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { AddDataButton } from '@/components/dashboard-form-upload-data';
import { DASHBOARD_PUBLISH_URL, DASHBOARD_GET_URL } from '@/lib/constants';
import { Dashboard } from '@/lib/definitions';
import { useState } from 'react';
import { getAuthToken } from '@/lib/client_actions';




export default function DashboardHeader({ dashboard }: { dashboard: Dashboard }) {
    
    const [isPublished, setIsPublished] = useState(dashboard.is_published);
    const [isPublishing, setIsPublishing] = useState(false);

    const handleTogglePublish = async () => {
        setIsPublishing(true);
        try {
            const token = getAuthToken();
            const response = await fetch(DASHBOARD_PUBLISH_URL(dashboard.id), {
                method: 'PATCH',
                headers: {
                    Authorization: token || '',
                },
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to update publish status');
            }
            const data = await response.json();
            setIsPublished(data.is_published);
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : 'Failed to update publish status');
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <div className="mb-6">
            <nav className="flex text-sm text-gray-500 mb-2">
                <Link href="/admin/dashboards" className="hover:text-violet-600">Dashboards</Link>
                <span className="mx-2">/</span>
                <span className="text-gray-900 font-medium">{dashboard.name}</span>
            </nav>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/dashboards">
                        <ArrowLeftIcon className="w-6 h-6 text-gray-600 hover:text-violet-600" />
                    </Link>
                    <h1 className="text-2xl font-bold">Dashboard: {dashboard.name}</h1>
                </div>
                <div className="flex gap-2">
                    <AddDataButton dashboardId={dashboard.id} />
		    <button type="submit" form="yaml-form" className="px-4 py-2 bg-violet-600 text-white rounded-md 
                        text-sm font-medium hover:bg-violet-500">
                        Save Config
                    </button>
		    <Link href={`/dashboards/${dashboard.id}/preview`} target="_blank" 
		        className="px-4 py-2 bg-violet-600 text-white rounded-md text-sm font-medium hover:bg-violet-500">
                        Preview Dashboard
                    </Link>
		   {/* Publish toggle button */}
                    <button
                        onClick={handleTogglePublish}
                        disabled={isPublishing}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            isPublished
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {isPublishing ? (
                            <span className="flex items-center gap-1">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                ...
                            </span>
                        ) : (
                            isPublished ? 'Published' : 'Unpublished'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
