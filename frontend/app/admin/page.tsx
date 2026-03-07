import Search from "../ui/admin/search";
import DataTable from "../ui/admin/table";



 
export default async function AdminPage(props: {
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
      <div className="bg-violet-600 text-white py-3 px-2 rounded-md mb-2 font-bold">
        My Dashboards
      </div>
      <div>
          <div className="sm:col-span-4 md:col-span-3">
              <Search placeholder="Search ..." />
              <DataTable query={query} currentPage={currentPage}/>
          </div>
        </div> 
    </div>
  );
}