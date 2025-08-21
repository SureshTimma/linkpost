import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// Debug endpoint to see all posts in the database
export async function GET() {
  try {
    // Get all posts to debug
    const allPostsSnapshot = await adminDb
      .collection('posts')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const posts = [];

    for (const doc of allPostsSnapshot.docs) {
      const postData = doc.data();
      posts.push({
        id: doc.id,
        userId: postData.userId,
        content: postData.content?.substring(0, 50) + '...' || 'No content',
        status: postData.status,
        type: postData.type,
        platform: postData.platform,
        scheduleDate: postData.scheduleDate?.toDate?.()?.toISOString() || 'No schedule date',
        n8nProcessed: postData.n8nProcessed,
        createdAt: postData.createdAt?.toDate?.()?.toISOString() || 'No created date',
        hasScheduleDate: !!postData.scheduleDate,
        isScheduled: postData.status === 'scheduled',
        isN8nNotProcessed: postData.n8nProcessed === false,
        scheduleVsNow: postData.scheduleDate ? {
          scheduleTime: postData.scheduleDate.toDate().getTime(),
          currentTime: new Date().getTime(),
          isReady: postData.scheduleDate.toDate() <= new Date()
        } : 'No schedule date'
      });
    }

    return NextResponse.json({
      totalPosts: posts.length,
      posts: posts,
      currentTime: new Date().toISOString(),
      debug: {
        scheduledPosts: posts.filter(p => p.status === 'scheduled').length,
        unprocessedPosts: posts.filter(p => p.n8nProcessed === false).length,
        readyPosts: posts.filter(p => 
          p.status === 'scheduled' && 
          p.n8nProcessed === false && 
          p.scheduleVsNow !== 'No schedule date' &&
          typeof p.scheduleVsNow === 'object' &&
          p.scheduleVsNow.isReady
        ).length
      }
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
