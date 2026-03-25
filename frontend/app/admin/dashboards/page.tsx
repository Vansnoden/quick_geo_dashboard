
import Search from "@/app/ui/admin/search";
import DataTable from "@/app/ui/admin/table";
import { Suspense } from "react";
import CreateDashboardTrigger from "@/app/ui/admin/dashboard-create-trigger";

 
export default async function DashboardsPage(props: {
    searchParams?: Promise<{
      query?: string;
      page?: string;
    }>;
  }) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;

  return (
    <div className="admin-bg">
      <div className="bg-violet-600 text-white py-3 px-2 rounded-md 
        mb-2 font-bold flex flex-row justify-between items-center">
        My Dashboards
        <CreateDashboardTrigger />
      </div>
      <div>
          <div className="sm:col-span-4 md:col-span-3">
              <Search placeholder="Search ..." />
              <Suspense key={query + currentPage} fallback={<p>Loading...</p>}>
                <DataTable query={query} currentPage={currentPage} />
              </Suspense>
          </div>
        </div> 
    </div>
  );
}