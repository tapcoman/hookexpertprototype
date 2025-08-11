# Firebase Configuration Troubleshooting Guide

## Current Issue
Getting 500 errors on `/api/auth/verify` and `/api/users/profile` endpoints after adding Firebase environment variables to Vercel.

## New Diagnostic Tools Added

### 1. Debug Endpoints (Available in Development)
Use these endpoints to diagnose Firebase configuration issues:

#### GET `/api/debug/firebase`
Comprehensive Firebase configuration diagnostic:
```bash
curl https://your-vercel-app.vercel.app/api/debug/firebase
```

#### GET `/api/debug/firebase/test-auth`
Test Firebase authentication connectivity:
```bash
curl https://your-vercel-app.vercel.app/api/debug/firebase/test-auth
```

#### POST `/api/debug/firebase/validate-token`
Test a specific Firebase token:
```bash
curl -X POST https://your-vercel-app.vercel.app/api/debug/firebase/validate-token \
  -H "Content-Type: application/json" \
  -d '{"token":"your-firebase-token-here"}'
```

### 2. Enhanced Logging
The Firebase service now provides detailed logging during initialization. Check Vercel logs for:
- Service account key validation
- Private key format checking
- Project ID matching
- Firebase Admin SDK initialization steps

## Step-by-Step Troubleshooting

### Step 1: Enable Debug Routes on Vercel
Add environment variable in Vercel dashboard:
```
ENABLE_DEBUG_ROUTES=true
```

### Step 2: Run Firebase Diagnostic
Visit: `https://your-app.vercel.app/api/debug/firebase`

This will tell you:
- Which environment variables are missing
- If the service account key is valid JSON
- If all required fields are present
- If the private key format is correct
- If project IDs match

### Step 3: Check Common Issues

#### Issue 1: Invalid JSON Format
**Symptoms:** JSON parse errors in logs
**Solution:** Ensure the service account key is properly formatted JSON:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

#### Issue 2: Private Key Format
**Symptoms:** "Private key does not appear to be in valid format"
**Solution:** Ensure the private key contains `\n` characters:
- Should start with `-----BEGIN PRIVATE KEY-----\n`
- Should end with `\n-----END PRIVATE KEY-----\n`
- Should have `\n` characters throughout

#### Issue 3: Project ID Mismatch
**Symptoms:** "Project ID mismatch" errors
**Solution:** Ensure both environment variables match:
- `FIREBASE_PROJECT_ID` should match `project_id` in service account key

#### Issue 4: Missing Required Fields
**Symptoms:** "Service account key missing required fields"
**Solution:** Ensure service account key has all required fields:
- `type`
- `project_id` 
- `private_key_id`
- `private_key`
- `client_email`

### Step 4: Test Token Validation
If Firebase initializes successfully but token validation fails:

1. Get a valid Firebase token from your frontend
2. Test it using: `POST /api/debug/firebase/validate-token`
3. Check the response for specific error codes

### Step 5: Check Vercel Environment Variables
Verify in Vercel dashboard that:
1. `FIREBASE_PROJECT_ID` is set correctly
2. `FIREBASE_SERVICE_ACCOUNT_KEY` is set as the full JSON (not base64 encoded)
3. Variables are deployed to the correct environment (Production/Preview)

## Environment Variable Setup in Vercel

### Correct Format for Service Account Key:
```json
{"type":"service_account","project_id":"your-project-id","private_key_id":"abc123","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xyz@your-project.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xyz%40your-project.iam.gserviceaccount.com"}
```

### Important Notes:
1. **Do NOT** base64 encode the service account key
2. **Do NOT** add extra quotes around the JSON
3. **Do** ensure newlines are represented as `\n` in the private key
4. **Do** redeploy after changing environment variables

## Enhanced Health Check
The `/api/health` endpoint now provides detailed Firebase service status. Check it to see if Firebase is properly initialized.

## Getting Help
If issues persist after following this guide:

1. Check Vercel function logs for detailed error messages
2. Run the diagnostic endpoints to get specific error details
3. Verify your Firebase project settings and service account permissions
4. Consider regenerating the service account key from the Firebase console

## Security Note
Remember to:
- Remove `ENABLE_DEBUG_ROUTES=true` from production after troubleshooting
- Rotate your service account keys regularly
- Monitor authentication logs for suspicious activity