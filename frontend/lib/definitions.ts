

export interface Dashboard {
    id: number,
    user_id: number,
    name: string,
    code: string,
    data_table_name: string,
    ui_yaml_script: string,
    ui_js_script: string,
    create_date: string,
    last_update_date: string,
    is_published: boolean
}

export interface DashboardResponse {
  data: Dashboard[];
  total_count: number;
  total_pages: number;
}


export interface YAxisDef {
  column?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}


export type FilterOperator = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'like' | 'in' | 'between';

export interface FilterCondition {
  column: string;
  operator: FilterOperator;
  value: string | number | (string | number)[];  // Array for 'in' operator, two values for 'between'
  value2?: string | number;  // For 'between' operator
}


export interface ChartDef {
  type: 'bar' | 'line' | 'pie' | 'stackedbar';
  title: string;
  x: string;
  y: YAxisDef | string; // string for simple count
  filters?: FilterCondition[]; 
  stackBy?: string;
}


export interface MenusDef {
  about: string;   // markdown content
  stats: string;   // markdown content for stats menu
  map: string;     // markdown content for map menu
}

export interface InteractiveFilterDef {
  column: string;
  label: string;
  type: 'dropdown' | 'multiselect' | 'range';
  // For range, you may optionally provide min/max (otherwise derived from data)
  min?: number;
  max?: number;
}

export interface DashboardConfig {
  name: string;
  template: 'side_content' | 'top_content' | 'content_side' | 'content_bottom';
  stats: ChartDef[];
  filters?: FilterCondition[]; // Global filters apply to all charts/map
  interactiveFilters?: InteractiveFilterDef[]; 
  map: MapDef;
  menus: MenusDef;
  download?: boolean;
}

// For chart data API response
export interface ChartDataResponse {
  labels: string[];
  data: number[];
}

export interface MapStyleRule {
  field: string;
  operator?: '=' | '!=' | 'like' | 'in';
  value: string | number | string[];
  color: string;
  label?: string;
}

export interface MapStyle {
  colorBy?: string;
  sizeBy?: string;
  defaultColor: string;
  defaultSize: number;
  minSize?: number;
  maxSize?: number;
  rules: MapStyleRule[];
  legend?: {
    title?: string;
    position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
    grouped?: boolean;
  };
}

export interface MapClustering {
  enabled: boolean;
  maxClusterRadius?: number;
  disableClusteringAtZoom?: number;
  spiderfyOnMaxZoom?: boolean;
  showCoverageOnHover?: boolean;
  zoomToBoundsOnClick?: boolean;
  chunkedLoading?: boolean;
  chunkInterval?: number;
  chunkDelay?: number;
  limit?: number;
}

export interface MapDef {
  lat: string;
  lon: string;
  layer?: string;
  style?: MapStyle;
  clustering?: MapClustering;
  filters?: FilterCondition[];
  fields?: string[];
}

