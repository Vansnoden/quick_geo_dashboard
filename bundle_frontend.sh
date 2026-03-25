#!/bin/bash

# Script to bundle only the essential source code of a Next.js frontend.
# Usage: ./bundle_frontend.sh [path]
# If no path provided, defaults to "frontend"

# Set frontend path (first argument or default)
FRONTEND_PATH="${1:-frontend}"

# Check if the path exists
if [ ! -d "$FRONTEND_PATH" ]; then
    echo "Error: Directory '$FRONTEND_PATH' does not exist."
    exit 1
fi

OUTPUT_FILE="frontend_bundle.txt"

# Clear output file
> "$OUTPUT_FILE"

echo "Bundling frontend source code from '$FRONTEND_PATH' into $OUTPUT_FILE..."

# Directories to exclude completely
EXCLUDE_DIRS=(
    "node_modules"
    ".next"
    "out"
    "build"
    "dist"
    ".cache"
    ".vscode"
    ".idea"
    ".git"
    "coverage"
    ".turbo"
    "__pycache__"
    ".DS_Store"
)

# File extensions to exclude (binary or large assets)
EXCLUDE_EXTENSIONS=(
    "png" "jpg" "jpeg" "gif" "svg" "webp" "ico" "icns"
    "woff" "woff2" "ttf" "eot" "otf"
    "mp4" "webm" "mov" "avi" "flv" "mkv"
    "mp3" "wav" "ogg" "flac"
    "pdf" "zip" "tar" "gz" "bz2" "7z"
    "psd" "ai" "eps" "indd"
)

# Specific files to exclude (lock files, binary, etc.)
EXCLUDE_FILES=(
    "package-lock.json"
    "yarn.lock"
    "pnpm-lock.yaml"
    "pnpm-workspace.yaml"
    "tsconfig.tsbuildinfo"
    ".DS_Store"
    "Thumbs.db"
)

# Patterns to include (only source code and essential configs)
INCLUDE_PATTERNS=(
    "*.ts"
    "*.tsx"
    "*.js"
    "*.jsx"
    "*.css"
    "*.html"
    "*.md"
    "*.mjs"
    "*.cjs"
    "*.json"
    "*.env*"
    "*.config.js"
    "*.config.ts"
    "*.config.mjs"
    "*.config.cjs"
)

# Build find arguments using an array
find_args=("$FRONTEND_PATH" -type f)

# Add inclusion patterns with parentheses
find_args+=("(")
for pattern in "${INCLUDE_PATTERNS[@]}"; do
    find_args+=(-name "$pattern" -o)
done
# Remove the last -o and close the parenthesis
unset 'find_args[${#find_args[@]}-1]'   # Remove the last element (-o)
find_args+=(")")

# Exclude directories
for dir in "${EXCLUDE_DIRS[@]}"; do
    find_args+=(-not -path "*/$dir/*")
done

# Exclude specific files
for file in "${EXCLUDE_FILES[@]}"; do
    find_args+=(-not -name "$file")
done

# Exclude files by extension
for ext in "${EXCLUDE_EXTENSIONS[@]}"; do
    find_args+=(-not -name "*.$ext")
done

echo "Collecting files..."
# Execute find and process each file
find "${find_args[@]}" | while read -r file; do
    # Optionally skip files larger than 1MB (uncomment if needed)
    # if [ $(stat -c%s "$file") -gt 1048576 ]; then
    #     echo "  Skipping large file: $file (>1MB)"
    #     continue
    # fi

    # Print file header
    echo "=========================================" >> "$OUTPUT_FILE"
    echo "FILE: $file" >> "$OUTPUT_FILE"
    echo "=========================================" >> "$OUTPUT_FILE"
    cat "$file" >> "$OUTPUT_FILE"
    echo -e "\n\n" >> "$OUTPUT_FILE"
done

echo "Bundle complete! Output saved to $OUTPUT_FILE"



