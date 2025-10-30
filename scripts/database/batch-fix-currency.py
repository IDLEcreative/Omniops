#!/usr/bin/env python3
"""
Batch fix currency symbols in WooCommerce operation files.
Adds import for getCurrencySymbol and replaces all £ symbols.
"""

import re
from pathlib import Path

FILES_TO_FIX = [
    "lib/chat/product-operations/stock-operations.ts",
    "lib/chat/order-operations/order-history.ts",
    "lib/chat/order-operations/order-refunds-cancellation.ts",
    "lib/chat/store-operations.ts",
    "lib/chat/analytics-operations.ts",
    "lib/chat/report-operations.ts",
    "lib/chat/woocommerce-tool-formatters.ts",
]

def fix_file(filepath: Path) -> tuple[int, str]:
    """Fix currency symbols in a single file."""
    content = filepath.read_text()
    original = content

    # Count £ symbols
    pound_count = content.count('£')
    if pound_count == 0:
        return 0, "No currency symbols found"

    # Add import if not present
    if 'currency-utils' not in content:
        # Find last import statement
        import_pattern = r'(import.*from.*;\n)'
        imports = list(re.finditer(import_pattern, content))
        if imports:
            last_import = imports[-1]
            insert_pos = last_import.end()

            # Determine correct path (../ for subdirs, ./ for same dir)
            if '/product-operations/' in str(filepath) or '/order-operations/' in str(filepath):
                import_line = "import { getCurrencySymbol } from '../currency-utils';\n"
            else:
                import_line = "import { getCurrencySymbol } from './currency-utils';\n"

            content = content[:insert_pos] + import_line + content[insert_pos:]

    # Add currencySymbol variable to functions that use £
    # Find async functions with £ in their body
    function_pattern = r'(export\s+async\s+function\s+\w+[^{]*\{)'

    def add_currency_var(match):
        func_start = match.group(0)
        func_pos = match.end()

        # Find the end of this function (next export or end of file)
        next_export = content.find('\nexport', func_pos)
        func_end = next_export if next_export != -1 else len(content)
        func_body = content[func_pos:func_end]

        # Only add if function uses £ and doesn't already have currencySymbol
        if '£' in func_body and 'currencySymbol' not in func_body:
            # Add after try { if present, otherwise right after {
            if '\n  try {' in func_body[:50]:
                # Add after try {
                try_end = func_body.find('\n  try {') + len('\n  try {')
                insertion = '\n    const currencySymbol = getCurrencySymbol(params);'
                func_body = func_body[:try_end] + insertion + func_body[try_end:]
            else:
                # Add right after function {
                insertion = '\n  const currencySymbol = getCurrencySymbol(params);'
                func_body = insertion + func_body

        return func_start + func_body

    # Apply function modification
    parts = []
    last_end = 0
    for match in re.finditer(function_pattern, content):
        parts.append(content[last_end:match.start()])

        func_start = match.end()
        next_export = content.find('\nexport async function', func_start)
        func_end = next_export if next_export != -1 else len(content)
        func_body = content[func_start:func_end]

        # Add currency variable if needed
        if '£' in func_body and 'currencySymbol' not in func_body and 'getCurrencySymbol' not in func_body[:200]:
            # Add after try { block start
            if '\n  try {' in func_body[:100]:
                try_pos = func_body.find('\n  try {') + len('\n  try {')
                func_body = func_body[:try_pos] + '\n    const currencySymbol = getCurrencySymbol(params);' + func_body[try_pos:]
            else:
                # Add at function start
                func_body = '\n  const currencySymbol = getCurrencySymbol(params);' + func_body

        parts.append(match.group(0))
        parts.append(func_body)
        last_end = func_end

    parts.append(content[last_end:])
    content = ''.join(parts)

    # Replace all £ with ${currencySymbol}
    content = content.replace('£', '${currencySymbol}')

    # Write back
    filepath.write_text(content)

    return pound_count, f"Fixed {pound_count} symbols"

def main():
    print("🔧 Batch fixing currency symbols...\n")

    total_fixed = 0
    for filepath in FILES_TO_FIX:
        path = Path(filepath)
        if not path.exists():
            print(f"❌ {filepath}: File not found")
            continue

        count, message = fix_file(path)
        total_fixed += count

        if count > 0:
            print(f"✅ {filepath}: {message}")
        else:
            print(f"  {filepath}: {message}")

    print(f"\n✅ Total fixed: {total_fixed} currency symbols")
    print("⚠️  Manual review recommended for template literal syntax")

if __name__ == "__main__":
    main()
