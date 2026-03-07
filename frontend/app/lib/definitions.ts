

export interface Dashboard {
    id: number,
    user_id: number,
    name: string,
    code: string,
    data_table_name: string,
    ui_yaml_script: string,
    ui_js_script: string,
    create_date: string,
    last_update_date: string
}

export interface DashboardResponse {
  data: Dashboard[];
  total_count: number;
  total_pages: number;
}