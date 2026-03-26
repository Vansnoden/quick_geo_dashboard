import { fetchDashboardById } from '@/lib/actions';
import DashboardHeader from '@/components/dashboard-breadcrumb';
import DashBoardDetails from '@/components/dashboard-details';
import { notFound } from 'next/navigation';


export default async function Page({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  
  const dashboard = await fetchDashboardById(Number(id));

  if (!dashboard) {
    notFound();
  }

  return (
    <main className="p-4">
      <DashboardHeader code={dashboard.name} />
      <DashBoardDetails dashboard={dashboard}/>
    </main>
  );
}
