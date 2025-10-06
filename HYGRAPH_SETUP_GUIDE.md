# Hygraph Setup Guide

## Issue Fixed

The `setup:hygraph` script was failing because it was trying to use GraphQL queries (`me` and `projects`) that don't exist in the current Hygraph Management API.

**Changes Made:**
1. ✅ Removed the problematic `getProjectInfo()` function that used invalid queries
2. ✅ Simplified the script to require `HYGRAPH_ENVIRONMENT_ID` to be set manually
3. ✅ Added better error messages with clear setup instructions
4. ✅ Updated `.env.example` with required environment variables

## Setup Instructions

### Step 1: Create `.env` File

Copy the example file:
```bash
cp .env.example .env
```

### Step 2: Get Your Hygraph Management Token

1. Go to your Hygraph Dashboard: https://app.hygraph.com/
2. Navigate to **Settings** > **API Access** > **Permanent Auth Tokens**
3. Click **Create token** (or use an existing one)
4. Give it a name like "Management API Token"
5. Enable these permissions:
   - ✅ Read models
   - ✅ Create models
   - ✅ Update models
   - ✅ Read enumerations
   - ✅ Create enumerations
   - ✅ Update enumerations
6. Copy the token and add it to your `.env` file:
   ```
   HYGRAPH_MANAGEMENT_TOKEN=your_token_here
   ```

### Step 3: Get Your Environment ID

1. In your Hygraph Dashboard, go to **Settings** > **Environments**
2. You should see your environment (usually called "master")
3. Copy the **ID** (it's in UUID format, like `cm1a2b3c4d5e6f7g8h9i0j1k2`)
4. Add it to your `.env` file:
   ```
   HYGRAPH_ENVIRONMENT_ID=your_environment_id_here
   ```

### Step 4: Run the Setup Script

```bash
npm run setup:hygraph
```

## Expected Output

When successful, you should see:
```
🚀 Setting up Hygraph Schema for St. Raguel School Management System

✅ Using environment ID: cm...

📋 Creating Enumerations...
  Creating enumeration: User Role
  Creating enumeration: Enrollment Status
  ...

✅ Enumerations created successfully

🏗️ Creating Models...
  Creating model: User
  Creating model: Course
  ...

✅ Models created successfully

🔗 Creating Relations...
📋 Relations to create manually in Hygraph dashboard (XX total):
  ...

✅ Schema setup completed!
```

## Troubleshooting

### Error: "Missing HYGRAPH_MANAGEMENT_TOKEN"
- Make sure you created a `.env` file (not `.env.example`)
- Ensure the token is correctly copied without extra spaces
- Verify the token has management permissions

### Error: "Missing HYGRAPH_ENVIRONMENT_ID"
- Go to Settings > Environments in Hygraph
- Copy the ID (not the name) of your environment
- The ID should be in UUID format

### Error: "GraphQL Error: Unauthorized"
- Your token might not have sufficient permissions
- Create a new token with management permissions
- Make sure you're using the Management API token (not a regular content API token)

## Next Steps After Setup

After the script completes successfully:

1. **Create Relations Manually**: The script will output a list of relations you need to create in the Hygraph dashboard
2. **Set Up Content Permissions**: Configure who can read/write content
3. **Generate Content API Tokens**: Create tokens for your application to use
4. **Test with Sample Data**: Add some test data to verify everything works

## Additional Resources

- [Hygraph Management API Documentation](https://hygraph.com/docs/api-reference/management-api)
- [Hygraph Schema Documentation](https://hygraph.com/docs/api-reference/schema)
- [Hygraph Permanent Auth Tokens](https://hygraph.com/docs/api-reference/basics/authorization#permanent-auth-tokens)
