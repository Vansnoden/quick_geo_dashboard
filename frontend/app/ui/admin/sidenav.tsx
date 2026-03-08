import Link from 'next/link';
import NavLinks from '@/app/ui/admin/nav-links';
import { HomeIcon } from '@heroicons/react/20/solid';
import { handleSignOut } from '@/app/lib/actions';
import { auth } from '@/auth';


export default async function SideNav() {
  const session = await auth();
  const user = session?.user as any;

  const userName = user?.username;

  return (
    <div className="flex h-full flex-col px-3 py-4 md:px-2">
      <Link
        className="mb-2 flex h-20 items-end justify-start rounded-md bg-violet-600 p-4 md:h-40"
        href="/"
      >
        <div className="w-32 text-white md:w-40 font-bold">
          {/* <AcmeLogo /> */}
          Administration
          <hr/>
          <p className='mt-4 font-normal'>
            Welcome, <b>{userName}</b>
          </p>
        </div>
      </Link>
      <div className="flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2">
        <NavLinks />
        <div className="hidden h-auto w-full grow rounded-md bg-gray-50 md:block"></div>
        <form action={handleSignOut}>
          <button className="flex h-12 w-full grow items-center justify-center gap-2 
            rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-violet-100 hover:text-violet-600 
            md:flex-none md:justify-start md:p-2 md:px-3">
            <HomeIcon className="w-6" />
            <div className="hidden md:block">Log Out</div>
          </button>
        </form>
      </div>
    </div>
  );
}