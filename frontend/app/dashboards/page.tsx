'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useDebouncedCallback } from 'use-debounce';
import { DASHBOARD_PUBLIC_LIST_URL } from '@/lib/constants';
import Header from "@/components/header";
import Footer from "@/components/footer";

interface Dashboard {
    id: number;
    name: string;
    code: string;
    create_date: string;
}

export default function PublicDashboardsPage() {
    const [dashboards, setDashboards] = useState<Dashboard[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [total, setTotal] = useState(0);

    const fetchDashboards = useDebouncedCallback(async (searchTerm: string) => {
        setLoading(true);
        const url = new URL(DASHBOARD_PUBLIC_LIST_URL);
        if (searchTerm) url.searchParams.append('query', searchTerm);
        try {
            const res = await fetch(url);
            const data = await res.json();
            setDashboards(data.data);
            setTotal(data.total);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, 300);

    useEffect(() => {
        fetchDashboards(search);
    }, [search, fetchDashboards]);

    return (
    <>
    	<Header></Header>
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Public Dashboards</h1>

            {/* Search */}
            <div className="relative mb-8">
                <label htmlFor="search" className="sr-only">Search dashboards</label>
                <input
                    id="search"
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or code..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>

            {loading && <p className="text-gray-500">Loading...</p>}

            {!loading && dashboards.length === 0 && (
                <p className="text-gray-500">No published dashboards found.</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboards.map((dashboard) => (
                    <Link
                        key={dashboard.id}
                        href={`/dashboards/${dashboard.id}`}
                        className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden"
                    >
                        <div className="p-5">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                                {dashboard.name}
                            </h3>
                            {/*<p className="text-sm text-gray-500 mt-1">Code: {dashboard.code}</p>*/}
                            <p className="text-xs text-gray-400 mt-2">
                                Created: {new Date(dashboard.create_date).toLocaleDateString()}
                            </p>
			    <p className="text-xs text-gray-400 mt-2">
                                Updated: {new Date(dashboard.last_update_date).toLocaleDateString()}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>

            {total > dashboards.length && (
                <div className="mt-8 text-center">
                    <button
                        onClick={() => {
                            // Implement load more if needed
                        }}
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                        Load more
                    </button>
                </div>
            )}
        </div>
	{/*<Footer></Footer>*/}
	</>
    );
}
