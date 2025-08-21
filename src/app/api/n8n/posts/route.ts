import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// GET: Fetch posts ready to be published (for n8n to process)
export async function GET(request: NextRequest) {
  try {
    const n8nApiKey = request.headers.get('x-n8n-api-key');
    
    // Simple API key authentication for n8n
    if (n8nApiKey !== process.env.N8N_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get scheduled posts (simplified query to avoid composite index)
    const readyPostsSnapshot = await adminDb
      .collection('posts')
      .where('status', '==', 'scheduled')
      .where('n8nProcessed', '==', false)
      .limit(100) // Get more to filter in memory
      .get();

    const readyPosts = [];

    for (const doc of readyPostsSnapshot.docs) {
      const postData = doc.data();
      
      // Check if the post is actually ready to be published (filter in memory)
      const scheduleDate = postData.scheduleDate?.toDate();
      const now = new Date();
      
      if (!scheduleDate || scheduleDate > now) {
        continue; // Skip posts not yet ready
      }
      
      // Fetch fresh user credentials for each post
      const userDoc = await adminDb.collection('users').doc(postData.userId).get();
      const userData = userDoc.data();
      
      if (userData?.connectedAccounts?.linkedin?.accessToken) {
        readyPosts.push({
          id: doc.id,
          userId: postData.userId,
          content: postData.content,
          scheduleDate: postData.scheduleDate.toDate().toISOString(),
          linkedinAccessToken: userData.connectedAccounts.linkedin.accessToken,
          linkedinProfileId: userData.connectedAccounts.linkedin.profileId,
          platform: postData.platform,
          createdAt: postData.createdAt.toDate().toISOString()
        });
      } else {
        // Mark posts without valid LinkedIn connection as failed
        await adminDb.collection('posts').doc(doc.id).update({
          status: 'failed',
          publishError: 'LinkedIn account not connected or token expired',
          n8nProcessed: true,
          processedAt: new Date()
        });
      }
    }

    return NextResponse.json({
      posts: readyPosts,
      count: readyPosts.length
    });

  } catch (error) {
    console.error('n8n API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST: Update post status after n8n processes it
export async function POST(request: NextRequest) {
  try {
    const n8nApiKey = request.headers.get('x-n8n-api-key');
    
    // Simple API key authentication for n8n
    if (n8nApiKey !== process.env.N8N_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { postId, status, linkedinPostId, error: publishError } = body;

    if (!postId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const baseUpdateData = {
      n8nProcessed: true,
      processedAt: new Date()
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let updateData: any = baseUpdateData;

    if (status === 'published') {
      updateData = {
        ...baseUpdateData,
        status: 'published',
        publishedAt: new Date(),
        ...(linkedinPostId && { linkedinPostId })
      };
    } else if (status === 'failed') {
      updateData = {
        ...baseUpdateData,
        status: 'failed',
        publishError: publishError || 'Unknown error'
      };
    }

    // Update the post
    await adminDb.collection('posts').doc(postId).update(updateData);

    // If published, also update user's post count
    if (status === 'published') {
      const postDoc = await adminDb.collection('posts').doc(postId).get();
      if (postDoc.exists) {
        const postData = postDoc.data();
        if (postData?.userId) {
          await adminDb.collection('users').doc(postData.userId).update({
            'subscription.postsUsed': (postData.subscription?.postsUsed || 0) + 1
          });
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Post ${status} successfully`
    });

  } catch (error) {
    console.error('n8n update API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
