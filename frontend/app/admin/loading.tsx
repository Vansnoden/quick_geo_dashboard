"use client";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingSkeleton() {
        return (
                <div className="neoLoadingScreen">
                        <Skeleton className="w-32 h-8" />
                        <p className="ml-2">Loading ...</p>
                </div>
        );
}
