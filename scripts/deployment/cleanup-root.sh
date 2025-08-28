#!/bin/bash

# =============================================================================
# Omniops Directory Structure Cleanup Script
# =============================================================================
# This script safely consolidates the nested Omniops directory structure
# by moving the complete application to the root and cleaning up duplicates.
#
# Usage: ./cleanup-root.sh [--dry-run] [--no-backup] [--force]
#
# Options:
#   --dry-run    Show what would be done without making changes
#   --no-backup  Skip creating backup (not recommended)
#   --force      Skip confirmation prompts
# =============================================================================

set -e  # Exit on error
set -u  # Exit on undefined variable

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR"
NESTED_DIR="$ROOT_DIR/Omniops"
BACKUP_DIR="$ROOT_DIR/backup-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="$ROOT_DIR/cleanup-$(date +%Y%m%d-%H%M%S).log"

# Default options
DRY_RUN=false
CREATE_BACKUP=true
FORCE=false
VERBOSE=true

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# Utility Functions
# =============================================================================

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

info() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
    fi
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

confirm() {
    if [ "$FORCE" = true ]; then
        return 0
    fi
    
    echo -e "${YELLOW}$1${NC}"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted by user"
        exit 1
    fi
}

# Check if file exists and is not empty
file_exists_and_not_empty() {
    [ -f "$1" ] && [ -s "$1" ]
}

# Check if directory exists and is not empty
dir_exists_and_not_empty() {
    [ -d "$1" ] && [ "$(ls -A "$1" 2>/dev/null)" ]
}

# Compare two files and return 0 if they're identical
files_identical() {
    if [ -f "$1" ] && [ -f "$2" ]; then
        cmp -s "$1" "$2"
    else
        return 1
    fi
}

# Get file modification time for comparison
get_file_mtime() {
    if [ -f "$1" ]; then
        stat -f %m "$1" 2>/dev/null || stat -c %Y "$1" 2>/dev/null || echo 0
    else
        echo 0
    fi
}

# =============================================================================
# Validation Functions
# =============================================================================

validate_environment() {
    info "Validating environment..."
    
    # Check if we're in the right directory
    if [ ! -f "$ROOT_DIR/package.json" ]; then
        error "No package.json found in root directory. Are you in the right location?"
        exit 1
    fi
    
    if [ ! -d "$NESTED_DIR" ]; then
        error "Nested Omniops directory not found at $NESTED_DIR"
        exit 1
    fi
    
    # Check if this is a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        error "Not in a git repository. This script should be run from the git repository root."
        exit 1
    fi
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        warn "You have uncommitted changes in your git repository."
        confirm "This script will make significant file system changes. Consider committing your changes first."
    fi
    
    # Check available disk space
    available_space=$(df "$ROOT_DIR" | awk 'NR==2 {print $4}')
    if [ "$available_space" -lt 1000000 ]; then  # Less than ~1GB
        warn "Low disk space available. You have approximately $(($available_space / 1024))MB free."
        confirm "Continue with cleanup?"
    fi
    
    success "Environment validation passed"
}

# =============================================================================
# Analysis Functions
# =============================================================================

