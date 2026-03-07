# Vercel Blob Storage Setup

This application uses Vercel Blob Storage to store attendance photos (clock-in and clock-out images).

## Setup Instructions

### 1. Create a Vercel Blob Store

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Navigate to the **Storage** tab
3. Click **Create Database** or **Create Store**
4. Select **Blob** storage
5. Give it a name (e.g., "tera-payroll-photos")
6. Click **Create**

### 2. Get the Environment Variable

After creating the Blob store, Vercel will provide you with an environment variable:

```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxx
```

### 3. Add to Local Environment

Create or update your `.env` file in the project root:

```bash
BLOB_READ_WRITE_TOKEN=your_token_here
```

### 4. Add to Vercel Project

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add `BLOB_READ_WRITE_TOKEN` with your token value
4. Make sure it's available for all environments (Production, Preview, Development)

### 5. Redeploy

After adding the environment variable, redeploy your application:

```bash
vercel --prod
```

## How It Works

### Image Upload Flow

1. Part-timer takes a photo using the camera
2. Photo is captured as base64 data
3. Frontend sends base64 to `/api/upload-photo` endpoint
4. API converts base64 to buffer and uploads to Vercel Blob
5. Vercel Blob returns a public URL
6. URL is stored in the database (not the image data)

### Storage Structure

Images are organized in folders:
```
attendance/
  └── {partTimerId}/
      └── {eventId}/
          └── {date}/
              ├── clock-in-{timestamp}.jpg
              └── clock-out-{timestamp}.jpg
```

### API Endpoints

- **POST /api/upload-photo** - Upload a photo and get URL
- **DELETE /api/delete-photo** - Delete a photo by URL

## Benefits of Vercel Blob

✅ Automatic CDN distribution
✅ No size limits (pay as you go)
✅ Public URLs for easy access
✅ Integrated with Vercel deployments
✅ Fast global delivery
✅ Automatic optimization

## Cost

- First 1GB stored: Free
- Additional storage: $0.15/GB/month
- Bandwidth: First 100GB free per month

For a typical payroll app with ~100 employees taking 2 photos/day:
- ~200 photos/day × 30 days = 6,000 photos/month
- Average photo size: ~300KB
- Monthly storage: ~1.8GB = ~$0.12/month

Very affordable! 🎉
