# N8N Integration for Scheduled Posts

## Overview
This setup allows n8n to automatically process scheduled posts and publish them to LinkedIn at the specified time.

## Database Structure
All posts (immediate and scheduled) are now stored in the `posts` collection with the following structure:

```json
{
  "userId": "user123",
  "content": "Post content...",
  "platform": "linkedin",
  "status": "scheduled|published|failed",
  "type": "immediate|scheduled",
  "createdAt": "2025-08-21T10:00:00Z",
  "scheduleDate": "2025-08-21T14:00:00Z", // Only for scheduled posts
  "publishedAt": "2025-08-21T14:00:00Z", // Only after publishing
  "n8nProcessed": false, // Flag for n8n workflow
  "linkedinPostId": "post456" // After successful publishing
}
```

**Note**: LinkedIn credentials are fetched fresh from the user's account when processing, not stored in each post. This ensures:
- ✅ Better security (credentials in one place)
- ✅ Always fresh tokens (handles token refresh automatically)
- ✅ Cleaner database structure
- ✅ No credential duplication

## API Endpoints for N8N

### 1. GET `/api/n8n/posts` - Fetch Ready Posts
- **Purpose**: Get posts that are scheduled and ready to be published
- **Headers**: 
  - `x-n8n-api-key`: Your N8N API key
- **Response**: List of posts ready for processing with fresh LinkedIn credentials
- **Note**: The API automatically fetches current LinkedIn tokens from each user's account

### 2. POST `/api/n8n/posts` - Update Post Status
- **Purpose**: Update post status after n8n processes it
- **Headers**: 
  - `x-n8n-api-key`: Your N8N API key
- **Body**:
```json
{
  "postId": "doc123",
  "status": "published|failed",
  "linkedinPostId": "linkedin_post_id", // Optional, for successful posts
  "error": "Error message" // Optional, for failed posts
}
```

## N8N Workflow Setup

### 1. Schedule Trigger
- Use a **Cron** node to run every 5-10 minutes
- Expression: `*/5 * * * *` (every 5 minutes)

### 2. Fetch Ready Posts
- **HTTP Request** node
- Method: GET
- URL: `http://localhost:3000/api/n8n/posts`
- Headers:
  - `x-n8n-api-key`: `{{ $env.N8N_API_KEY }}`

### 3. Process Each Post
- **Split In Batches** node to process posts one by one
- For each post:

#### 3a. Post to LinkedIn
- **HTTP Request** node
- Method: POST
- URL: `https://api.linkedin.com/v2/ugcPosts`
- Headers:
  - `Authorization`: `Bearer {{ $json.linkedinAccessToken }}`
  - `Content-Type`: `application/json`
- Body:
```json
{
  "author": "urn:li:person:{{ $json.linkedinProfileId }}",
  "lifecycleState": "PUBLISHED",
  "specificContent": {
    "com.linkedin.ugc.ShareContent": {
      "shareCommentary": {
        "text": "{{ $json.content }}"
      },
      "shareMediaCategory": "NONE"
    }
  },
  "visibility": {
    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
  }
}
```

#### 3b. Update Post Status (Success)
- **HTTP Request** node (connected after successful LinkedIn post)
- Method: POST
- URL: `http://localhost:3000/api/n8n/posts`
- Headers:
  - `x-n8n-api-key`: `{{ $env.N8N_API_KEY }}`
- Body:
```json
{
  "postId": "{{ $json.id }}",
  "status": "published",
  "linkedinPostId": "{{ $responseJson.id }}"
}
```

#### 3c. Update Post Status (Failure)
- **HTTP Request** node (connected to error handling)
- Method: POST
- URL: `http://localhost:3000/api/n8n/posts`
- Headers:
  - `x-n8n-api-key`: `{{ $env.N8N_API_KEY }}`
- Body:
```json
{
  "postId": "{{ $json.id }}",
  "status": "failed",
  "error": "{{ $json.error }}"
}
```

## Environment Variables
Add to your `.env` file:
```
N8N_API_KEY=your-secure-n8n-api-key-here
```

## Testing
1. Create a scheduled post in the app
2. Check that it appears in the `posts` collection with `status: "scheduled"`
3. Run the n8n workflow manually to test
4. Verify the post gets published to LinkedIn
5. Check that the post status updates to `published` in the database

## Benefits
- ✅ All posts in one collection for easier management
- ✅ Posts include LinkedIn credentials for n8n to use
- ✅ Automatic status tracking (scheduled → published/failed)
- ✅ User post counts updated automatically
- ✅ Dashboard shows real data from database
- ✅ Failed posts can be retried or investigated
