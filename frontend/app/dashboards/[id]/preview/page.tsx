import { fetchDashboardById } from '@/lib/actions';
import { getDashboardConfig } from '@/lib/actions';
import DashboardRenderer from '@/components/dashboard-renderer';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DashboardPreviewPage({ params }: PageProps) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);

  // Fetch the dashboard using the authenticated endpoint – this will 404 if the user
  // does not own the dashboard or is not logged in.
  const dashboard = await fetchDashboardById(id);
  if (!dashboard) {
    notFound();
  }

  // Fetch the public configuration (which is the same as the one used for the live view)
  const config = await getDashboardConfig(String(id)).catch(() => null);
  if (!config) {
    notFound();
  }

  return (
    <div className="h-screen w-full bg-white">
      <DashboardRenderer
        config={config}
        dashboardId={String(id)}
      />
    </div>
  );
}
