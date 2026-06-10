import { NextRequest, NextResponse } from 'next/server';
import admin, { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supplierId = body?.supplierId;
    const offDates = Array.isArray(body?.offDates) ? body.offDates : [];
    const weeklyOffDays = Array.isArray(body?.weeklyOffDays) ? body.weeklyOffDays : [];
    const autoPublicHolidays = Boolean(body?.autoPublicHolidays);
    const holidayOverrides = Array.isArray(body?.holidayOverrides) ? body.holidayOverrides : [];
    const deliveryTimes = Array.isArray(body?.deliveryTimes) 
      ? body.deliveryTimes.filter((time: any) => typeof time === 'string' && time.trim() !== '')
      : (typeof body?.deliveryTime === 'string' && body.deliveryTime ? [body.deliveryTime] : []);

    if (!supplierId || typeof supplierId !== 'string') {
      return NextResponse.json({ error: '缺少供應商識別碼' }, { status: 400 });
    }

    await adminDb
      .collection('supplierDeliverySettings')
      .doc(supplierId)
      .set(
        {
          offDates,
          weeklyOffDays,
          autoPublicHolidays,
          holidayOverrides,
          deliveryTimes,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save supplier delivery settings', error);
    return NextResponse.json({ error: '儲存失敗，請稍後再試' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId');

    if (!supplierId) {
      return NextResponse.json({ error: '缺少供應商識別碼' }, { status: 400 });
    }

    const snap = await adminDb.collection('supplierDeliverySettings').doc(supplierId).get();
    if (!snap.exists) {
      return NextResponse.json({
        offDates: [],
        weeklyOffDays: [],
        autoPublicHolidays: false,
        holidayOverrides: [],
        deliveryTimes: [],
      });
    }

    const data = snap.data() || {};
    // Support both old format (deliveryTime) and new format (deliveryTimes)
    const deliveryTimes = Array.isArray(data.deliveryTimes) 
      ? data.deliveryTimes.filter((time: any) => typeof time === 'string' && time.trim() !== '')
      : (typeof data.deliveryTime === 'string' && data.deliveryTime ? [data.deliveryTime] : []);
    
    return NextResponse.json({
      offDates: Array.isArray(data.offDates) ? data.offDates : [],
      weeklyOffDays: Array.isArray(data.weeklyOffDays) ? data.weeklyOffDays : [],
      autoPublicHolidays: Boolean(data.autoPublicHolidays),
      holidayOverrides: Array.isArray(data.holidayOverrides) ? data.holidayOverrides : [],
      deliveryTimes,
      updatedAt: data.updatedAt?.toDate?.() ?? null,
    });
  } catch (error) {
    console.error('Failed to load supplier delivery settings', error);
    return NextResponse.json(
      { error: '無法載入供應商送貨設定，請稍後再試' },
      { status: 500 },
    );
  }
}

