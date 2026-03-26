"use client";

import clsx from 'clsx';
import { EyeIcon, PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { deleteDashboard } from '@/lib/actions';
import RenameDashboardModal from '@/components/dashboard-form-rename';
import { useState } from 'react';
import ConfirmDialog from '@/components/confirm-dialog';


interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

export function Button({ children, className, ...rest }: ButtonProps) {
    return (
        <button
            {...rest}
            className={
                clsx(
                `flex h-10 items-center rounded-lg bg-violet-500 px-4 text-sm font-medium 
                 text-white transition-colors hover:bg-violet-400 focus-visible:outline-2 
                 focus-visible:outline-offset-2 focus-visible:outline-violet-500 
                 active:bg-violet-600 aria-disabled:cursor-not-allowed aria-disabled:opacity-50`,
                className,)
            }>
            {children}
        </button>
    );
}

export function CreateDashboard() {
    return (
        <Link
            href="/admin/dashboards/create"
            className="flex h-10 items-center rounded-lg bg-violet-600 px-4 text-sm 
                font-medium text-white transition-colors hover:bg-violet-500 focus-visible:outline 
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
            <span className="hidden md:block">
                Create Dashboard
            </span>
            {' '}
            <PlusIcon className="h-5 md:ml-4" />
        </Link>
    );
}


export function UpdateDashboard({ id, name }: UpdateDashboardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="rounded-md border p-2 hover:bg-gray-100"
            >
                <PencilIcon className="w-5" />
            </button>
            {isModalOpen && (
                <RenameDashboardModal
                    dashboardId={id}
                    currentName={name}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </>
    );
}


export function DeleteDashboard({ id }: { id: string | number }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirm = async () => {
        setIsDeleting(true);
        try {
            await deleteDashboard(id);
            // The action will redirect, so we don't need to close the dialog manually
            // But to prevent UI issues, we can let it close after redirect.
            // We'll keep isOpen true until redirect happens.
        } catch (error) {
            console.error('Delete failed:', error);
            setIsDeleting(false);
            setIsOpen(false);
            // Optionally show error toast
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="rounded-md border p-2 hover:bg-gray-100 text-red-600"
            >
                <span className="sr-only">Delete</span>
                <TrashIcon className="w-5" />
            </button>
            <ConfirmDialog
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onConfirm={handleConfirm}
                title="Delete Dashboard"
                message="Are you sure you want to delete this dashboard? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                isConfirming={isDeleting}
                variant="danger"
            />
        </>
    );
}

export function ViewDashboard({ id }: { id: string | number }) {
    return (
        <Link
            href={`/admin/dashboards/${id}`}
            className="rounded-md border p-2 hover:bg-gray-100 text-violet-600">
            <EyeIcon className="w-5" />
        </Link>
    );
}
