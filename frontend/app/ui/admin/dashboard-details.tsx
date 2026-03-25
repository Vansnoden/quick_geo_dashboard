import { Dashboard } from "@/app/lib/definitions";
import DashboardHeader from "./dashboard-breadcrumb";
import YamlEditor from "./yaml_editor";
import yaml from 'js-yaml';
import { Box, Paper, Typography } from '@mui/material';

export default function DashBoardDetails(props: { dashboard: Dashboard }) {
        const dashboard = props.dashboard;

        let beautifiedYaml = "";
        try {
                const jsonObject = yaml.load(dashboard.ui_yaml_script);
                beautifiedYaml = yaml.dump(jsonObject, { indent: 2 });
        } catch (e) {
                beautifiedYaml = dashboard.ui_yaml_script;
        }

        return (
                <Box>
                        <DashboardHeader code={dashboard.name} />
                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mt: 3 }}>
                                <Paper sx={{ flex: 1, p: 2 }}>
                                        <Typography variant="h6" gutterBottom>
                                                Data Preview
                                        </Typography>
                                        {dashboard.data_table_name ? (
                                                <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                                                        <Typography variant="body2" fontFamily="monospace">
                                                                Table: {dashboard.data_table_name}
                                                        </Typography>
                                                </Box>
                                        ) : (
                                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 160, border: '1px dashed grey', borderRadius: 1 }}>
                                                        <Typography color="textSecondary">No data table defined.</Typography>
                                                </Box>
                                        )}
                                </Paper>
                                <Paper sx={{ flex: 1, p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                        <Box sx={{ bgcolor: 'grey.800', p: 1, color: 'white', fontFamily: 'monospace' }}>
                                                dashboard_config.yaml
                                        </Box>
                                        <YamlEditor id={dashboard.id} initialValue={beautifiedYaml || ''} />
                                </Paper>
                        </Box>
                </Box>
        );
}