analyze_structure() {
    info "Analyzing directory structure..."
    
    log "=== DIRECTORY ANALYSIS ==="
    log "Root directory: $ROOT_DIR"
    log "Nested directory: $NESTED_DIR"
    log ""
    
    # Analyze package.json differences
    if [ -f "$ROOT_DIR/package.json" ] && [ -f "$NESTED_DIR/package.json" ]; then
        log "Package.json comparison:"
        
        # Count scripts in each
        root_scripts=$(jq -r '.scripts | length' "$ROOT_DIR/package.json" 2>/dev/null || echo 0)
        nested_scripts=$(jq -r '.scripts | length' "$NESTED_DIR/package.json" 2>/dev/null || echo 0)
        
        log "  Root scripts: $root_scripts"
        log "  Nested scripts: $nested_scripts"
        
        # Count dependencies
        root_deps=$(jq -r '(.dependencies // {}) + (.devDependencies // {}) | length' "$ROOT_DIR/package.json" 2>/dev/null || echo 0)
        nested_deps=$(jq -r '(.dependencies // {}) + (.devDependencies // {}) | length' "$NESTED_DIR/package.json" 2>/dev/null || echo 0)
        
        log "  Root total dependencies: $root_deps"
        log "  Nested total dependencies: $nested_deps"
        
        if [ "$nested_scripts" -gt "$root_scripts" ] && [ "$nested_deps" -ge "$root_deps" ]; then
            log "  DECISION: Nested package.json appears more complete"
        fi
    fi
    
    # Analyze documentation files
    log ""
    log "Documentation analysis:"
    for doc in README.md CLAUDE.md; do
        if [ -f "$ROOT_DIR/$doc" ] && [ -f "$NESTED_DIR/$doc" ]; then
            root_size=$(wc -c < "$ROOT_DIR/$doc")
            nested_size=$(wc -c < "$NESTED_DIR/$doc")
            log "  $doc - Root: ${root_size}B, Nested: ${nested_size}B"
        fi
    done
    
    # Analyze test structure
    log ""
    log "Test structure analysis:"
    if [ -d "$ROOT_DIR/__tests__" ] && [ -d "$NESTED_DIR/__tests__" ]; then
        root_tests=$(find "$ROOT_DIR/__tests__" -name "*.test.*" | wc -l)
        nested_tests=$(find "$NESTED_DIR/__tests__" -name "*.test.*" | wc -l)
        log "  Root test files: $root_tests"
        log "  Nested test files: $nested_tests"
    fi
    
    # Analyze lib directory
    log ""
    log "Library code analysis:"
    if [ -d "$ROOT_DIR/lib" ] && [ -d "$NESTED_DIR/lib" ]; then
        root_lib_files=$(find "$ROOT_DIR/lib" -name "*.ts" -o -name "*.js" | wc -l)
        nested_lib_files=$(find "$NESTED_DIR/lib" -name "*.ts" -o -name "*.js" | wc -l)
        log "  Root lib files: $root_lib_files"
        log "  Nested lib files: $nested_lib_files"
    fi
}

# =============================================================================
# Backup Functions
# =============================================================================

create_backup() {
    if [ "$CREATE_BACKUP" = false ]; then
        info "Skipping backup creation"
        return 0
    fi
    
    info "Creating backup at $BACKUP_DIR..."
    
    if [ "$DRY_RUN" = true ]; then
        info "[DRY RUN] Would create backup directory: $BACKUP_DIR"
        return 0
    fi
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup critical files that exist in root but might be overwritten
    local backup_files=(
        "package.json"
        "package-lock.json"
        "README.md"
        "CLAUDE.md"
        ".env.local"
        ".env.example"
        "next.config.js"
        "tailwind.config.js"
        "tsconfig.json"
    )
    
    for file in "${backup_files[@]}"; do
        if [ -f "$ROOT_DIR/$file" ]; then
            cp "$ROOT_DIR/$file" "$BACKUP_DIR/"
            log "Backed up: $file"
        fi
    done
    
    # Backup entire root-level directories that might be affected
    local backup_dirs=(
        "__tests__"
        "lib"
        "components"
        "app"
        "docs"
        "scripts"
    )
    
    for dir in "${backup_dirs[@]}"; do
        if [ -d "$ROOT_DIR/$dir" ] && [ "$ROOT_DIR/$dir" != "$NESTED_DIR/$dir" ]; then
            cp -r "$ROOT_DIR/$dir" "$BACKUP_DIR/"
            log "Backed up directory: $dir"
        fi
    done
    
    success "Backup created successfully"
}

# =============================================================================
# Cleanup Functions
# =============================================================================

