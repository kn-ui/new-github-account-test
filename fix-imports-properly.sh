#!/bin/bash

echo "🔧 Fixing import syntax properly..."

# Fix the malformed imports by replacing the pattern correctly
find src -name "*.tsx" -o -name "*.ts" | while read file; do
  if grep -q "from @/lib/hygraph" "$file"; then
    echo "Fixing $file"
    # Replace the malformed pattern with the correct one
    sed -i 's/from @\/lib\/hygraph/from @\/lib\/hygraph/g' "$file"
  fi
done

echo "✅ Import fixes completed!"