#!/bin/bash

# Function to extract title (first H1)
extract_title() {
    local file="$1"
    head -50 "$file" | grep "^# " | head -1 | sed 's/^# //'
}

# Function to extract purpose (first paragraph after title)
extract_purpose() {
    local file="$1"
    awk '
    /^# / { flag=1; next }
    flag && /^$/ { if (collected) exit }
    flag && /^[^#]/ && /./ && !/^\*\*/ && !/^```/ && !/^\|/ && !/^-/ {
        if (!collected) collected=1
        print
    }
    ' "$file" | head -3 | tr '\n' ' ' | sed 's/  */ /g' | sed 's/^ //' | sed 's/ $//'
}

# Function to extract quick links (H2 headings)
extract_quick_links() {
    local file="$1"
    grep "^## " "$file" | head -5 | while IFS= read -r heading; do
        title=$(echo "$heading" | sed 's/^## //')
        anchor=$(echo "$title" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | sed 's/[^a-z0-9-]//g')
        echo "- [$title](#$anchor)"
    done
}

# Function to extract keywords
extract_keywords() {
    local file="$1"
    local filename=$(basename "$file" .md)

    # Keywords from filename
    echo "$filename" | tr '_' '\n' | tr '-' '\n' | tr '[:upper:]' '[:lower:]' | grep -E '^[a-z]{3,}$' | grep -vE '^(the|and|for|with|from)$'

    # Keywords from H2 headings
    grep "^## " "$file" | sed 's/^## //' | tr ' ' '\n' | tr '[:upper:]' '[:lower:]' | grep -E '^[a-z]{4,}$' | grep -vE '^(the|and|for|with|from|this|that)$'
}

# Function to calculate read time
calculate_read_time() {
    local file="$1"
    local lines=$(wc -l < "$file")
    echo $(( (lines / 20) + 1 ))
}

# Function to determine type from directory
determine_type() {
    local file="$1"
    case "$file" in
        */00-GETTING-STARTED/*) echo "Setup" ;;
        */01-ARCHITECTURE/*) echo "Architecture" ;;
        */03-API/*) echo "Reference" ;;
        */04-ANALYSIS/*) echo "Analysis" ;;
        */04-DEVELOPMENT/*) echo "Guide" ;;
        */05-DEPLOYMENT/*) echo "Guide" ;;
        */06-INTEGRATIONS/*) echo "Integration" ;;
        */06-TROUBLESHOOTING/*) echo "Troubleshooting" ;;
        */07-REFERENCE/*) echo "Reference" ;;
        *) echo "Documentation" ;;
    esac
}

# Main function to add metadata
add_metadata() {
    local file="$1"

    # Check if metadata already exists
    if grep -q "^\*\*Type:\*\*" "$file"; then
        echo "Skipping $file (already has metadata)"
        return
    fi

    echo "Processing: $file"

    # Extract metadata
    title=$(extract_title "$file")
    if [ -z "$title" ]; then
        title=$(basename "$file" .md | tr '_' ' ' | tr '-' ' ')
    fi

    type=$(determine_type "$file")
    purpose=$(extract_purpose "$file")
    quick_links=$(extract_quick_links "$file")
    keywords=$(extract_keywords "$file" | sort -u | head -10 | tr '\n' ',' | sed 's/,$//' | sed 's/,/, /g')
    read_time=$(calculate_read_time "$file")

    # Create temp file with metadata
    temp_file=$(mktemp)

    cat > "$temp_file" << EOF
# $title

**Type:** $type
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** ${read_time} minutes

## Purpose
$purpose

EOF

    # Add Quick Links if they exist
    if [ ! -z "$quick_links" ]; then
        echo "## Quick Links" >> "$temp_file"
        echo "$quick_links" >> "$temp_file"
        echo "" >> "$temp_file"
    fi

    # Add Keywords if they exist
    if [ ! -z "$keywords" ]; then
        echo "## Keywords" >> "$temp_file"
        echo "$keywords" >> "$temp_file"
        echo "" >> "$temp_file"
    fi

    echo "---" >> "$temp_file"
    echo "" >> "$temp_file"

    # Append original content (skip the first title line)
    awk 'BEGIN{skip=1} /^# /{if(skip){skip=0;next}} {print}' "$file" >> "$temp_file"

    # Replace original file
    mv "$temp_file" "$file"

    echo "✓ Added metadata to $file"
}

# Process files
if [ "$#" -eq 0 ]; then
    echo "Usage: $0 <file1> [file2] [file3] ..."
    exit 1
fi

for file in "$@"; do
    if [ -f "$file" ]; then
        add_metadata "$file"
    else
        echo "File not found: $file"
    fi
done
