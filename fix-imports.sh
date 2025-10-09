#!/bin/bash

echo "🔧 Fixing import syntax issues..."

# Fix malformed import statements
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/from @\/lib\/hygraph'\''/from @\/lib\/hygraph/g'
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/from @\/lib\/hygraph"/from @\/lib\/hygraph/g'

# Remove Firebase imports that are no longer needed
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '/import.*firebase/d'
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '/import.*firestore/d'

# Fix common import patterns
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/import { doc, getDoc } from @\/lib\/hygraph/import { blogService } from @\/lib\/hygraph/g'

echo "✅ Import fixes completed!"