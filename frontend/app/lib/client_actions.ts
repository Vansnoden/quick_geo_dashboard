
import { DASHBOARD_ADD_DATA_URL, DASHBOARD_CHART_DATA_URL, DASHBOARD_CONFIG_URL, DASHBOARD_GET_URL, DASHBOARD_MAP_POINTS_URL } from './constants';
import { ChartDef, ChartDataResponse, DashboardConfig } from './definitions';
import GeoJSON from 'ol/format/GeoJSON';


export async function fetchDashboardConfig(dashboardId: string): Promise<DashboardConfig> {
  const res = await fetch(DASHBOARD_CONFIG_URL(Number(dashboardId)));
  if (!res.ok) throw new Error('Failed to fetch dashboard config');
  return res.json();
}

export async function fetchChartData(
  dashboardId: string,
  chartDef: ChartDef
): Promise<ChartDataResponse> {
  const res = await fetch(DASHBOARD_CHART_DATA_URL(Number(dashboardId)), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(chartDef)
  });
  if (!res.ok) throw new Error('Failed to fetch chart data');
  return res.json();
}

export async function fetchMapPoints(dashboardId: string): Promise<GeoJSON.FeatureCollection> {
  const res = await fetch(DASHBOARD_MAP_POINTS_URL(Number(dashboardId)));
  if (!res.ok) throw new Error('Failed to fetch map points');
  return res.json();
}