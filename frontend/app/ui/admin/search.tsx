'use client';

import { TextField, InputAdornment } from '@mui/material';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';

export default function Search({ placeholder }: { placeholder: string }) {
        const searchParams = useSearchParams();
        const pathname = usePathname();
        const { replace } = useRouter();

        const handleSearch = useDebouncedCallback((term) => {
                const params = new URLSearchParams(searchParams);
                params.set('page', '1');
                if (term) {
                        params.set('query', term);
                } else {
                        params.delete('query');
                }
                replace(`${pathname}?${params.toString()}`);
        }, 300);

        return (
                <TextField
                        fullWidth
                        variant="outlined"
                        placeholder={placeholder}
                        onChange={(e) => handleSearch(e.target.value)}
                        defaultValue={searchParams.get('query')?.toString()}
                        InputProps={{
                                startAdornment: (
                                        <InputAdornment position="start">
                                                <MagnifyingGlassIcon className="h-5 w-5" />
                                        </InputAdornment>
                                ),
                        }}
                />
        );
}
