'use client';

import { useState } from "react";
import { Button } from "@mui/material";
import DashboardFormCreate from "@/app/ui/admin/dashboard-form-create";

export default function CreateDashboardTrigger() {
        const [isOpen, setIsOpen] = useState(false);

        return (
                <>
                        <Button variant="contained" onClick={() => setIsOpen(true)}>
                                + New
                        </Button>
                        {isOpen && <DashboardFormCreate onClose={() => setIsOpen(false)} />}
                </>
        );
}
