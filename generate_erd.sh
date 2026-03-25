#!/bin/bash
# generate_erd - Generate ER diagram from SQLAlchemy models
# Usage: ./generate_erd [--backend <path>] [--models <path>]
#   --backend : path to the backend directory (default: ./backend)
#   --models  : relative path to models.py inside backend (default: database/models.py)

set -e

# Default values
BACKEND_DIR="./backend"
MODELS_PATH="database/models.py"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --backend|-b)
            BACKEND_DIR="$2"
            shift 2
            ;;
        --models|-m)
            MODELS_PATH="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Resolve absolute paths
BACKEND_ABS=$(realpath "$BACKEND_DIR")
if [ ! -d "$BACKEND_ABS" ]; then
    echo "❌ Error: Backend directory '$BACKEND_DIR' does not exist."
    exit 1
fi

MODELS_ABS="$BACKEND_ABS/$MODELS_PATH"
if [ ! -f "$MODELS_ABS" ]; then
    echo "❌ Error: Models file '$MODELS_ABS' not found."
    exit 1
fi

echo "📦 Generating ER diagram from $MODELS_ABS ..."

# Ensure required packages are installed
REQUIRED_PKGS=("sqlalchemy" "sqlalchemy-schemadisplay" "graphviz" "psycopg2-binary")
MISSING_PKGS=()
for pkg in "${REQUIRED_PKGS[@]}"; do
    python -c "import $pkg" 2>/dev/null || MISSING_PKGS+=("$pkg")
done

if [ ${#MISSING_PKGS[@]} -ne 0 ]; then
    echo "📦 Installing missing packages: ${MISSING_PKGS[*]}"
    pip install "${MISSING_PKGS[@]}"
fi

# Run Python generator (embedded script)
python - <<EOF
import sys
import os
from pathlib import Path
import importlib.util

# Add backend directory to Python path so imports work
backend_dir = "$BACKEND_ABS"
sys.path.insert(0, backend_dir)

# Now import the models module
models_file = "$MODELS_ABS"
module_name = Path(models_file).stem
spec = importlib.util.spec_from_file_location(module_name, models_file)
models_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(models_module)

# Try to get Base (metadata) from models module; if not, try session module
Base = getattr(models_module, 'Base', None)
if Base is None:
    # Assume models.py is inside a package like 'database' – import session from same package
    try:
        # Determine the package name (e.g., 'database')
        package = models_module.__package__
        if package:
            session_module = __import__(package + '.session', fromlist=['Base'])
            Base = session_module.Base
        else:
            # Fallback: try importing database.session directly (if backend is top-level)
            from database.session import Base
    except Exception as e:
        print(f"❌ Could not find Base: {e}")
        sys.exit(1)

# Import the engine from the session module
try:
    from database.session import engine
except ImportError:
    print("❌ Could not import 'engine' from database.session. Make sure the module exists.")
    sys.exit(1)

from sqlalchemy_schemadisplay import create_schema_graph

# Create the graph (engine is required as first argument)
graph = create_schema_graph(
    engine,
    metadata=Base.metadata,
    show_datatypes=True,
    show_indexes=False,
)

# Horizontal layout
graph.set_rankdir('LR')          # left-to-right
graph.set_splines('ortho')       # orthogonal edges
graph.set_nodesep(0.8)
graph.set_ranksep(1.0)

# Styling
graph.set_node_defaults(shape='box', fontname='Arial', fontsize='10')
graph.set_edge_defaults(arrowsize='0.8')

# Save
output = "er_diagram.png"
graph.write_png(output)
print(f"✅ ER diagram saved to {output}")
EOF

echo "🎉 Done!"
