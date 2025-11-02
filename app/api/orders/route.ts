import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplier');
    const companyName = searchParams.get('companyName');
    
    console.log('Fetching orders for supplier ID:', supplierId);
    console.log('Company name:', companyName);
    
    if (!supplierId) {
      return NextResponse.json(
        { error: 'Supplier ID is required' },
        { status: 400 }
      );
    }

    // Helper function to enrich order items with product unit information
    const enrichOrderItems = async (items: any[]) => {
      const enrichedItems = await Promise.all(items.map(async (item) => {
        // If unit is already present, keep it
        if (item.unit) {
          return item;
        }
        
        // Otherwise, try to fetch from product
        try {
          const productDoc = await adminDb.collection('products').doc(item.productId).get();
          if (productDoc.exists) {
            const productData = productDoc.data();
            return {
              ...item,
              unit: productData?.unit || '單位'
            };
          }
        } catch (error) {
          console.log(`Could not fetch product ${item.productId}:`, error);
        }
        
        // Fallback to default unit
        return {
          ...item,
          unit: '單位'
        };
      }));
      
      return enrichedItems;
    };
    
    // Use supplier ID as the primary identifier
    const supplier = supplierId;

    console.log('Querying orders collection for supplier:', supplier);

    // Fetch ALL orders and filter by supplier (handles both ID and companyName)
    // This is necessary because orders may have supplier field set to either the ID or companyName
    let allOrdersSnapshot;
    try {
      allOrdersSnapshot = await adminDb
        .collection('orders')
        .orderBy('createdAt', 'desc')
        .get();
    } catch (error: any) {
      console.log('OrderBy failed, trying without orderBy:', error.message);
      allOrdersSnapshot = await adminDb.collection('orders').get();
    }

    // Filter orders that match the supplier (either by ID or companyName)
    const ordersWithSupplierField = allOrdersSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || null,
          updatedAt: data.updatedAt?.toDate?.() || null,
          deliveryDate: data.deliveryDate?.toDate?.() || null
        } as any;
      })
      .filter((orderData: any) => {
        // Check if order's top-level supplier field matches either ID or companyName
        const matchesId = orderData.supplier === supplierId;
        const matchesCompanyName = companyName && orderData.supplier === companyName;
        return matchesId || matchesCompanyName;
      })
      .map(orderData => {
        console.log('Order data:', {
          id: orderData.id,
          supplier: orderData.supplier,
          userId: orderData.userId,
          restaurantName: orderData.restaurantName
        });
        return orderData;
      });

    // Also check for orders where supplier is in items (for backward compatibility)
    console.log('Also checking for orders with supplier in items...');
    const additionalOrders = allOrdersSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || null,
          updatedAt: data.updatedAt?.toDate?.() || null,
          deliveryDate: data.deliveryDate?.toDate?.() || null
        } as any;
      })
      .filter((orderData: any) => {
        // Skip if already found via top-level supplier field
        const alreadyFound = ordersWithSupplierField.some(o => o.id === orderData.id);
        if (alreadyFound) return false;
        
        // Check if items contain the supplier (either ID or companyName)
        const hasSupplierInItems = orderData.items?.some((item: any) => 
          item.supplier === supplierId || item.supplier === companyName
        );
        if (hasSupplierInItems && !orderData.supplier) {
          console.log(`Order ${orderData.id} has supplier in items but not at top level`);
        }
        return hasSupplierInItems;
      });
    
    console.log(`Found ${additionalOrders.length} additional orders with supplier in items`);

    // Combine both sets and remove duplicates
    let orders = [...ordersWithSupplierField, ...additionalOrders];

    // Enrich all orders with product unit information
    orders = await Promise.all(orders.map(async (order) => ({
      ...order,
      items: await enrichOrderItems(order.items || [])
    })));

    // If we couldn't sort in the query, sort in memory
    if (orders.length > 0 && !orders[0].createdAt) {
      // Check if any order has createdAt to decide sorting
      const ordersWithDates = orders.filter(o => o.createdAt);
      if (ordersWithDates.length > 0) {
        orders.sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime; // Descending
        });
      }
    }

    console.log(`Found ${orders.length} orders for supplier ID "${supplierId}" and company "${companyName}"`);
    console.log(`  - ${ordersWithSupplierField.length} orders with top-level supplier field`);
    console.log(`  - ${additionalOrders.length} orders with supplier in items`);
    
    if (orders.length === 0) {
      console.log('No orders found. Checking sample orders in database...');
      const sampleSnapshot = await adminDb.collection('orders').limit(10).get();
      console.log(`Total orders in database: ${sampleSnapshot.size}`);
      sampleSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`Order ${doc.id} has supplier: "${data.supplier}"`);
        if (!data.supplier) {
          console.log(`  WARNING: Order ${doc.id} has NO top-level supplier field!`);
        }
      });
    }

    return NextResponse.json({ 
      orders,
      query: {
        supplier: supplier,
        found: orders.length
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Failed to fetch orders', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}