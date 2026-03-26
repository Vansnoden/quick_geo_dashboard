import { Dashboard } from "@/lib/definitions";
import DashboardHeader from "@/components/dashboard-breadcrumb";
import YamlEditor from "@/components/yaml_editor";
import yaml from 'js-yaml';
import DataPreview from '@/components/dashboard-data-preview';


export default function DashBoardDetails(props:{dashboard: Dashboard}){

    const dashboard = props.dashboard;

    let beautifiedYaml = "";
    try {
        // Parse the string and dump it back out with 2-space indentation
        const jsonObject = yaml.load(dashboard.ui_yaml_script);
        beautifiedYaml = yaml.dump(jsonObject, { indent: 2 });
    } catch (e) {
        // If parsing fails, fall back to the raw content
        beautifiedYaml = dashboard.ui_yaml_script;
    }

    return (
        <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
                {/* Left Column: Data Table Info */}
		<div className="rounded-xl border bg-gray-50 p-4 overflow-auto">
		    <h2 className="text-lg font-semibold mb-4 text-gray-700">Data Preview</h2>
		    {dashboard.data_table_name ? (
			<DataPreview dashboardId={dashboard.id} />
		    ) : (
			<div className="flex items-center justify-center h-40 border-2 border-dashed rounded-lg border-gray-300">
			    <p className="text-gray-400 italic">No data table defined.</p>
			</div>
		    )}
		</div>
                {/* Right Column: YAML Editor */}
                <div className="flex flex-col rounded-xl border bg-gray-900 overflow-hidden">
                    <div className="px-4 py-2 bg-gray-800 text-gray-300 text-xs font-mono flex justify-between">
                        <span>dashboard_config.yaml</span>
                    </div>
                    <YamlEditor 
                        id={dashboard.id} 
                        initialValue={beautifiedYaml || ''} 
                    />
                </div>
            </div>
        </div>
    )
}
