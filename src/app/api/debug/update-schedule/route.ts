import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// Debug endpoint to update a scheduled post's time to past (for testing)
export async function POST() {
  try {
    // Update the first scheduled post to have a past date
    const scheduledPostsSnapshot = await adminDb
      .collection('posts')
      .where('status', '==', 'scheduled')
      .limit(1)
      .get();

    if (scheduledPostsSnapshot.empty) {
      return NextResponse.json({ error: 'No scheduled posts found' });
    }

    const firstPost = scheduledPostsSnapshot.docs[0];
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago

    await adminDb.collection('posts').doc(firstPost.id).update({
      scheduleDate: fiveMinutesAgo
    });

    return NextResponse.json({ 
      success: true,
      message: 'Updated post schedule to 5 minutes ago',
      postId: firstPost.id,
      newScheduleDate: fiveMinutesAgo.toISOString()
    });

  } catch (error) {
    console.error('Update schedule error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
