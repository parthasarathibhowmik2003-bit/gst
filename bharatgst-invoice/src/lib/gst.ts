export interface GSTBreakdown {
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export function calculateGST(
  price: number, 
  quantity: number, 
  gstRate: number, 
  isInterState: boolean = false
): GSTBreakdown {
  const taxableValue = price * quantity;
  const gstAmount = (taxableValue * gstRate) / 100;

  if (isInterState) {
    return {
      taxableValue,
      cgst: 0,
      sgst: 0,
      igst: gstAmount,
      total: taxableValue + gstAmount
    };
  } else {
    return {
      taxableValue,
      cgst: gstAmount / 2,
      sgst: gstAmount / 2,
      igst: 0,
      total: taxableValue + gstAmount
    };
  }
}

export function calculateTotals(items: any[], isInterState: boolean = false) {
  return items.reduce((acc, item) => {
    const calc = calculateGST(item.price, item.quantity, item.gstRate, isInterState);
    return {
      subtotal: acc.subtotal + calc.taxableValue,
      cgst: acc.cgst + calc.cgst,
      sgst: acc.sgst + calc.sgst,
      igst: acc.igst + calc.igst,
      grandTotal: acc.grandTotal + calc.total
    };
  }, { subtotal: 0, cgst: 0, sgst: 0, igst: 0, grandTotal: 0 });
}
