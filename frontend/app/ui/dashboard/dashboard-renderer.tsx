'use client';

import { DashboardConfig } from "@/app/lib/definitions";
import SideContentLayout from "./layouts/SideContentLayout";

interface Props {
        config: DashboardConfig;
        dashboardId: string;
}

export default function DashboardRenderer({ config, dashboardId }: Props) {
        const layouts: Record<string, React.FC<{ config: DashboardConfig; dashboardId: string }>> = {
                side_content: SideContentLayout,
        };
        const LayoutComponent = layouts[config.template] || layouts.side_content;
        return <LayoutComponent config={config} dashboardId={dashboardId} />;
}