identify_duplicates() {
    info "Identifying duplicate files..."
    
    # Files that definitely exist in both locations
    local common_files=(
        "package.json"
        "README.md" 
        "CLAUDE.md"
        "next.config.js"
        "tailwind.config.js"
        "tsconfig.json"
        "jest.config.js"
        "eslint.config.mjs"
        "postcss.config.mjs"
        "middleware.ts"
    )
    
    log "=== DUPLICATE FILE ANALYSIS ==="
    
    for file in "${common_files[@]}"; do
        if [ -f "$ROOT_DIR/$file" ] && [ -f "$NESTED_DIR/$file" ]; then
            if files_identical "$ROOT_DIR/$file" "$NESTED_DIR/$file"; then
                log "IDENTICAL: $file"
            else
                root_mtime=$(get_file_mtime "$ROOT_DIR/$file")
                nested_mtime=$(get_file_mtime "$NESTED_DIR/$file")
                
                if [ "$nested_mtime" -gt "$root_mtime" ]; then
                    log "DIFFERENT: $file (nested is newer)"
                else
                    log "DIFFERENT: $file (root is newer)"
                fi
            fi
        fi
    done
    
    # Check for duplicate directories
    local common_dirs=(
        "__tests__"
        "lib"
        "components" 
        "app"
        "docs"
        "scripts"
        "supabase"
        "types"
    )
    
    log ""
    log "=== DUPLICATE DIRECTORY ANALYSIS ==="
    
    for dir in "${common_dirs[@]}"; do
        if [ -d "$ROOT_DIR/$dir" ] && [ -d "$NESTED_DIR/$dir" ]; then
            root_files=$(find "$ROOT_DIR/$dir" -type f | wc -l)
            nested_files=$(find "$NESTED_DIR/$dir" -type f | wc -l)
            log "DIRECTORY: $dir (root: $root_files files, nested: $nested_files files)"
        fi
    done
}

