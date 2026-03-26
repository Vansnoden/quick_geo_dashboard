'use client';

import { useState } from 'react';
import { DASHBOARD_EXPORT_URL } from '@/lib/constants';
import { FilterCondition } from '@/lib/definitions';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';

interface Props {
    dashboardId: string;
    filters: FilterCondition[];
    disabled?: boolean;
}

export default function DownloadButton({ dashboardId, filters, disabled }: Props) {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const response = await fetch(DASHBOARD_EXPORT_URL(Number(dashboardId)), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filters })
            });
            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dashboard_${dashboardId}_data.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (err) {
            console.error('Download error:', err);
            alert('Failed to download data');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <button
            onClick={handleDownload}
            disabled={disabled || isDownloading}
            className="w-full mt-4 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
            {isDownloading ? (
                <svg className="animate-spin h-4 w-4" />
            ) : (
                <DocumentArrowDownIcon className="w-4 h-4" />
            )}
            Download Data
        </button>
    );
}
