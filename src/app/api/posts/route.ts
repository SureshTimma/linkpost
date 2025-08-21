import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authHeader.replace('Bearer ', '');

    // Fetch published posts
    const publishedPostsSnapshot = await adminDb
      .collection('posts')
      .where('userId', '==', userId)
      .where('status', '==', 'published')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const publishedPosts = publishedPostsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate().toISOString(),
      publishedAt: doc.data().publishedAt?.toDate().toISOString(),
      scheduleDate: doc.data().scheduleDate?.toDate().toISOString()
    }));

    // Fetch scheduled posts
    const scheduledPostsSnapshot = await adminDb
      .collection('posts')
      .where('userId', '==', userId)
      .where('status', '==', 'scheduled')
      .orderBy('scheduleDate', 'asc')
      .limit(10)
      .get();

    const scheduledPosts = scheduledPostsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate().toISOString(),
      publishedAt: doc.data().publishedAt?.toDate().toISOString(),
      scheduleDate: doc.data().scheduleDate?.toDate().toISOString()
    }));

    // Get total counts
    const totalPublishedSnapshot = await adminDb
      .collection('posts')
      .where('userId', '==', userId)
      .where('status', '==', 'published')
      .count()
      .get();

    const totalScheduledSnapshot = await adminDb
      .collection('posts')
      .where('userId', '==', userId)
      .where('status', '==', 'scheduled')
      .count()
      .get();

    return NextResponse.json({
      publishedPosts,
      scheduledPosts,
      stats: {
        totalPublished: totalPublishedSnapshot.data().count,
        totalScheduled: totalScheduledSnapshot.data().count
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
