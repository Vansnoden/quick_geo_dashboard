import { getUserDashboardData } from '@/app/lib/actions';
import { DashboardResponse } from '@/app/lib/definitions';
import Pagination from './pagination';
import {
        Table,
        TableBody,
        TableCell,
        TableContainer,
        TableHead,
        TableRow,
        Paper,
        Box,
} from '@mui/material';
import { CreateDashboard, UpdateDashboard, DeleteDashboard, ViewDashboard } from '../buttons';

export default async function DataTable({
        query,
        currentPage,
}: {
        query: string;
        currentPage: number;
}) {
        const dashboard_data_rows: DashboardResponse = await getUserDashboardData(query, currentPage);

        return (
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                        <Table sx={{ minWidth: 650 }} aria-label="dashboards table">
                                <TableHead>
                                        <TableRow>
                                                <TableCell>ID</TableCell>
                                                <TableCell>NAME</TableCell>
                                                <TableCell>CREATE DATE</TableCell>
                                                <TableCell>LAST UPDATE</TableCell>
                                                <TableCell align="right">Actions</TableCell>
                                        </TableRow>
                                </TableHead>
                                <TableBody>
                                        {dashboard_data_rows.data?.map((item) => (
                                                <TableRow key={item.id}>
                                                        <TableCell>{item.code}</TableCell>
                                                        <TableCell>{item.name}</TableCell>
                                                        <TableCell>{item.create_date}</TableCell>
                                                        <TableCell>{item.last_update_date}</TableCell>
                                                        <TableCell align="right">
                                                                <ViewDashboard id={item.id} />
                                                                <UpdateDashboard id={item.id} />
                                                                <DeleteDashboard id={item.id} />
                                                        </TableCell>
                                                </TableRow>
                                        ))}
                                </TableBody>
                        </Table>
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                <Pagination totalPages={dashboard_data_rows.total_pages} />
                        </Box>
                </TableContainer>
        );
}
