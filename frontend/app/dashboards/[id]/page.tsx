import { getDashboardConfig } from '@/app/lib/actions';
import DashboardRenderer from '@/app/ui/dashboard/dashboard-renderer';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DashboardPage({ params }: PageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

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