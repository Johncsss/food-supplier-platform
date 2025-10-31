import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const { orderId, itemIndex, newQuantity } = await request.json();
    
    console.log('Update order quantity request:', { orderId, itemIndex, newQuantity });
    
    if (!orderId || itemIndex === undefined || !newQuantity) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, itemIndex, newQuantity' },
        { status: 400 }
      );
    }

    if (newQuantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      );
    }

    // Get the order
    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderData = orderDoc.data();
    const items = orderData?.items || [];
    
    if (itemIndex >= items.length) {
      return NextResponse.json(
        { error: 'Invalid item index' },
        { status: 400 }
      );
    }

    // Update the quantity and total price for the item
    items[itemIndex].quantity = newQuantity;
    items[itemIndex].totalPrice = newQuantity * items[itemIndex].unitPrice;

    // Recalculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => sum + item.totalPrice, 0);

    // Update the order
    await orderRef.update({
      items,
      totalAmount,
      updatedAt: new Date()
    });

    console.log('Order quantity updated successfully');

    return NextResponse.json({
      success: true,
      message: '訂單數量已更新',
      updatedItem: items[itemIndex],
      totalAmount
    });
  } catch (error: any) {
    console.error('Error updating order quantity:', error);
    return NextResponse.json(
      { error: 'Failed to update order quantity', details: error.message },
      { status: 500 }
    );
  }
}
