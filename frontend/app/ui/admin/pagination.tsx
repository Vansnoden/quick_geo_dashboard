'use client';

import { Pagination as MuiPagination } from '@mui/material';
import { usePathname, useSearchParams } from 'next/navigation';
import { generatePagination } from '@/app/lib/utils';

export default function Pagination({ totalPages }: { totalPages: number }) {
        const pathname = usePathname();
        const searchParams = useSearchParams();
        const currentPage = Number(searchParams.get('page')) || 1;

        const handleChange = (event: React.ChangeEvent<unknown>, page: number) => {
                const params = new URLSearchParams(searchParams);
                params.set('page', page.toString());
                window.history.pushState({}, '', `${pathname}?${params.toString()}`);
        };

        return (
                <MuiPagination
                        count={totalPages}
                        page={currentPage}
                        onChange={handleChange}
                        color="primary"
                        showFirstButton
                        showLastButton
                />
        );
}
