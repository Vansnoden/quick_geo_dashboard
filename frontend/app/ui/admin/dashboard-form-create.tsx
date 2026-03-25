"use client";

import { Dashboard } from "@/app/lib/definitions";
import Link from "next/link";
import { createDashboard, updateDashboard } from "@/app/lib/actions";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DashboardFormCreate({
        dashboard,
        onClose,
}: {
        dashboard?: Dashboard;
        onClose?: () => void;
}) {
        const router = useRouter();
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [name, setName] = useState(dashboard?.name || "");
        const [error, setError] = useState<string | null>(null);
        const [touched, setTouched] = useState(false);

        const isValid = name.trim().length >= 3;
        const showError = touched && !isValid;

        const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
                event.preventDefault();

                if (!isValid) {
                        setTouched(true);
                        setError("Dashboard name must be at least 3 characters");
                        return;
                }

                setIsSubmitting(true);
                setError(null);

                try {
                        const formData = new FormData();
                        formData.append("name", name.trim());

                        let result = null;

                        if (dashboard?.id) {
                                result = await updateDashboard(Number(dashboard.id), formData);
                        } else {
                                result = await createDashboard(formData);
                        }

                        if (result && typeof result === "object") {
                                if ("errors" in result && result.errors) {
                                        const errorMsg = Object.values(result.errors).flat().join(", ");
                                        setError(errorMsg || "Validation failed");
                                        setIsSubmitting(false);
                                        return;
                                }
                                if ("message" in result && result.message) {
                                        setError(result.message as string);
                                        setIsSubmitting(false);
                                        return;
                                }
                        }

                        router.refresh();
                        if (onClose) {
                                onClose();
                        } else {
                                router.push("/admin/dashboards");
                        }
                } catch (err) {
                        if (err && typeof err === "object" && "digest" in err) {
                                if (onClose) onClose();
                                return;
                        }
                        console.error("Form submission error:", err);
                        setError(err instanceof Error ? err.message : "Failed to save dashboard");
                        setIsSubmitting(false);
                }
        };

        return (
                <Dialog open onOpenChange={() => onClose && onClose()}>
                        <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                        <DialogTitle>{dashboard ? "Edit Dashboard" : "Create New Dashboard"}</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                                <Label htmlFor="name">Dashboard Name <span className="text-red-500">*</span></Label>
                                                <Input
                                                        id="name"
                                                        name="name"
                                                        value={name}
                                                        onChange={(e) => {
                                                                setName(e.target.value);
                                                                setTouched(true);
                                                                setError(null);
                                                        }}
                                                        onBlur={() => setTouched(true)}
                                                        placeholder="e.g., Malaria Surveillance Dashboard"
                                                        required
                                                        disabled={isSubmitting}
                                                        maxLength={100}
                                                        className={showError ? "border-red-500" : ""}
                                                />
                                                {showError && (
                                                        <p className="text-sm text-red-500 mt-1">Name must be at least 3 characters</p>
                                                )}
                                                <div className="mt-1 flex justify-between text-xs text-gray-500">
                                                        <span>Min. 3 characters</span>
                                                        <span className={name.length > 90 ? "text-yellow-600 font-medium" : ""}>
                                                                {name.length}/100
                                                        </span>
                                                </div>
                                        </div>

                                        {error && (
                                                <Alert variant="destructive">
                                                        <AlertDescription>{error}</AlertDescription>
                                                </Alert>
                                        )}

                                        <DialogFooter>
                                                <Button type="button" variant="outline" onClick={() => onClose ? onClose() : router.push("/admin/dashboards")}>
                                                        Cancel
                                                </Button>
                                                <Button type="submit" disabled={!isValid || isSubmitting}>
                                                        {isSubmitting ? "Saving..." : (dashboard ? "Update" : "Create")}
                                                </Button>
                                        </DialogFooter>
                                </form>
                        </DialogContent>
                </Dialog>
        );
}
