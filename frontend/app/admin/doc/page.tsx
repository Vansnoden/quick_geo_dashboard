import React from 'react';
import Link from 'next/link';

export default function DocPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Documentation</h1>
          <p className="mt-2 text-lg text-gray-600">
            Learn how to create, configure, and share interactive geo-dashboards
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="sticky top-8 space-y-2">
              <a href="#getting-started" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                🚀 Getting Started
              </a>
              <a href="#authentication" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                🔐 Authentication
              </a>
              <a href="#dashboards" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                📊 Dashboards
              </a>
              <a href="#data-upload" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                📤 Data Upload
              </a>
              <a href="#yaml-configuration" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                ⚙️ YAML Configuration
              </a>
              <a href="#chart-types" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                📈 Chart Types
              </a>
              <a href="#map-configuration" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                🗺️ Map Configuration
              </a>
              <a href="#filters" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                🔍 Filters
              </a>
              <a href="#interactive-filters" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                🎛️ Interactive Filters
              </a>
              <a href="#data-download" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                💾 Data Download
              </a>
              <a href="#data-preview" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                👁️ Data Preview
              </a>
              <a href="#examples" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                📋 Examples
              </a>
              <a href="#api-reference" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                🔌 API Reference
              </a>
              <a href="#troubleshooting" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                🛠️ Troubleshooting
              </a>
            </nav>
          </div>

          {/* Documentation Content */}
          <div className="lg:col-span-3 prose prose-purple max-w-none">
            {/* Getting Started */}
            <section id="getting-started" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">🚀 Getting Started</h2>
              <p className="text-gray-700">
                Welcome to the Geo-Dashboard tool! This platform allows you to transform your CSV or Excel data into interactive, 
                shareable geo-dashboards using a simple YAML configuration language. No coding experience required!
              </p>
              
              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Quick Start</h3>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                <li><strong>Create an account</strong> or log in to your existing account</li>
                <li><strong>Create a new dashboard</strong> from the admin panel</li>
                <li><strong>Upload your data</strong> (CSV or Excel format)</li>
                <li><strong>Configure your dashboard</strong> using YAML</li>
                <li><strong>Share your dashboard</strong> with a unique URL</li>
              </ol>
            </section>

            {/* Authentication */}
            <section id="authentication" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">🔐 Authentication</h2>
              <p className="text-gray-700">
                All dashboards are private by default. You need to be authenticated to create, edit, or delete dashboards.
              </p>
              
              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Creating an Account</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Navigate to the <Link href="/login" className="text-purple-600 hover:underline">login page</Link></li>
                <li>Click on "Sign up here" to create a new account</li>
                <li>Provide a username, email, and password</li>
                <li>Once registered, you can log in with your credentials</li>
              </ul>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-4">
                <p className="text-blue-800 text-sm">
                  <strong>💡 Note:</strong> Your session will remain active for 30 days. You can log out at any time.
                </p>
              </div>
            </section>

            {/* Dashboards */}
            <section id="dashboards" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Dashboards</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-3">Creating a Dashboard</h3>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                <li>From the admin panel, click "New Dashboard"</li>
                <li>Give your dashboard a meaningful name (at least 3 characters)</li>
                <li>A unique dashboard ID and sharing URL will be generated</li>
              </ol>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Managing Dashboards</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>View:</strong> Click on any dashboard in the list to see its public view</li>
                <li><strong>Edit:</strong> Click the pencil icon to open a modal and rename the dashboard</li>
                <li><strong>Delete:</strong> Click the trash icon, confirm deletion in the modal</li>
                <li><strong>Share:</strong> Each dashboard has a unique URL that you can share with anyone</li>
              </ul>
            </section>

            {/* Data Upload */}
            <section id="data-upload" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📤 Data Upload</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-3">Supported Formats</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>CSV</strong> (Comma-separated values) - Recommended</li>
                <li><strong>Excel</strong> (.xlsx, .xls) - Automatically converted</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Upload Process</h3>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                <li>Navigate to your dashboard's edit page</li>
                <li>Click on "Add Data" button</li>
                <li>Select one or more files (CSV or Excel)</li>
                <li>Optionally, provide column type overrides in JSON format:
                  <pre className="bg-gray-800 text-gray-200 p-3 rounded-lg mt-2 text-sm">
{`{
  "date_column": "DATE",
  "value_column": "FLOAT",
  "category_column": "TEXT"
}`}
                  </pre>
                </li>
                <li>The system will automatically create a database table and import your data</li>
              </ol>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-4">
                <p className="text-yellow-800 text-sm">
                  <strong>⚠️ Important:</strong> Column names with spaces or special characters are automatically 
                  sanitized. Use quotes in your YAML when referencing them (e.g., <code>"Specie counts"</code>).
                </p>
              </div>
            </section>

            {/* YAML Configuration */}
            <section id="yaml-configuration" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">⚙️ YAML Configuration</h2>
              
              <p className="text-gray-700 mb-4">
                The heart of your dashboard is the YAML configuration file. It defines the dashboard's name, layout, 
                charts, map, and menus. YAML is a human-readable data format that's easy to learn.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-3">Basic Structure</h3>
              <pre className="bg-gray-800 text-gray-200 p-4 rounded-lg overflow-x-auto text-sm">
{`geo-dashboard:
  name: "My Dashboard Name"
  template: side_content
  download: false  # Set to true to enable data download button
  filters:
    - column: Year
      operator: ">="
      value: 2020
  stats:
    - type: bar
      title: "My Chart Title"
      x: category_column
      y: count
  interactiveFilters:
    - column: Year
      label: Year Range
      type: range
    - column: Country
      label: Country
      type: multiselect
  map:
    lat: latitude_column
    lon: longitude_column
  menus:
    about: "Information about this dashboard"
    stats: "Statistical summary"
    map: "Map description"`}
              </pre>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Available Templates</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><code>side_content</code> - Sidebar on the left, main content on the right (recommended)</li>
                <li><code>top_content</code> - Menus on top, charts below</li>
                <li><code>content_side</code> - Main content on the left, sidebar on the right</li>
                <li><code>content_bottom</code> - Menus on top, charts in the middle, map at bottom</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Data Download</h3>
              <p className="text-gray-700 mb-2">
                Set <code>download: true</code> in the root of the config to display a "Download Data" button in the sidebar. 
                When clicked, it exports the currently filtered dataset (respecting global and interactive filters) as a CSV file.
              </p>
            </section>

            {/* Chart Types */}
            <section id="chart-types" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📈 Chart Types</h2>

              <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-3">Bar Chart</h3>
              <pre className="bg-gray-800 text-gray-200 p-3 rounded-lg text-sm">
{`- type: bar
  title: "Sales by Category"
  x: category
  y: 
    column: sales
    aggregation: sum`}
              </pre>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Line Chart</h3>
              <pre className="bg-gray-800 text-gray-200 p-3 rounded-lg text-sm">
{`- type: line
  title: "Trend Over Time"
  x: year
  y: 
    column: value
    aggregation: avg`}
              </pre>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Pie Chart</h3>
              <pre className="bg-gray-800 text-gray-200 p-3 rounded-lg text-sm">
{`- type: pie
  title: "Distribution by Category"
  x: category
  y: count  # Simple count of rows`}
              </pre>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Stacked Bar Chart</h3>
              <pre className="bg-gray-800 text-gray-200 p-3 rounded-lg text-sm">
{`- type: stackedbar
  title: "Species by Country"
  x: country
  y:
    column: count
    aggregation: sum
  stackBy: species`}
              </pre>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Aggregation Functions</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><code>sum</code> - Total sum of values</li>
                <li><code>avg</code> - Average value</li>
                <li><code>count</code> - Number of records</li>
                <li><code>min</code> - Minimum value</li>
                <li><code>max</code> - Maximum value</li>
                <li><code>count distinct</code> - Number of unique values</li>
              </ul>
            </section>

            {/* Map Configuration */}
            <section id="map-configuration" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">🗺️ Map Configuration</h2>

              <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-3">Basic Map</h3>
              <pre className="bg-gray-800 text-gray-200 p-3 rounded-lg text-sm">
{`map:
  lat: latitude_column
  lon: longitude_column`}
              </pre>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Styled Map with Clustering</h3>
              <pre className="bg-gray-800 text-gray-200 p-3 rounded-lg text-sm">
{`map:
  lat: lat
  lon: lon
  clustering:
    enabled: true
    maxClusterRadius: 80
    disableClusteringAtZoom: 14
    limit: 15000
  style:
    colorBy: category_column
    sizeBy: value_column
    defaultColor: "#94a3b8"
    defaultSize: 6
    minSize: 4
    maxSize: 14
    rules:
      - field: category
        operator: "="
        value: "Type A"
        color: "#ef4444"
        label: "Category A"
      - field: category
        operator: "="
        value: "Type B"
        color: "#3b82f6"
        label: "Category B"
    legend:
      title: "Legend Title"
      position: "bottomright"`}
              </pre>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Clustering Options</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><code>enabled</code> - Enable/disable clustering (boolean)</li>
                <li><code>maxClusterRadius</code> - Maximum radius of clusters in pixels</li>
                <li><code>disableClusteringAtZoom</code> - Zoom level where clusters break apart</li>
                <li><code>spiderfyOnMaxZoom</code> - Spread out clusters when zooming in</li>
                <li><code>chunkedLoading</code> - Load markers in batches for performance</li>
                <li><code>limit</code> - Maximum points to load per viewport</li>
              </ul>
            </section>

            {/* Filters */}
            <section id="filters" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">🔍 Filters</h2>

              <p className="text-gray-700 mb-4">
                Filters can be applied globally to all charts and the map, or specifically to individual charts.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-3">Filter Operators</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><code>=</code> - Equal to</li>
                <li><code>!=</code> - Not equal to</li>
                <li><code>&gt;</code> - Greater than</li>
                <li><code>&gt;=</code> - Greater than or equal to</li>
                <li><code>&lt;</code> - Less than</li>
                <li><code>&lt;=</code> - Less than or equal to</li>
                <li><code>like</code> - Pattern matching (use % as wildcard)</li>
                <li><code>in</code> - Value in a list</li>
                <li><code>between</code> - Between two values</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Global Filters</h3>
              <pre className="bg-gray-800 text-gray-200 p-3 rounded-lg text-sm">
{`filters:
  - column: year
    operator: ">="
    value: 2020
  - column: country
    operator: in
    value: ["USA", "Canada", "Mexico"]`}
              </pre>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Chart-Specific Filters</h3>
              <pre className="bg-gray-800 text-gray-200 p-3 rounded-lg text-sm">
{`- type: bar
  title: "Filtered Chart"
  x: category
  y: count
  filters:
    - column: status
      operator: "="
      value: "active"
    - column: value
      operator: ">"
      value: 100`}
              </pre>
            </section>

            {/* Interactive Filters */}
            <section id="interactive-filters" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">🎛️ Interactive Filters</h2>
              <p className="text-gray-700 mb-4">
                Interactive filters appear in the sidebar and allow users to dynamically filter the dashboard without editing YAML. They are defined in the YAML under <code>interactiveFilters</code>.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-3">Types</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><code>dropdown</code> - Single-select dropdown</li>
                <li><code>multiselect</code> - Multi-select dropdown with search</li>
                <li><code>range</code> - Range slider for numeric columns</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Example</h3>
              <pre className="bg-gray-800 text-gray-200 p-3 rounded-lg text-sm">
{`interactiveFilters:
  - column: Year
    label: Year Range
    type: range
  - column: Country
    label: Country
    type: multiselect
  - column: Form
    label: Disease Form
    type: dropdown`}
              </pre>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 mt-4">
                <p className="text-green-800 text-sm">
                  <strong>💡 Tip:</strong> The range filter automatically fetches the minimum and maximum values from your data (respecting global filters) and displays a slider. Adjusting it instantly updates all charts and the map.
                </p>
              </div>
            </section>

            {/* Data Download */}
            <section id="data-download" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">💾 Data Download</h2>
              <p className="text-gray-700 mb-4">
                If you set <code>download: true</code> in the YAML, a "Download Data" button appears in the sidebar. When clicked, it exports the currently filtered dataset (including all applied global and interactive filters) as a CSV file.
              </p>
              <pre className="bg-gray-800 text-gray-200 p-3 rounded-lg text-sm">
{`geo-dashboard:
  download: true
  # ... rest of config`}
              </pre>
              <p className="text-gray-700 mt-2">
                The download respects all active filters, so users can export exactly the subset they're viewing.
              </p>
            </section>

            {/* Data Preview */}
            <section id="data-preview" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">👁️ Data Preview</h2>
              <p className="text-gray-700 mb-4">
                On the dashboard edit page, a rich preview shows information about the uploaded data:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Total number of records</li>
                <li>Table name</li>
                <li>Column names and their SQL types</li>
                <li>First 5 sample rows</li>
              </ul>
              <p className="text-gray-700 mt-2">
                This helps you understand the structure of your data before building charts and maps.
              </p>
            </section>

            {/* Examples */}
            <section id="examples" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📋 Examples</h2>

              <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-3">Leishmaniasis Vector Dashboard</h3>
              <pre className="bg-gray-800 text-gray-200 p-3 rounded-lg text-sm overflow-x-auto">
{`geo-dashboard:
  name: "Leishmaniasis Vector Surveillance Dashboard"
  template: side_content
  download: true
  filters:
    - column: Year
      operator: ">="
      value: 2000
  interactiveFilters:
    - column: Year
      label: Year Range
      type: range
    - column: Country
      label: Country
      type: multiselect
    - column: Form
      label: Disease Form
      type: dropdown
  stats:
    - type: pie
      title: "Top 10 VL Vectors by Abundance"
      x: species
      y:
        column: "Specie counts"
        aggregation: sum
      filters:
        - column: Form
          operator: "="
          value: VL
    - type: bar
      title: "VL Vector Abundance by Country"
      x: Country
      y:
        column: "Specie counts"
        aggregation: sum
      filters:
        - column: Form
          operator: "="
          value: VL
  map:
    lat: Lat
    lon: Lon
    clustering:
      enabled: false
    style:
      colorBy: Form
      sizeBy: "Specie counts"
      rules:
        - field: Form
          operator: "="
          value: VL
          color: "#ef4444"
          label: "VL Vectors"
        - field: Form
          operator: "="
          value: CL
          color: "#3b82f6"
          label: "CL Vectors"
    legend:
      title: "Vector Types"
      position: "bottomright"
  menus:
    about: |
      ## 🦟 Leishmaniasis Vector Surveillance Dashboard
      A comprehensive visualization platform for sand fly vector surveillance data...`}
              </pre>
            </section>

            {/* API Reference */}
            <section id="api-reference" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">🔌 API Reference</h2>

              <p className="text-gray-700 mb-4">
                All API endpoints are available under the <code>/qgd_api</code> base path.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-3">Authentication</h3>
              <ul className="space-y-3">
                <li className="bg-gray-50 p-3 rounded-lg">
                  <code className="text-purple-600 font-mono">POST /token</code>
                  <p className="text-sm text-gray-600 mt-1">Get access token (username/password)</p>
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Dashboards</h3>
              <ul className="space-y-3">
                <li className="bg-gray-50 p-3 rounded-lg">
                  <code className="text-purple-600 font-mono">GET /dashboards/</code>
                  <p className="text-sm text-gray-600 mt-1">List all dashboards (paginated)</p>
                </li>
                <li className="bg-gray-50 p-3 rounded-lg">
                  <code className="text-purple-600 font-mono">POST /dashboards/add</code>
                  <p className="text-sm text-gray-600 mt-1">Create a new dashboard</p>
                </li>
                <li className="bg-gray-50 p-3 rounded-lg">
                  <code className="text-purple-600 font-mono">GET /dashboards/{`{id}`}</code>
                  <p className="text-sm text-gray-600 mt-1">Get dashboard details</p>
                </li>
                <li className="bg-gray-50 p-3 rounded-lg">
                  <code className="text-purple-600 font-mono">PUT /dashboards/{`{id}`}/edit</code>
                  <p className="text-sm text-gray-600 mt-1">Rename dashboard</p>
                </li>
                <li className="bg-gray-50 p-3 rounded-lg">
                  <code className="text-purple-600 font-mono">POST /dashboards/{`{id}`}/delete</code>
                  <p className="text-sm text-gray-600 mt-1">Delete a dashboard</p>
                </li>
                <li className="bg-gray-50 p-3 rounded-lg">
                  <code className="text-purple-600 font-mono">PUT /dashboards/{`{id}`}/config</code>
                  <p className="text-sm text-gray-600 mt-1">Update dashboard YAML configuration</p>
                </li>
                <li className="bg-gray-50 p-3 rounded-lg">
                  <code className="text-purple-600 font-mono">POST /dashboards/{`{id}`}/add_data</code>
                  <p className="text-sm text-gray-600 mt-1">Upload data files (CSV/Excel)</p>
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Data Endpoints</h3>
              <ul className="space-y-3">
                <li className="bg-gray-50 p-3 rounded-lg">
                  <code className="text-purple-600 font-mono">GET /dashboards/{`{id}`}/config</code>
                  <p className="text-sm text-gray-600 mt-1">Get dashboard configuration (public)</p>
                </li>
                <li className="bg-gray-50 p-3 rounded-lg">
                  <code className="text-purple-600 font-mono">GET /dashboards/{`{id}`}/points</code>
                  <p className="text-sm text-gray-600 mt-1">Get all map points as GeoJSON</p>
                </li>
                <li className="bg-gray-50 p-3 rounded-lg">
                  <code className="text-purple-600 font-mono">POST /dashboards/{`{id}`}/points-in-view</code>
                  <p className="text-sm text-gray-600 mt-1">Get points within bounding box (for clustering)</p>
                </li>
                <li className="bg-gray-50 p-3 rounded-lg">
                  <code className="text-purple-600 font-mono">POST /dashboards/{`{id}`}/chart-data</code>
                  <p className="text-sm text-gray-600 mt-1">Get aggregated data for a chart</p>
                </li>
                <li className="bg-gray-50 p-3 rounded-lg">
                  <code className="text-purple-600 font-mono">POST /dashboards/{`{id}`}/distinct-values</code>
                  <p className="text-sm text-gray-600 mt-1">Get distinct values for a column (for stacked charts)</p>
                </li>
                <li className="bg-gray-50 p-3 rounded-lg">
                  <code className="text-purple-600 font-mono">GET /dashboards/{`{id}`}/dashboard.js</code>
                  <p className="text-sm text-gray-600 mt-1">Get generated JavaScript config</p>
                </li>
                <li className="bg-gray-50 p-3 rounded-lg">
                  <code className="text-purple-600 font-mono">GET /dashboards/{`{id}`}/data-info</code>
                  <p className="text-sm text-gray-600 mt-1">Get data preview (rows, columns, sample)</p>
                </li>
                <li className="bg-gray-50 p-3 rounded-lg">
                  <code className="text-purple-600 font-mono">POST /dashboards/{`{id}`}/export</code>
                  <p className="text-sm text-gray-600 mt-1">Export filtered data as CSV</p>
                </li>
              </ul>
            </section>

            {/* Troubleshooting */}
            <section id="troubleshooting" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">🛠️ Troubleshooting</h2>

              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900">Map not displaying points</h3>
                  <ul className="list-disc pl-6 mt-2 text-sm text-gray-700">
                    <li>Verify that your data has valid latitude/longitude columns</li>
                    <li>Check that column names in YAML match exactly (case-sensitive)</li>
                    <li>Ensure lat/lon values are within valid ranges (-90 to 90, -180 to 180)</li>
                    <li>For large datasets, enable clustering in map configuration</li>
                  </ul>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900">Charts showing no data</h3>
                  <ul className="list-disc pl-6 mt-2 text-sm text-gray-700">
                    <li>Verify that column names in YAML match your data</li>
                    <li>Check if filters are too restrictive</li>
                    <li>Ensure data was successfully uploaded to the database</li>
                    <li>For pie charts with many categories, the backend automatically shows top 10 + "Others"</li>
                  </ul>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900">YAML validation errors</h3>
                  <ul className="list-disc pl-6 mt-2 text-sm text-gray-700">
                    <li>Use online YAML validators to check syntax</li>
                    <li>Ensure proper indentation (2 spaces per level)</li>
                    <li>Quote strings containing special characters</li>
                    <li>Check that all required fields are present (name, template, stats, map, menus)</li>
                  </ul>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900">Performance issues with large datasets</h3>
                  <ul className="list-disc pl-6 mt-2 text-sm text-gray-700">
                    <li>Enable clustering on the map for millions of points</li>
                    <li>Use TOP 10 aggregations in charts to limit data processed</li>
                    <li>Add global filters to focus on relevant subsets</li>
                    <li>Consider using count distinct instead of listing all values</li>
                  </ul>
                </div>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 mt-6">
                <p className="text-green-800 text-sm">
                  <strong>💬 Need more help?</strong> Check the console logs for detailed error messages 
                  or contact support with your dashboard ID and YAML configuration.
                </p>
              </div>
            </section>

            {/* Footer */}
            <div className="border-t border-gray-200 pt-8 mt-12">
              <p className="text-sm text-gray-500 text-center">
                Version 1.1.0 | Last updated: March 2025 | © 2025 Geo-Dashboard Platform
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
