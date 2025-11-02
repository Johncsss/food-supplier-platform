import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import admin, { adminDb, adminFieldValue } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    console.log('Order creation API called');
    const { items, totalAmount, user } = await request.json();
    
    console.log('Received order data:', {
      itemCount: items?.length || 0,
      totalAmount,
      userId: user?.id,
      firebaseUid: user?.firebaseUid,
      userEmail: user?.email,
      restaurantName: user?.restaurantName,
      source: 'mobile-app'
    });
    console.log('Full user object:', JSON.stringify(user, null, 2));

    if (!items || items.length === 0) {
      console.error('No items in order');
      return NextResponse.json(
        { error: 'No items in order' },
        { status: 400 }
      );
    }

    if (!user) {
      console.error('User not authenticated');
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    if (!user.id) {
      console.error('User ID missing');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Extract supplier from items (all items should be from the same supplier)
    const supplier = items[0]?.supplier || '';
    
    console.log('Order supplier:', supplier);
    
    if (!supplier) {
      console.error('Supplier information missing from items');
      return NextResponse.json(
        { error: 'Supplier information is required' },
        { status: 400 }
      );
    }

    // Create order object for Firestore
    const orderData = {
      userId: user.id,
      firebaseUid: user.firebaseUid || user.id, // Ensure we have both userId and firebaseUid
      userEmail: user.email || '',
      restaurantName: user.restaurantName || '',
      supplier: supplier, // Add supplier to order
      items: items.map((item: any) => ({
        productId: item.productId || '',
        productName: item.productName || '',
        quantity: item.quantity || 0,
        unitPrice: item.unitPrice || 0,
        totalPrice: item.totalPrice || 0,
        imageUrl: item.imageUrl || '',
        unit: item.unit || ''
      })),
      totalAmount: totalAmount || 0,
      status: 'pending',
      deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      deliveryAddress: user.address || {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      },
      notes: '',
      source: 'mobile-app', // Add source to track where the order came from
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Generate custom order ID with three sections
    const orderId = `ORDER-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    // Use Admin SDK to create the order (bypasses security rules)
    console.log('Creating order in Firestore with ID:', orderId);
    console.log('Order data to be saved:', {
      orderId,
      userId: orderData.userId,
      firebaseUid: orderData.firebaseUid,
      userEmail: orderData.userEmail,
      itemCount: orderData.items.length,
      totalAmount: orderData.totalAmount
    });
    
    try {
      await adminDb.collection('orders').doc(orderId).set(orderData);
      console.log('New order created successfully with ID:', orderId);
      console.log('Order data saved:', {
        orderId,
        userId: orderData.userId,
        firebaseUid: orderData.firebaseUid,
        userEmail: orderData.userEmail,
        itemCount: orderData.items.length,
        totalAmount: orderData.totalAmount,
        status: orderData.status,
        source: orderData.source
      });
    } catch (firestoreError) {
      console.error('Firestore error:', firestoreError);
      throw new Error(`Failed to save order to database: ${firestoreError instanceof Error ? firestoreError.message : 'Unknown error'}`);
    }

    return NextResponse.json({ 
      success: true, 
      orderId: orderId,
      message: '訂單已成功創建'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    return NextResponse.json(
      { error: 'Failed to create order', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 