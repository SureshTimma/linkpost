# N8N Integration for Scheduled Posts

## Overview
This setup allows n8n to automatically process scheduled posts and publish them to LinkedIn at the specified time.

## Local N8N Setup with Docker

### Prerequisites
- Docker installed on your machine
- Docker Compose (usually comes with Docker Desktop)

### 1. Create N8N Docker Setup

Create a new directory for N8N:
```bash
mkdir n8n-linkpost
cd n8n-linkpost
```

Create a `docker-compose.yml` file:
```yaml
version: '3.8'

services:
  n8n:
    image: docker.n8n.io/n8nio/n8n
    container_name: n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=your_secure_password
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - WEBHOOK_URL=http://localhost:5678/
      - GENERIC_TIMEZONE=America/New_York
      # Environment variables for your LinkPost integration
      - N8N_API_KEY=your-secure-n8n-api-key-here
      - LINKPOST_API_URL=http://host.docker.internal:3000
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - n8n_network

volumes:
  n8n_data:

networks:
  n8n_network:
    driver: bridge
```

### 2. Start N8N
```bash
docker-compose up -d
```

### 3. Access N8N
- Open browser and go to: `http://localhost:5678`
- Login with username: `admin` and the password you set in docker-compose.yml

### 4. Configure N8N Environment Variables
In N8N interface:
1. Go to Settings → Environment Variables
2. Add these variables:
   - `N8N_API_KEY`: `your-secure-n8n-api-key-here`
   - `LINKPOST_API_URL`: `http://host.docker.internal:3000`

### 5. Docker Commands Reference
```bash
# Start N8N
docker-compose up -d

# Stop N8N
docker-compose down

# View logs
docker-compose logs -f n8n

# Restart N8N
docker-compose restart

# Update N8N to latest version
docker-compose pull
docker-compose up -d
```

### 6. Network Configuration Notes
- `host.docker.internal:3000` allows N8N container to access your local LinkPost app
- If you're on Linux, you might need to use `172.17.0.1:3000` instead
- Make sure your LinkPost app is running on `http://localhost:3000`

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

### 1. Fetch Ready Posts
- **HTTP Request** node
- Method: GET
- URL: `{{ $env.LINKPOST_API_URL }}/api/n8n/posts`
- Headers:
  - `x-n8n-api-key`: `{{ $env.N8N_API_KEY }}`

### 2. Check if Posts Exist
- **IF** node
- Condition: `{{ $json.length > 0 }}`
- This prevents the workflow from continuing if no posts are ready

### 3. Process Each Post
- **Split In Batches** node to process posts one by one
- Set batch size to 1 to process posts sequentially
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
- URL: `{{ $env.LINKPOST_API_URL }}/api/n8n/posts`
- Headers:
  - `x-n8n-api-key`: `{{ $env.N8N_API_KEY }}`
  - `Content-Type`: `application/json`
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
- URL: `{{ $env.LINKPOST_API_URL }}/api/n8n/posts`
- Headers:
  - `x-n8n-api-key`: `{{ $env.N8N_API_KEY }}`
  - `Content-Type`: `application/json`
- Body:
```json
{
  "postId": "{{ $json.id }}",
  "status": "failed",
  "error": "{{ $json.error || 'Failed to post to LinkedIn' }}"
}
```

### Workflow Error Handling
- Add **Error Trigger** nodes to catch failures
- Connect error handling to the "Update Post Status (Failure)" node
- This ensures failed posts are marked appropriately in the database

## Environment Variables
Add to your `.env` file:
```
N8N_API_KEY=your-secure-n8n-api-key-here
```

## Testing the Integration

### 1. Start Both Applications
```bash
# Terminal 1: Start your LinkPost app
npm run dev

# Terminal 2: Start N8N with Docker
cd n8n-linkpost
docker-compose up -d
```

### 2. Test API Endpoints
Before setting up the workflow, test your API endpoints:

```bash
# Test GET endpoint (should return empty array initially)
curl -X GET http://localhost:3000/api/n8n/posts \
  -H "x-n8n-api-key: your-secure-n8n-api-key-here"

# Create a scheduled post through your app UI, then test again
```

### 3. Manual Workflow Testing
1. Create a scheduled post in the LinkPost app
2. Check that it appears in the `posts` collection with `status: "scheduled"`
3. In N8N interface, create and manually execute the workflow
4. Verify the post gets published to LinkedIn
5. Check that the post status updates to `published` in the database

### 4. Automated Testing
1. Set up the cron trigger for every 5 minutes
2. Create multiple scheduled posts with different times
3. Monitor the N8N executions and database updates
4. Check LinkedIn for published posts

## Troubleshooting

### Common Issues:

1. **N8N can't reach LinkPost app**
   - Make sure LinkPost is running on port 3000
   - On Linux, try changing `host.docker.internal` to `172.17.0.1`
   - Check firewall settings

2. **Authentication errors**
   - Verify N8N_API_KEY matches in both .env and N8N environment
   - Check API key headers in HTTP requests

3. **LinkedIn API errors**
   - Verify LinkedIn access tokens are valid
   - Check LinkedIn API rate limits
   - Ensure LinkedIn profile ID is correct

4. **Docker issues**
   - Run `docker-compose logs -f n8n` to see logs
   - Restart with `docker-compose restart`
   - Check Docker Desktop is running

### Debug Commands:
```bash
# Check N8N container status
docker ps

# View N8N logs
docker-compose logs -f n8n

# Access N8N container shell
docker exec -it n8n /bin/sh

# Check LinkPost app logs
npm run dev
```

## Benefits
- ✅ All posts in one collection for easier management
- ✅ Fresh LinkedIn credentials fetched automatically (no stale tokens)
- ✅ Automatic status tracking (scheduled → published/failed)
- ✅ User post counts updated automatically
- ✅ Dashboard shows real data from database
- ✅ Failed posts can be retried or investigated
- ✅ Docker containerization for easy N8N deployment
- ✅ Local development and testing capabilities
- ✅ Scalable architecture for production deployment

## Next Steps
1. Set up Docker and run the N8N container
2. Create your first workflow in N8N interface
3. Test with scheduled posts
4. Monitor executions and refine workflow
5. Consider production deployment options (cloud hosting, etc.)

## Production Considerations
- Use environment-specific API URLs
- Implement proper logging and monitoring
- Set up backup strategies for N8N data
- Consider using N8N Cloud for production
- Implement rate limiting and error retry logic
- Use secure API keys and rotate them regularly
