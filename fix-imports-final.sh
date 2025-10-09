#!/bin/bash

echo "🔧 Final import syntax fix..."

# Fix the specific pattern that's causing issues
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/} from @\/lib\/hygraph/} from @\/lib\/hygraph/g'

# Fix any remaining malformed imports
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/from @\/lib\/hygraph/from @\/lib\/hygraph/g'

echo "✅ Final import fixes completed!"