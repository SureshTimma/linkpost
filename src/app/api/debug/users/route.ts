import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// Debug endpoint to see user's LinkedIn connection data
export async function GET() {
  try {
    // Get all users to see their LinkedIn data structure
    const usersSnapshot = await adminDb
      .collection('users')
      .limit(5)
      .get();

    const users = [];

    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      users.push({
        id: doc.id,
        email: userData.email,
        name: `${userData.profile?.firstName || ''} ${userData.profile?.lastName || ''}`.trim(),
        linkedinConnected: !!userData.connectedAccounts?.linkedin?.connected,
        linkedinData: userData.connectedAccounts?.linkedin || 'Not connected',
        hasLinkedInProfile: !!userData.connectedAccounts?.linkedin?.profile
      });
    }

    return NextResponse.json({
      users: users,
      message: 'User LinkedIn connection data'
    });

  } catch (error) {
    console.error('Debug user API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
