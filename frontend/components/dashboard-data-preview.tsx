'use client';

import { useEffect, useState } from 'react';
import { DASHBOARD_DATA_INFO_URL } from '@/lib/constants';

interface ColumnInfo {
    name: string;
    type: string;
}

interface DataInfo {
    total_rows: number;
    columns: ColumnInfo[];
    sample: Record<string, any>[];
    table_name: string;
}

function getAuthToken(): string | null {
    const match = document.cookie.match(/(^| )auth-token=([^;]+)/);
    if (match) {
        return match[2].replace(/__/g, ' ');
    }
    return null;
}

export default function DataPreview({ dashboardId }: { dashboardId: number }) {
    const [data, setData] = useState<DataInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = getAuthToken();
        const headers: HeadersInit = token ? { Authorization: token } : {};

        fetch(DASHBOARD_DATA_INFO_URL(dashboardId), { headers })
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch data info');
                return res.json();
            })
            .then(setData)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [dashboardId]);

    if (loading) return <div className="animate-pulse bg-gray-100 h-40 rounded" />;
    if (error) return <div className="text-red-500">Error: {error}</div>;
    if (!data) return <div className="text-gray-500">No data available</div>;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <h3 className="text-sm font-medium text-gray-500">Total Records</h3>
                    <p className="text-2xl font-bold text-gray-900">{data.total_rows.toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <h3 className="text-sm font-medium text-gray-500">Table Name</h3>
                    <p className="text-sm font-mono text-gray-700 break-all">{data.table_name}</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b">
                    <h3 className="font-medium text-gray-700">Columns ({data.columns.length})</h3>
                </div>
                <div className="p-4 max-h-64 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2">
                        {data.columns.map(col => (
                            <div key={col.name} className="flex justify-between text-sm">
                                <span className="font-mono text-gray-700">{col.name}</span>
                                <span className="text-gray-500">{col.type}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {data.sample && data.sample.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b">
                        <h3 className="font-medium text-gray-700">Sample Rows (first {data.sample.length})</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {data.sample.length > 0 && Object.keys(data.sample[0]).map(key => (
                                        <th key={key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {key}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.sample.map((row, idx) => (
                                    <tr key={idx}>
                                        {Object.values(row).map((val, i) => (
                                            <td key={i} className="px-4 py-2 text-sm text-gray-700">
                                                {String(val).length > 50 ? `${String(val).substring(0, 50)}...` : String(val)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
