import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import { addPointsToUser } from '@/app/api/purchase-points/route';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe signature' },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('Payment intent succeeded:', paymentIntent.id);
        
        // Check if this is a points purchase
        if (paymentIntent.metadata?.type === 'points_purchase') {
          const userId = paymentIntent.metadata.userId;
          const pointsAmount = parseInt(paymentIntent.metadata.pointsAmount);
          
          if (userId && pointsAmount) {
            try {
              await addPointsToUser(userId, pointsAmount, paymentIntent.id);
              console.log(`Successfully added ${pointsAmount} points to user ${userId}`);
            } catch (error) {
              console.error('Error adding points to user:', error);
              // Note: In production, you might want to implement retry logic here
            }
          }
        }
        break;

      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('Checkout session completed:', session.id);
        // Here you would typically update your database with the subscription info
        break;

      case 'customer.subscription.created':
        const subscription = event.data.object;
        console.log('Subscription created:', subscription.id);
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object;
        console.log('Subscription updated:', updatedSubscription.id);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        console.log('Subscription deleted:', deletedSubscription.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
} 