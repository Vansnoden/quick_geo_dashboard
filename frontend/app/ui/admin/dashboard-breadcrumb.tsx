import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import {
        Breadcrumb,
        BreadcrumbItem,
        BreadcrumbLink,
        BreadcrumbList,
        BreadcrumbPage,
        BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function DashboardHeader({ code }: { code: string }) {
        return (
                <div className="mb-6">
                        <Breadcrumb>
                                <BreadcrumbList>
                                        <BreadcrumbItem>
                                                <BreadcrumbLink href="/admin/dashboards">Dashboards</BreadcrumbLink>
                                        </BreadcrumbItem>
                                        <BreadcrumbSeparator />
                                        <BreadcrumbItem>
                                                <BreadcrumbPage>{code}</BreadcrumbPage>
                                        </BreadcrumbItem>
                                </BreadcrumbList>
                        </Breadcrumb>
                        <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-4">
                                        <Link href="/admin/dashboards">
                                                <ArrowLeftIcon className="w-6 h-6 text-gray-600 hover:text-violet-600" />
                                        </Link>
                                        <h1 className="text-2xl font-bold">Dashboard: {code}</h1>
                                </div>
                                <div className="flex gap-2">
                                        <button className="px-4 py-2 bg-gray-100 rounded-md text-sm font-medium hover:bg-gray-200">
                                                Add Data
                                        </button>
                                        <button
                                                type="submit"
                                                form="yaml-form"
                                                className="px-4 py-2 bg-violet-600 text-white rounded-md text-sm font-medium hover:bg-violet-500"
                                        >
                                                Save Config
                                        </button>
                                        <button
                                                type="submit"
                                                form="yaml-form"
                                                className="px-4 py-2 bg-violet-600 text-white rounded-md text-sm font-medium hover:bg-violet-500"
                                        >
                                                Render Dashboard
                                        </button>
                                </div>
                        </div>
                </div>
        );
}
