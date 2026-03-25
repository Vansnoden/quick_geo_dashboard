import { getUserDashboardData } from "@/app/lib/actions";
import { DashboardResponse } from "@/app/lib/definitions";
import Pagination from "./pagination";
import { lusitana } from "../fonts";
import { CreateDashboard, UpdateDashboard, DeleteDashboard, ViewDashboard } from "../buttons";
import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
} from "@/components/ui/table";

export default async function DataTable({
        query,
        currentPage,
}: {
        query: string;
        currentPage: number;
}) {
        const dashboard_data_rows: DashboardResponse = await getUserDashboardData(query, currentPage);

        return (
                <div className={`${lusitana.className} mt-6 flow-root`}>
                        <div className="inline-block min-w-full align-middle">
                                <div className="rounded-lg bg-gray-50 p-2 md:pt-0 table-container">
                                        <Table>
                                                <TableHeader>
                                                        <TableRow>
                                                                <TableHead className="px-4 py-5 font-medium sm:pl-6">ID</TableHead>
                                                                <TableHead className="px-3 py-5 font-medium">NAME</TableHead>
                                                                <TableHead className="px-3 py-5 font-medium">CREATE DATE</TableHead>
                                                                <TableHead className="px-3 py-5 font-medium">LAST UPDATE</TableHead>
                                                                <TableHead className="relative py-3 pl-6 pr-3">
                                                                        <span className="sr-only">Actions</span>
                                                                </TableHead>
                                                        </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                        {dashboard_data_rows.data?.map((item_data) => (
                                                                <TableRow key={item_data.id}>
                                                                        <TableCell className="px-3 py-3 break-all">{item_data.code}</TableCell>
                                                                        <TableCell className="px-3 py-3 break-all">{item_data.name}</TableCell>
                                                                        <TableCell className="px-3 py-3 break-all">{item_data.create_date}</TableCell>
                                                                        <TableCell className="whitespace-nowrap px-3 py-3 break-all">
                                                                                {item_data.last_update_date}
                                                                        </TableCell>
                                                                        <TableCell className="whitespace-nowrap py-3 pl-6 pr-3">
                                                                                <div className="flex justify-end gap-3">
                                                                                        <ViewDashboard id={item_data.id} />
                                                                                        <UpdateDashboard id={item_data.id} />
                                                                                        <DeleteDashboard id={item_data.id} />
                                                                                </div>
                                                                        </TableCell>
                                                                </TableRow>
                                                        ))}
                                                </TableBody>
                                        </Table>
                                </div>
                                <div className="mt-5 flex w-full justify-center">
                                        <Pagination totalPages={dashboard_data_rows.total_pages} />
                                </div>
                        </div>
                </div>
        );
}
