
import { getUserDashboardData } from '@/app/lib/actions';
import { Dashboard, DashboardResponse } from '@/app/lib/definitions';
import Pagination from './pagination';
import { lusitana } from '../fonts';
import { CreateDashboard, UpdateDashboard, DeleteDashboard, ViewDashboard } from '../buttons';

// DataTable.use(DT);

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
          <table className="hidden min-w-full text-gray-900 md:table table-auto">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6 ">
                  ID
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  NAME
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  CREATE DATE
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  LAST UPDATE
                </th>
                {/* 2. Actions Column Header */}
                <th scope="col" className="relative py-3 pl-6 pr-3">
                  <span className="sr-only">Actions</span>
                </th>
                {/* <th scope="col" className="px-3 py-5 font-medium">
                  Scientific Name
                </th> */}
                {/* <th scope="col" className="px-3 py-5 font-medium">
                  Taxon
                </th> */}
                {/* <th scope="col" className="px-3 py-5 font-medium">
                  Kingdom
                </th> */}
              </tr>
            </thead>
            <tbody className="bg-white">
              {dashboard_data_rows.data?.map((item_data) => (
                <tr
                  key={item_data.id}
                  className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                >
                    <td className="px-3 py-3 break-all">
                        {item_data.code}
                    </td>
                    <td className="px-3 py-3 break-all">
                        {item_data.name}
                    </td>
                    <td className="px-3 py-3 break-all">
                        {item_data.create_date}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 break-all">
                        {item_data.last_update_date}
                    </td>
                    {/* 3. Actions Column Body */}
                    <td className="whitespace-nowrap py-3 pl-6 pr-3">
                      <div className="flex justify-end gap-3">
                        <ViewDashboard id={item_data.id} />
                        <UpdateDashboard id={item_data.id} />
                        <DeleteDashboard id={item_data.id} />
                      </div>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 flex w-full justify-center">
          <Pagination totalPages={dashboard_data_rows.total_pages} />
        </div>
      </div>
    </div>
  );
}