"use client";

import { Button as MuiButton, ButtonProps } from '@mui/material';
import { styled } from '@mui/material/styles';
import Link from 'next/link';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { deleteDashboard } from '@/app/lib/actions'; // Added import

export const Button = styled((props: ButtonProps) => (
        <MuiButton variant="contained" color="primary" {...props} />
))({
        textTransform: 'none',
});

export function CreateDashboard() {
        return (
                <Link href="/admin/dashboards/create" passHref>
                        <Button
                                startIcon={<PlusIcon className="h-5 w-5" />}
                                sx={{ ml: 2 }}
                        >
                                <span className="hidden md:block">Create Dashboard</span>
                        </Button>
                </Link>
        );
}

export function UpdateDashboard({ id }: { id: string | number }) {
        return (
                <Link href={`/admin/dashboards/${id}/edit`} passHref>
                        <Button
                                variant="outlined"
                                size="small"
                                startIcon={<PencilIcon className="w-5" />}
                        >
                                Edit
                        </Button>
                </Link>
        );
}

export function DeleteDashboard({ id }: { id: string | number }) {
        const deleteDashboardWithId = deleteDashboard.bind(null, id);

        return (
                <form action={deleteDashboardWithId}>
                        <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<TrashIcon className="w-5" />}
                        >
                                Delete
                        </Button>
                </form>
        );
}

export function ViewDashboard({ id }: { id: string | number }) {
        return (
                <Link href={`/admin/dashboards/${id}`} passHref>
                        <Button
                                variant="outlined"
                                color="secondary"
                                size="small"
                                startIcon={<EyeIcon className="w-5" />}
                        >
                                View
                        </Button>
                </Link>
        );
}
