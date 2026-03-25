import { fetchDashboardById } from '@/app/lib/actions';
import DashboardHeader from '@/app/ui/admin/dashboard-breadcrumb';
import DashBoardDetails from '@/app/ui/admin/dashboard-details';
import { notFound } from 'next/navigation';
import { Box } from '@mui/material';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
        const { id } = await params;
        const dashboard = await fetchDashboardById(Number(id));

        if (!dashboard) notFound();

        return (
                <Box sx={{ p: 2 }}>
                        <DashBoardDetails dashboard={dashboard} />
                </Box>
        );
}
