import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function DashboardHeader({ code }: { code: string }) {
  return (
    <div className="mb-6">
      <nav className="flex text-sm text-gray-500 mb-2">
        <Link href="/admin/dashboards" className="hover:text-violet-600">Dashboards</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{code}</span>
      </nav>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboards">
            <ArrowLeftIcon className="w-6 h-6 text-gray-600 hover:text-violet-600" />
          </Link>
          <h1 className="text-2xl font-bold">Dashboard: {code}</h1>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-gray-100 rounded-md text-sm font-medium hover:bg-gray-200">Add Data</button>
          <button type="submit" form="yaml-form" className="px-4 py-2 bg-violet-600 text-white rounded-md text-sm font-medium hover:bg-violet-500">
            Save Config
          </button>
        </div>
      </div>
    </div>
  );
}