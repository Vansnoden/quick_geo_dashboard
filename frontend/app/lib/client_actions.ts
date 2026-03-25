
import { auth } from '@/auth';
import { DASHBOARD_ADD_URL, DASHBOARD_CHART_DATA_URL, DASHBOARD_CONFIG_URL, DASHBOARD_FILTERED_MAP_POINTS_URL, DASHBOARD_MAP_POINTS_URL } from './constants';
import { ChartDef, ChartDataResponse, DashboardConfig, FilterCondition } from './definitions';


export async function fetchDashboardConfig(dashboardId: string): Promise<DashboardConfig> {
  const res = await fetch(DASHBOARD_CONFIG_URL(Number(dashboardId)));
  if (!res.ok) throw new Error('Failed to fetch dashboard config');
  return res.json();
}

export async function fetchChartData(
  dashboardId: string,
  chartDef: ChartDef,
  extraFilters?: FilterCondition[]
): Promise<ChartDataResponse> {
  // Merge chart-specific filters with interactive filters
  const filters = [...(chartDef.filters || []), ...(extraFilters || [])];
  
  // Create the request payload - just include filters, don't nest another body
  const payload = {
    type: chartDef.type,
    title: chartDef.title,
    x: chartDef.x,
    y: chartDef.y,
    filters: filters
  };
  
  const response = await fetch(DASHBOARD_CHART_DATA_URL(Number(dashboardId)), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Chart data error:', errorText);
    throw new Error(`Failed to fetch chart data: ${response.status}`);
  }
  
  return response.json();
}


export async function fetchMapPoints(dashboardId: string): Promise<GeoJSON.FeatureCollection> {
  // Map filters are applied on backend based on YAML config
  // No need to pass them here
  const response = await fetch(DASHBOARD_MAP_POINTS_URL(Number(dashboardId)));
  if (!response.ok) throw new Error('Failed to fetch map points');
  return response.json();
}


export async function fetchFilteredMapPoints(
  dashboardId: string,
  filters: FilterCondition[]
): Promise<GeoJSON.FeatureCollection> {
  const response = await fetch(DASHBOARD_FILTERED_MAP_POINTS_URL(Number(dashboardId)), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filters })
  });
  if (!response.ok) throw new Error('Failed to fetch filtered map points');
  return response.json();
}

