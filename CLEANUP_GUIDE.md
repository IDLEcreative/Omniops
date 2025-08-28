# Omniops Directory Cleanup Guide

This guide explains how to use the `cleanup-root.sh` script to clean up the nested directory structure in the Omniops project.

## Current Structure Issue

The project currently has a confusing nested structure:
```
/Users/jamesguy/Omniops/              # Root with some files
├── Omniops/                          # Nested directory with complete app
│   ├── Omniops/                      # Triply-nested (mostly empty)
│   ├── package.json                  # More complete configuration
│   ├── app/                          # Complete Next.js application
│   ├── lib/                          # More library files
│   └── ...                           # Complete project structure
```

## What the Script Does

The `cleanup-root.sh` script will:

1. **Analyze** the current structure and identify which version of files is more complete
2. **Backup** critical files before making changes
3. **Move** the complete application from `Omniops/Omniops/` to the root directory
4. **Resolve conflicts** by preferring the more complete versions (usually the nested ones)
5. **Clean up** empty directories and organize loose test files
6. **Remove** redundant configuration files

## Key Decisions the Script Makes

Based on the analysis:
- **Package.json**: Uses the nested version (28 scripts vs 16, 67 dependencies vs 61)
- **Library files**: Uses the nested version (92 files vs 71)
- **App structure**: Uses the nested version (109 files vs 88)
- **Documentation**: Intelligently merges, preferring larger/more complete versions

## Usage Options

### 1. Dry Run (Recommended First Step)
```bash
./cleanup-root.sh --dry-run
```
Shows exactly what would be done without making any changes.

### 2. Full Cleanup with Backup
```bash
./cleanup-root.sh
```
Performs the cleanup with confirmation prompts and creates a backup.

### 3. Automated Cleanup
```bash
./cleanup-root.sh --force
```
Runs without confirmation prompts (still creates backup).

### 4. Cleanup without Backup (Not Recommended)
```bash
./cleanup-root.sh --no-backup --force
```
Fastest option but risky.

## Safety Features

- **Backup Creation**: Automatically backs up critical files
- **Git Status Check**: Warns if you have uncommitted changes
- **File Comparison**: Intelligently chooses newer/larger files when conflicts occur
- **Detailed Logging**: Creates a log file of all operations
- **Dry Run Mode**: Test the operation without making changes

## Expected Results

After running the script successfully:

### Files Moved to Root
- Complete Next.js application structure
- More comprehensive package.json with additional scripts
- Enhanced library files with queue management
- Additional documentation and configuration files

### Files Organized
- Test scripts moved to `scripts/` directory
- Log files moved to `logs/` directory  
- Proper directory structure maintained

### Files Cleaned Up
- Empty nested directories removed
- Redundant configuration files eliminated
- Duplicate files resolved intelligently

## Post-Cleanup Steps

1. **Review Changes**
   ```bash
   git status
   git diff
   ```

2. **Test the Application**
   ```bash
   npm install  # Install any new dependencies
   npm run dev  # Start development server
   ```

3. **Run Tests**
   ```bash
   npm run test
   npm run test:integration
   ```

4. **Commit Changes** (if everything works)
   ```bash
   git add .
   git commit -m "Consolidate nested directory structure

   - Move complete application from Omniops/Omniops/ to root
   - Resolve file conflicts preferring more complete versions
   - Organize test files and clean up redundant configs
   - Remove empty nested directories"
   ```

## Recovery

If something goes wrong, you can restore from the backup:

```bash
# The script will tell you the backup location, e.g.:
# Backup location: /Users/jamesguy/Omniops/backup-20250828-152233

# Restore critical files if needed
cp backup-TIMESTAMP/package.json ./
cp -r backup-TIMESTAMP/lib ./
# etc.
```

## File Size Analysis

The script detected these key differences:

- **Package.json**: Nested has 12 more scripts and 6 more dependencies
- **Library code**: Nested has 21 more files (92 vs 71)
- **App structure**: Nested has 21 more files (109 vs 88)
- **Components**: Nested has 1 more file (28 vs 27)
- **Documentation**: Mixed - some files are larger in root, some in nested

## Recommended Workflow

1. Commit any uncommitted changes first
2. Run dry-run to see what will happen: `./cleanup-root.sh --dry-run`
3. Review the output and log file
4. If satisfied, run the actual cleanup: `./cleanup-root.sh`
5. Test the application thoroughly
6. Commit the changes if everything works correctly

The script is designed to be safe and conservative, preferring the more complete versions of files and creating backups of everything important.