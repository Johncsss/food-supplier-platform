import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface InvoiceData {
  orderId: string;
  orderDate: Date;
  customerName: string;
  customerEmail: string;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
}

export const generateInvoicePDF = async (invoiceData: InvoiceData): Promise<void> => {
  // Create a temporary HTML element for the invoice
  const invoiceElement = document.createElement('div');
  invoiceElement.style.position = 'absolute';
  invoiceElement.style.left = '-9999px';
  invoiceElement.style.top = '0';
  invoiceElement.style.width = '800px';
  invoiceElement.style.padding = '40px';
  invoiceElement.style.backgroundColor = 'white';
  invoiceElement.style.fontFamily = 'Arial, sans-serif';
  invoiceElement.style.fontSize = '14px';
  invoiceElement.style.lineHeight = '1.4';
  
  // Generate HTML content with Chinese characters
  invoiceElement.innerHTML = `
    <div style="margin-bottom: 30px;">
      <h1 style="font-size: 28px; color: #333; margin: 0 0 10px 0;">雲臺</h1>
      <p style="font-size: 16px; color: #666; margin: 0;">高質食品供應商</p>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">香港九龍彌敦道700號</p>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">電話: (852) 9890-9890</p>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">電郵: info@foodsupplierpro.com</p>
    </div>
    
    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 24px; color: #333; margin: 0;">發票 / Invoice</h2>
    </div>
    
    <div style="margin-bottom: 30px;">
      <p style="font-size: 14px; color: #666; margin: 5px 0;"><strong>發票編號:</strong> ${invoiceData.orderId}</p>
      <p style="font-size: 14px; color: #666; margin: 5px 0;"><strong>發票日期:</strong> ${invoiceData.orderDate.toLocaleDateString('zh-TW')}</p>
    </div>
    
    <div style="margin-bottom: 30px;">
      <h3 style="font-size: 18px; color: #333; margin: 0 0 15px 0;">客戶資料 / Customer Information</h3>
      <p style="font-size: 14px; color: #666; margin: 5px 0;"><strong>姓名:</strong> ${invoiceData.customerName}</p>
      <p style="font-size: 14px; color: #666; margin: 5px 0;"><strong>電郵:</strong> ${invoiceData.customerEmail}</p>
      <p style="font-size: 14px; color: #666; margin: 5px 0;"><strong>地址:</strong> ${invoiceData.deliveryAddress.street}</p>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">${invoiceData.deliveryAddress.city}, ${invoiceData.deliveryAddress.state} ${invoiceData.deliveryAddress.zipCode}</p>
    </div>
    
    <div style="margin-bottom: 30px;">
      <h3 style="font-size: 18px; color: #333; margin: 0 0 15px 0;">訂單項目 / Order Items</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">產品名稱</th>
            <th style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold;">數量</th>
            <th style="border: 1px solid #ddd; padding: 12px; text-align: right; font-weight: bold;">單價</th>
            <th style="border: 1px solid #ddd; padding: 12px; text-align: right; font-weight: bold;">總價</th>
          </tr>
        </thead>
        <tbody>
          ${invoiceData.items.map(item => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 12px;">${item.productName}</td>
              <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${item.quantity}</td>
              <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">$${item.unitPrice.toFixed(2)}</td>
              <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">$${item.totalPrice.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
         <div style="margin-bottom: 30px;">
       <div style="text-align: right;">
         <p style="font-size: 18px; color: #333; margin: 10px 0;"><strong>總計:</strong> $${invoiceData.total.toFixed(2)}</p>
       </div>
     </div>
    
    ${invoiceData.notes ? `
      <div style="margin-bottom: 30px;">
        <h3 style="font-size: 18px; color: #333; margin: 0 0 15px 0;">備註 / Notes</h3>
        <p style="font-size: 14px; color: #666; margin: 0;">${invoiceData.notes}</p>
      </div>
    ` : ''}
    
    <div style="margin-top: 40px; text-align: center; border-top: 1px solid #ddd; padding-top: 20px;">
      <p style="font-size: 14px; color: #666; margin: 0;">感謝您的惠顧！Thank you for your business!</p>
    </div>
  `;
  
  // Add the element to the document
  document.body.appendChild(invoiceElement);
  
  try {
    // Convert HTML to canvas
    const canvas = await html2canvas(invoiceElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });
    
    // Convert canvas to PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    // Save the PDF
    pdf.save(`invoice-${invoiceData.orderId}.pdf`);
  } finally {
    // Clean up
    document.body.removeChild(invoiceElement);
  }
}; 