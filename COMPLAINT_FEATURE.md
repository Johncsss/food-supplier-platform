# Complaint Feature Implementation

## Overview
This feature allows restaurants to submit complaints to suppliers about their orders, and enables suppliers to view and manage these complaints.

## Features Implemented

### 1. Restaurant Side (消費者端 /dashboard/orders)
- Added a "投訴" (Complaint) button to each order
- Clicking the button opens a modal where restaurants can:
  - View the supplier they're complaining about
  - Write a detailed complaint message
  - Submit the complaint to the supplier

### 2. Supplier Side (供應商系統 /supplier)
- Added a new "投訴" (Complaints) menu item in the sidebar
- Created a new complaints page at `/supplier/complaints` where suppliers can:
  - View all complaints received from restaurants
  - See complaint status (pending, read, resolved)
  - View complaint details including order ID, restaurant name, date, and message

## Files Created/Modified

### New Files
1. `components/ui/ComplaintModal.tsx` - Modal component for submitting complaints
2. `app/api/create-complaint/route.ts` - API endpoint for creating complaints
3. `app/api/complaints/route.ts` - API endpoint for fetching complaints
4. `app/supplier/complaints/page.tsx` - Supplier complaints page

### Modified Files
1. `types/index.ts` - Added Complaint interface
2. `app/dashboard/orders/page.tsx` - Added complaint button to orders
3. `app/supplier/page.tsx` - Added complaints menu item to sidebar
4. `app/supplier/orders/page.tsx` - Added complaints menu item to sidebar
5. `firestore.rules` - Added security rules for complaints collection

## Database Structure

### Complaints Collection
```typescript
interface Complaint {
  id: string;
  orderId: string;           // Order the complaint is about
  userId: string;            // Restaurant user ID
  userEmail: string;         // Restaurant email
  restaurantName: string;    // Restaurant name
  supplierId: string;        // Supplier user ID
  supplierCompanyName: string; // Supplier company name
  message: string;           // Complaint message
  status: 'pending' | 'read' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}
```

## API Endpoints

### POST /api/create-complaint
Creates a new complaint from a restaurant to a supplier.

**Request Body:**
```json
{
  "orderId": "string",
  "message": "string",
  "userId": "string",
  "userEmail": "string",
  "restaurantName": "string",
  "supplierId": "string",
  "supplierCompanyName": "string"
}
```

### GET /api/complaints?supplierId={supplierId}
Fetches all complaints for a specific supplier.

**Response:**
```json
{
  "success": true,
  "complaints": [...]
}
```

## Security Rules
- Restaurants can create complaints for their orders
- Suppliers can read complaints where they are the `supplierId`
- Admins have full access
- Complaints are linked to orders to verify authenticity

## UI/UX Features
- Clean, intuitive modal for submitting complaints
- Clear visual indicators (red theme for complaints)
- Status badges showing complaint state
- Responsive design for mobile and desktop
- Loading states and error handling
- Toast notifications for user feedback

## Usage

### For Restaurants:
1. Go to Dashboard > Orders (/dashboard/orders)
2. Find the order you want to complain about
3. Click the "投訴" (Complaint) button
4. Fill in the complaint details
5. Click "提交投訴" (Submit Complaint)

### For Suppliers:
1. Login to Supplier Panel (/supplier)
2. Click "投訴" (Complaints) in the sidebar
3. View all complaints from restaurants
4. Each complaint shows:
   - Order ID
   - Restaurant name
   - Date/time
   - Complaint message
   - Status

## Future Enhancements (Optional)
- Mark complaints as read/resolved
- Reply to complaints
- Attach files/images to complaints
- Email notifications for new complaints
- Complaint analytics for suppliers