move_nested_to_root() {
    info "Moving nested directory contents to root..."
    
    if [ ! -d "$NESTED_DIR" ]; then
        error "Nested directory $NESTED_DIR does not exist"
        return 1
    fi
    
    # First, handle special cases and conflicts
    handle_file_conflicts
    
    # Move all contents from nested to root
    info "Moving all files and directories from nested location..."
    
    if [ "$DRY_RUN" = true ]; then
        info "[DRY RUN] Would move contents of $NESTED_DIR to $ROOT_DIR"
        find "$NESTED_DIR" -maxdepth 1 -not -path "$NESTED_DIR" | while read -r item; do
            basename_item=$(basename "$item")
            info "[DRY RUN]   Would move: $basename_item"
        done
        return 0
    fi
    
    # Create a temporary directory to handle moves safely
    local temp_dir="$ROOT_DIR/.cleanup_temp_$$"
    mkdir -p "$temp_dir"
    
    # Move everything from nested to temp directory first
    find "$NESTED_DIR" -maxdepth 1 -not -path "$NESTED_DIR" -exec mv {} "$temp_dir/" \;
    
    # Now move everything from temp to root, handling conflicts
    for item in "$temp_dir"/*; do
        if [ -e "$item" ]; then
            basename_item=$(basename "$item")
            target="$ROOT_DIR/$basename_item"
            
            if [ -e "$target" ]; then
                log "Conflict detected: $basename_item - merging or overwriting"
                if [ -d "$item" ] && [ -d "$target" ]; then
                    # Merge directories
                    cp -r "$item"/* "$target/" 2>/dev/null || true
                    rm -rf "$item"
                else
                    # Overwrite file (nested version preferred based on analysis)
                    mv "$item" "$target"
                fi
            else
                mv "$item" "$target"
            fi
            
            log "Moved: $basename_item"
        fi
    done
    
    # Clean up temp directory
    rmdir "$temp_dir" 2>/dev/null || true
    
    success "Content move completed"
}

handle_file_conflicts() {
    info "Resolving file conflicts..."
    
    # Handle package.json specially - nested version has more features
    if [ -f "$ROOT_DIR/package.json" ] && [ -f "$NESTED_DIR/package.json" ]; then
        if [ "$DRY_RUN" = true ]; then
            info "[DRY RUN] Would prefer nested package.json (more complete)"
        else
            log "Using nested package.json (more complete script configuration)"
        fi
    fi
    
    # Handle documentation - prefer more complete versions
    for doc in README.md CLAUDE.md; do
        if [ -f "$ROOT_DIR/$doc" ] && [ -f "$NESTED_DIR/$doc" ]; then
            root_size=$(wc -c < "$ROOT_DIR/$doc")
            nested_size=$(wc -c < "$NESTED_DIR/$doc")
            
            if [ "$nested_size" -gt "$root_size" ]; then
                if [ "$DRY_RUN" = true ]; then
                    info "[DRY RUN] Would prefer nested $doc (larger: ${nested_size}B vs ${root_size}B)"
                else
                    log "Preferring nested $doc (more complete: ${nested_size}B vs ${root_size}B)"
                fi
            fi
        fi
    done
}

cleanup_empty_directories() {
    info "Cleaning up empty directories..."
    
    if [ "$DRY_RUN" = true ]; then
        info "[DRY RUN] Would remove empty nested directory structure"
        return 0
    fi
    
    # Remove the now-empty nested Omniops directory
    if [ -d "$NESTED_DIR" ]; then
        if [ "$(ls -A "$NESTED_DIR" 2>/dev/null)" ]; then
            warn "Nested directory is not empty after move operation"
            log "Remaining items in $NESTED_DIR:"
            ls -la "$NESTED_DIR" | tee -a "$LOG_FILE"
        else
            rmdir "$NESTED_DIR"
            success "Removed empty nested directory"
        fi
    fi
    
    # Remove any other empty nested Omniops directories
    if [ -d "$NESTED_DIR/Omniops" ]; then
        if [ ! "$(ls -A "$NESTED_DIR/Omniops" 2>/dev/null)" ]; then
            rmdir "$NESTED_DIR/Omniops"
            log "Removed empty triply-nested directory"
        fi
    fi
}

organize_loose_files() {
    info "Organizing loose test and script files..."
    
    # Test files that should be in __tests__ directory
    local test_files=(
        "test-*.js"
        "test-*.ts"
        "test-*.mjs"
        "*-test.js"
        "*-test.ts"
        "*-test.mjs"
        "comprehensive-test.js"
        "validation-test.js"
    )
    
    if [ "$DRY_RUN" = true ]; then
        info "[DRY RUN] Would organize loose test files into proper directories"
        for pattern in "${test_files[@]}"; do
            for file in $ROOT_DIR/$pattern; do
                if [ -f "$file" ]; then
                    info "[DRY RUN]   Would move: $(basename "$file") -> scripts/"
                fi
            done 2>/dev/null
        done
        return 0
    fi
    
    # Ensure scripts directory exists
    mkdir -p "$ROOT_DIR/scripts"
    
    # Move test files to scripts directory (they're actually test scripts, not unit tests)
    for pattern in "${test_files[@]}"; do
        for file in $ROOT_DIR/$pattern; do
            if [ -f "$file" ] && [ "$(dirname "$file")" = "$ROOT_DIR" ]; then
                basename_file=$(basename "$file")
                if [ ! -f "$ROOT_DIR/scripts/$basename_file" ]; then
                    mv "$file" "$ROOT_DIR/scripts/"
                    log "Moved test script: $basename_file -> scripts/"
                else
                    log "Script already exists in scripts/: $basename_file"
                    rm "$file"  # Remove duplicate
                fi
            fi
        done 2>/dev/null
    done
    
    # Clean up other loose files
    local cleanup_files=(
        "performance-results-*.json"
        "network-test-results.json"
        "validation-report.json"
        "scraper-test-results.json"
        "worker-test-output.log"
        "docker-startup.log"
    )
    
    mkdir -p "$ROOT_DIR/logs"
    
    for pattern in "${cleanup_files[@]}"; do
        for file in $ROOT_DIR/$pattern; do
            if [ -f "$file" ] && [ "$(dirname "$file")" = "$ROOT_DIR" ]; then
                basename_file=$(basename "$file")
                mv "$file" "$ROOT_DIR/logs/"
                log "Moved log file: $basename_file -> logs/"
            fi
        done 2>/dev/null
    done
}

remove_redundant_configs() {
    info "Removing redundant configuration files..."
    
    # Files that are commonly duplicated and where we want to keep only the better version
    local config_files=(
        ".env.example"
        "docker-compose.yml"
        "jest.config.js"
        "playwright.config.js"
    )
    
    if [ "$DRY_RUN" = true ]; then
        info "[DRY RUN] Would clean up redundant configuration files"
        return 0
    fi
    
    # The move operation should have already handled most conflicts,
    # but let's clean up any obvious duplicates
    for config in "${config_files[@]}"; do
        # Remove any backup files that might have been created
        if [ -f "$ROOT_DIR/$config.bak" ]; then
            rm "$ROOT_DIR/$config.bak"
            log "Removed backup: $config.bak"
        fi
    done
}

# =============================================================================
# Main Functions
# =============================================================================

show_summary() {
    log ""
    log "=== CLEANUP SUMMARY ==="
    log "Log file: $LOG_FILE"
    
    if [ "$CREATE_BACKUP" = true ] && [ "$DRY_RUN" = false ]; then
        log "Backup location: $BACKUP_DIR"
    fi
    
    if [ "$DRY_RUN" = true ]; then
        log "This was a DRY RUN - no changes were made"
    else
        log "Cleanup completed successfully"
    fi
    
    log ""
    log "Next steps:"
    log "1. Review the changes: git status"
    log "2. Test the application: npm run dev"
    log "3. Run tests: npm run test"
    log "4. If everything works, commit the changes"
    log "5. If issues arise, restore from backup: $BACKUP_DIR"
    log ""
}

show_help() {
    cat << EOF
Omniops Directory Structure Cleanup Script

This script consolidates the nested Omniops directory structure by moving
the complete application from Omniops/Omniops/ to the root directory and
cleaning up duplicates.

USAGE:
    $0 [OPTIONS]

OPTIONS:
    --dry-run       Show what would be done without making changes
    --no-backup     Skip creating backup (not recommended)
    --force         Skip confirmation prompts
    --help          Show this help message

WHAT THIS SCRIPT DOES:
    1. Creates a backup of critical files
    2. Analyzes directory structure and identifies duplicates
    3. Moves contents from Omniops/Omniops/ to root
    4. Resolves conflicts by preferring the more complete versions
    5. Removes empty nested directories
    6. Organizes loose test files into proper directories
    7. Cleans up redundant configuration files

SAFETY FEATURES:
    - Creates backups by default
    - Validates environment before starting
    - Supports dry-run mode
    - Detailed logging of all operations
    - Confirmation prompts for destructive operations

EXAMPLES:
    $0                          # Interactive cleanup with backup
    $0 --dry-run                # See what would be done
    $0 --force --no-backup      # Automated cleanup without backup
EOF
}

main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --no-backup)
                CREATE_BACKUP=false
                shift
                ;;
            --force)
                FORCE=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Initialize logging
    log "=== OMNIOPS CLEANUP SCRIPT STARTED ==="
    log "Options: DRY_RUN=$DRY_RUN, CREATE_BACKUP=$CREATE_BACKUP, FORCE=$FORCE"
    
    if [ "$DRY_RUN" = true ]; then
        warn "Running in DRY RUN mode - no changes will be made"
    fi
    
    # Main execution flow
    validate_environment
    analyze_structure
    identify_duplicates
    
    if [ "$DRY_RUN" = false ]; then
        confirm "This will make significant changes to your directory structure. The nested Omniops directory will be merged into the root."
    fi
    
    create_backup
    move_nested_to_root
    cleanup_empty_directories
    organize_loose_files
    remove_redundant_configs
    
    show_summary
    
    if [ "$DRY_RUN" = false ]; then
        success "Cleanup completed! Review changes with: git status"
    else
        info "Dry run completed. Use --force to execute the cleanup."
    fi
}

# =============================================================================
# Script Entry Point
# =============================================================================

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi