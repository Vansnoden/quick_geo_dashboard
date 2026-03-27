import { getDashboardConfig } from '@/lib/actions';
import DashboardRenderer from '@/components/dashboard-renderer';
import { notFound } from 'next/navigation';
import { getPublicDashboardById } from '@/lib/actions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DashboardPage({ params }: PageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const dashboard = await getPublicDashboardById(id);

  if (!dashboard || !dashboard.is_published) notFound();

  const config = await getDashboardConfig(id).catch(() => null);

  if (!config) {
    notFound();
  }

  return (
    <div className="h-screen w-full bg-white">
      <DashboardRenderer 
        config={config} 
        dashboardId={id} 
      />
    </div>
  );
}
