import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Invoice, BusinessProfile } from '../types';
import { formatCurrency } from './utils';

export const exportInvoiceToPDF = (invoice: Invoice, profile: BusinessProfile) => {
  const doc = new jsPDF();
  const primaryColor = [10, 37, 64]; // Deep Blue
  const accentColor = [0, 200, 83]; // Accent Green

  // Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(profile.businessName || 'TAX INVOICE', 15, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('GSTIN: ' + (profile.gstin || 'N/A'), 15, 33);

  // Business Details (Right aligned in header)
  doc.setFontSize(10);
  doc.text(profile.phone || '', 195, 20, { align: 'right' });
  doc.text(profile.email || '', 195, 25, { align: 'right' });
  doc.text(profile.address || '', 195, 30, { align: 'right' });

  // Invoice Meta
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 15, 55);
  
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.customerName, 15, 62);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('GSTIN: ' + (invoice.customerGstin || 'Unregistered'), 15, 67);
  doc.text(invoice.customerAddress || '', 15, 72, { maxWidth: 60 });

  // Invoice Details (Right)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Details:', 130, 55);
  
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice No: ${invoice.invoiceNumber}`, 130, 62);
  doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, 130, 67);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 130, 72);

  // Table
  const tableRows = invoice.items.map((item, index) => [
    index + 1,
    item.name,
    item.quantity,
    formatCurrency(item.price),
    `${item.gstRate}%`,
    formatCurrency(item.quantity * item.price * (1 + item.gstRate / 100))
  ]);

  (doc as any).autoTable({
    startY: 85,
    head: [['#', 'Description', 'Qty', 'Price', 'GST %', 'Total']],
    body: tableRows,
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 15, right: 15 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Totals
  const totalsX = 140;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', totalsX, finalY);
  doc.text(formatCurrency(invoice.subtotal), 195, finalY, { align: 'right' });
  
  doc.text('CGST:', totalsX, finalY + 7);
  doc.text(formatCurrency(invoice.cgstTotal), 195, finalY + 7, { align: 'right' });
  
  doc.text('SGST:', totalsX, finalY + 14);
  doc.text(formatCurrency(invoice.sgstTotal), 195, finalY + 14, { align: 'right' });
  
  if (invoice.igstTotal > 0) {
    doc.text('IGST:', totalsX, finalY + 21);
    doc.text(formatCurrency(invoice.igstTotal), 195, finalY + 21, { align: 'right' });
  }

  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(totalsX - 5, finalY + 25, 75, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Grand Total:', totalsX, finalY + 33);
  doc.text(formatCurrency(invoice.grandTotal), 195, finalY + 33, { align: 'right' });

  // Bank & QR (Mocking space for QR if you want to add it as image)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(11);
  doc.text('Payment Details:', 15, finalY);
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Bank: ${profile.bankName || 'N/A'}`, 15, finalY + 7);
  doc.text(`A/c: ${profile.accountNumber || 'N/A'}`, 15, finalY + 12);
  doc.text(`IFSC: ${profile.ifscCode || 'N/A'}`, 15, finalY + 17);
  doc.text(`UPI: ${profile.upiId || 'N/A'}`, 15, finalY + 22);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Generated via BharatGST Invoice - Modern Invoicing for India', 105, 285, { align: 'center' });

  doc.save(`${invoice.invoiceNumber}_${invoice.customerName}.pdf`);
};
