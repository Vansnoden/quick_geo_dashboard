'use client';

import { Dashboard } from '@/app/lib/definitions';
import Link from 'next/link';
import { createDashboard, updateDashboard } from '@/app/lib/actions';
import { Button } from '../buttons';

export default function DashboardForm({ dashboard }: { dashboard?: Dashboard }) {
  // Bind the ID if updating
  const updateDashboardWithId = updateDashboard.bind(null, dashboard?.id?.toString() || '');
  const action = dashboard ? updateDashboardWithId : createDashboard;

  return (
    <form action={action} className="rounded-md bg-gray-50 p-4 md:p-6">
      <div className="mb-4">
        <label htmlFor="name" className="mb-2 block text-sm font-medium">Dashboard Name</label>
        <input
          id="name"
          name="name"
          defaultValue={dashboard?.name}
          placeholder="Enter dashboard name"
          className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2"
          required
        />
      </div>

      <div className="mt-6 flex justify-end gap-4">
        <Link href="/admin/dashboards" className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 hover:bg-gray-200">
          Cancel
        </Link>
        <Button type="submit">{dashboard ? 'Update' : 'Create'} Dashboard</Button>
      </div>
    </form>
  );
}