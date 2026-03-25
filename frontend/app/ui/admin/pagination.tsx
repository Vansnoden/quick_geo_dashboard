"use client";

import { generatePagination } from "@/app/lib/utils";
import { usePathname, useSearchParams } from "next/navigation";
import {
        Pagination as PaginationRoot,
        PaginationContent,
        PaginationEllipsis,
        PaginationItem,
        PaginationLink,
        PaginationNext,
        PaginationPrevious,
} from "@/components/ui/pagination";

export default function Pagination({ totalPages }: { totalPages: number }) {
        const pathname = usePathname();
        const searchParams = useSearchParams();
        const currentPage = Number(searchParams.get("page")) || 1;

        const createPageURL = (pageNumber: number | string) => {
                const params = new URLSearchParams(searchParams);
                params.set("page", pageNumber.toString());
                return `${pathname}?${params.toString()}`;
        };

        const allPages = generatePagination(currentPage, totalPages);

        return (
                <PaginationRoot>
                        <PaginationContent>
                                <PaginationItem>
                                        <PaginationPrevious
                                                href={createPageURL(currentPage - 1)}
                                                aria-disabled={currentPage <= 1}
                                                className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                                        />
                                </PaginationItem>

                                {allPages.map((page, index) => {
                                        if (page === "...") {
                                                return (
                                                        <PaginationItem key={`ellipsis-${index}`}>
                                                                <PaginationEllipsis />
                                                        </PaginationItem>
                                                );
                                        }
                                        return (
                                                <PaginationItem key={page}>
                                                        <PaginationLink
                                                                href={createPageURL(page)}
                                                                isActive={currentPage === page}
                                                        >
                                                                {page}
                                                        </PaginationLink>
                                                </PaginationItem>
                                        );
                                })}

                                <PaginationItem>
                                        <PaginationNext
                                                href={createPageURL(currentPage + 1)}
                                                aria-disabled={currentPage >= totalPages}
                                                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                                        />
                                </PaginationItem>
                        </PaginationContent>
                </PaginationRoot>
        );
}
