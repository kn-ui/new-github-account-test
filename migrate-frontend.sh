#!/bin/bash

# Script to migrate frontend from Firebase to Hygraph

echo "🔄 Starting frontend migration from Firebase to Hygraph..."

# Find all TypeScript/TSX files that import from firestore
files=$(find src -name "*.tsx" -o -name "*.ts" | grep -v firestore.ts | grep -v firebase.ts | xargs grep -l "from.*firestore")

echo "📁 Found $(echo "$files" | wc -l) files to migrate"

# Replace firestore imports with hygraph imports
for file in $files; do
  echo "🔄 Migrating $file..."
  
  # Replace import statements
  sed -i 's/from.*firestore/from @\/lib\/hygraph/g' "$file"
  
  # Replace type references
  sed -i 's/FirestoreUser/HygraphUser/g' "$file"
  sed -i 's/FirestoreCourse/HygraphCourse/g' "$file"
  sed -i 's/FirestoreEnrollment/HygraphEnrollment/g' "$file"
  sed -i 's/FirestoreAssignment/HygraphAssignment/g' "$file"
  sed -i 's/FirestoreSubmission/HygraphSubmission/g' "$file"
  sed -i 's/FirestoreAnnouncement/HygraphAnnouncement/g' "$file"
  sed -i 's/FirestoreEvent/HygraphEvent/g' "$file"
  sed -i 's/FirestoreBlog/HygraphBlog/g' "$file"
  sed -i 's/FirestoreForumThread/HygraphForumThread/g' "$file"
  sed -i 's/FirestoreForumPost/HygraphForumPost/g' "$file"
  sed -i 's/FirestoreCertificate/HygraphCertificate/g' "$file"
  sed -i 's/FirestoreGrade/HygraphGrade/g' "$file"
  sed -i 's/FirestoreSupportTicket/HygraphSupportTicket/g' "$file"
  sed -i 's/FirestoreCourseMaterial/HygraphCourseMaterial/g' "$file"
  sed -i 's/FirestoreExam/HygraphExam/g' "$file"
  sed -i 's/FirestoreExamAttempt/HygraphExamAttempt/g' "$file"
  sed -i 's/FirestoreEditRequest/HygraphEditRequest/g' "$file"
  
  echo "✅ Migrated $file"
done

echo "🎉 Frontend migration completed!"
echo "📝 Note: You may need to manually review and fix some imports and type references"