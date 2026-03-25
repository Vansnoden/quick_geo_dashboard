"use client";

import {
        MapIcon,
        ChartBarIcon,
        CircleStackIcon,
        DocumentIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
        { name: "Dashboards", href: "/admin/dashboards", icon: CircleStackIcon },
        { name: "Documentation", href: "/admin/doc", icon: DocumentIcon },
];

export default function NavLinks() {
        const pathname = usePathname();
        return (
                <>
                        {links.map((link) => {
                                const LinkIcon = link.icon;
                                return (
                                        <Link
                                                key={link.name}
                                                href={link.href}
                                                className={cn(
                                                        "flex h-12 grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-violet-100 hover:text-violet-600 md:flex-none md:justify-start md:p-2 md:px-3",
                                                        {
                                                                "bg-violet-100 text-violet-600": pathname === link.href,
                                                        }
                                                )}
                                        >
                                                <LinkIcon className="w-6" />
                                                <p className="hidden md:block">{link.name}</p>
                                        </Link>
                                );
                        })}
                </>
        );
}
