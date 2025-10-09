#!/bin/bash

echo "🔧 Fixing all malformed imports..."

# Find all files with malformed imports and fix them
find src -name "*.tsx" -o -name "*.ts" | while read file; do
  if grep -q "from @/lib/hygraph" "$file"; then
    echo "Fixing $file"
    sed -i 's/from @\/lib\/hygraph/from @\/lib\/hygraph/g' "$file"
  fi
done

echo "✅ All imports fixed!"