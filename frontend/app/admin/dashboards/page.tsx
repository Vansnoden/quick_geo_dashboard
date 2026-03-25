import Search from "@/app/ui/admin/search";
import DataTable from "@/app/ui/admin/table";
import { Suspense } from "react";
import CreateDashboardTrigger from "@/app/ui/admin/dashboard-create-trigger";
import { Box, Typography, Paper } from '@mui/material';

export default async function DashboardsPage(props: {
        searchParams?: Promise<{ query?: string; page?: string }>;
}) {
        const searchParams = await props.searchParams;
        const query = searchParams?.query || '';
        const currentPage = Number(searchParams?.page) || 1;

        return (
                <Box>
                        <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'white' }}>
                                <Typography variant="h6">My Dashboards</Typography>
                                <CreateDashboardTrigger />
                        </Paper>
                        <Search placeholder="Search ..." />
                        <Suspense key={query + currentPage} fallback={<Typography>Loading...</Typography>}>
                                <DataTable query={query} currentPage={currentPage} />
                        </Suspense>
                </Box>
        );
}
