#!/bin/bash
# bundle_backend.sh – Bundle all Python files from a given directory into one text file.
# Usage: ./bundle_backend.sh [path]
# If no path provided, defaults to current directory.

# Set backend path (first argument or current directory)
BACKEND_PATH="${1:-.}"

# Check if the path exists
if [ ! -d "$BACKEND_PATH" ]; then
    echo "Error: Directory '$BACKEND_PATH' does not exist."
    exit 1
fi

OUTPUT_FILE="backend_bundle.txt"

# Clear output file
> "$OUTPUT_FILE"

echo "Bundling Python files from '$BACKEND_PATH' into $OUTPUT_FILE..."

# Directories to exclude (common virtual envs, cache, etc.)
EXCLUDE_DIRS=(
    "venv"
    "env"
    ".venv"
    ".env"
    "__pycache__"
    ".git"
    ".mypy_cache"
    ".pytest_cache"
    "dist"
    "build"
    "alembic/versions"   # optional: exclude alembic version files? keep them by default
)

# Build find command
FIND_CMD="find \"$BACKEND_PATH\" -type f -name \"*.py\""

# Exclude directories
for dir in "${EXCLUDE_DIRS[@]}"; do
    FIND_CMD="$FIND_CMD -not -path \"*/$dir/*\""
done

# Execute find and process each file
eval "$FIND_CMD" | while read -r file; do
    # Write a comment with the relative path
    echo "# $file" >> "$OUTPUT_FILE"
    # Append the file content
    cat "$file" >> "$OUTPUT_FILE"
    # Add a blank line for separation
    echo >> "$OUTPUT_FILE"
done

echo "Bundle complete! Output saved to $OUTPUT_FILE"


