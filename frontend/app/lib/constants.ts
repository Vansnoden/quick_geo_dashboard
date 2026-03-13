export const BASE_API_URL = process.env.BASE_API_URL;
export const BASE_PUBLIC_API_URL = process.env.NEXT_PUBLIC_BASE_PUBLIC_API_URL;
// console.log("BASE_PUBLIC_API_URL ===> "+  BASE_PUBLIC_API_URL);
// console.log("BASE_API_URL ===> "+  BASE_API_URL);
// internal endpoints
export const AUTH_URL = BASE_API_URL + "/token";
export const SIGNUP_URL = BASE_API_URL + "/users";
export const USERINFO_URL = BASE_API_URL + "/users/details/me";
export const USER_DASH_DATA_ALL = BASE_API_URL + "/dashboards";
export const DASHBOARD_ADD_URL = BASE_API_URL + "/dashboards/add";
export const DASHBOARD_GET_URL = (id: number) => BASE_API_URL + `/dashboards/${id}`;
export const DASHBOARD_EDIT_URL = (id: number) => BASE_API_URL + `/dashboards/${id}/edit`;
export const DASHBOARD_DELETE_URL = (id: number) => BASE_API_URL + `/dashboards/${id}/delete`;
export const DASHBOARD_ADD_DATA_URL = (id: number) => BASE_API_URL + `/dashboards/${id}/add_data`;
// public endpoints
export const DASHBOARD_CONFIG_URL = (id: number) => BASE_PUBLIC_API_URL + `/dashboards/${id}/config`;
export const DASHBOARD_MAP_POINTS_URL = (id: number) => BASE_PUBLIC_API_URL + `/dashboards/${id}/points`;
export const DASHBOARD_MAP_POINTS_IN_VIEW_URL = (id: number) => BASE_PUBLIC_API_URL + `/dashboards/${id}/points-in-view`;
export const DASHBOARD_FILTERED_MAP_POINTS_URL = (id: number) => BASE_PUBLIC_API_URL + `/dashboards/${id}/filtered-points`;
export const DASHBOARD_CHART_DATA_URL = (id: number) => BASE_PUBLIC_API_URL + `/dashboards/${id}/chart-data`;
export const DASHBOARD_CHART_DISTINCT_VALS = (id: number) => BASE_PUBLIC_API_URL + `/dashboards/${id}/distinct-values`
export const DASHBOARD_JS_URL = (id: number) => BASE_PUBLIC_API_URL + `/dashboards/${id}/dashboard.js`;
