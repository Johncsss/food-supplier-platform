import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import {
  DEFAULT_POINTS_PLANS,
  normalizePointsPlans,
  NormalizedPointsPlan,
} from '@/lib/points-plans';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const docRef = adminDb.collection('admin').doc('pointsSettings');
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return NextResponse.json(
        {
          success: true,
          plans: DEFAULT_POINTS_PLANS,
          source: 'default',
        },
        { status: 200 },
      );
    }

    const data = snapshot.data() ?? {};
    const plans = normalizePointsPlans(data.plans ?? [], { includeDisabled: false });

    if (plans.length === 0) {
      return NextResponse.json(
        {
          success: true,
          plans: DEFAULT_POINTS_PLANS,
          source: 'default',
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        plans,
        source: 'firestore',
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Failed to load points plans:', error);
    return NextResponse.json(
      {
        success: true,
        plans: DEFAULT_POINTS_PLANS,
        source: 'fallback',
        error: error?.message ?? 'Unknown error',
      },
      { status: 200 },
    );
  }
}

