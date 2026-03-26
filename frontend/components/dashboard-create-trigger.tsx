'use client';

import { useState } from "react";
import { Button } from "@/components/buttons";
import DashboardFormCreate from "@/components/dashboard-form-create";

export default function CreateDashboardTrigger() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button onClick={() => setIsOpen(true)}>+ New</Button>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white p-6 rounded-lg text-black">
                        <DashboardFormCreate onClose={() => setIsOpen(false)} />
                        <button onClick={() => setIsOpen(false)} className="mt-4 text-sm text-gray-500">
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
