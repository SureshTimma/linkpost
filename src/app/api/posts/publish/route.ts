import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

interface PostRequest {
  content: string;
  scheduleDate?: string;
  publishNow?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: PostRequest = await request.json();
    const { content, scheduleDate, publishNow } = body;

    // Get session from request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract user ID from authorization header (you might need to adjust this based on your auth setup)
    const userId = authHeader.replace('Bearer ', '');

    // Get user data from Firestore
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    if (!userData) {
      return NextResponse.json({ error: 'User data not found' }, { status: 404 });
    }
    
    // Check if user has LinkedIn connection
    if (!userData.connectedAccounts?.linkedin?.accessToken) {
      return NextResponse.json({ error: 'LinkedIn not connected' }, { status: 400 });
    }

    // Check posts remaining
    const postsUsed = userData.subscription?.postsUsed || 0;
    const postsLimit = userData.subscription?.postsLimit || 5;
    if (postsUsed >= postsLimit) {
      return NextResponse.json({ error: 'No posts remaining' }, { status: 400 });
    }

    if (publishNow) {
      // Publish immediately to LinkedIn
      const linkedinResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userData.connectedAccounts.linkedin.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          author: `urn:li:person:${userData.connectedAccounts.linkedin.profileId}`,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: content
              },
              shareMediaCategory: 'NONE'
            }
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
          }
        })
      });

      if (!linkedinResponse.ok) {
        const errorData = await linkedinResponse.text();
        console.error('LinkedIn API error:', errorData);
        return NextResponse.json({ 
          error: 'Failed to publish to LinkedIn',
          details: errorData 
        }, { status: 500 });
      }

      // Decrement posts remaining
      await adminDb.collection('users').doc(userId).update({
        'subscription.postsUsed': (userData.subscription?.postsUsed || 0) + 1
      });

      // Save post data to database
      const postData = {
        userId,
        content,
        publishedAt: new Date(),
        platform: 'linkedin',
        status: 'published',
        type: 'immediate',
        createdAt: new Date(),
        linkedinPostId: linkedinResponse.headers.get('x-restli-id') || 'unknown' // LinkedIn returns post ID in headers
      };

      await adminDb.collection('posts').add(postData);

      return NextResponse.json({ 
        success: true, 
        message: 'Post published to LinkedIn successfully',
        postId: postData.linkedinPostId
      });

    } else if (scheduleDate) {
      // Schedule the post for later
      const scheduledPostData = {
        userId,
        content,
        scheduleDate: new Date(scheduleDate),
        platform: 'linkedin',
        status: 'scheduled',
        type: 'scheduled',
        createdAt: new Date()
      };

      // Save scheduled post to database
      const docRef = await adminDb.collection('scheduledPosts').add(scheduledPostData);

      return NextResponse.json({ 
        success: true, 
        message: 'Post scheduled successfully',
        scheduledPostId: docRef.id
      });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
