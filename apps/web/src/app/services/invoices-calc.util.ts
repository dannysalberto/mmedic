/**
 * Utilidad frontend de cálculo con redondeo a 3 decimales (ROUND_HALF_UP)
 */

export function round3Decimals(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

export function calculateInvoiceItem(
  basePrice: number,
  quantity: number,
  appliesVat: boolean,
  vatRate = 0.16,
): {
  basePrice: number;
  vatAmount: number;
  subtotal: number;
  total: number;
} {
  const roundedBasePrice = round3Decimals(basePrice);
  const roundedQuantity = round3Decimals(quantity);

  const unitVat = appliesVat ? round3Decimals(roundedBasePrice * vatRate) : 0;
  const unitSubtotal = round3Decimals(roundedBasePrice + unitVat);
  const itemTotal = round3Decimals(unitSubtotal * roundedQuantity);

  return {
    basePrice: roundedBasePrice,
    vatAmount: unitVat,
    subtotal: unitSubtotal,
    total: itemTotal,
  };
}

export function calculateInvoiceTotals(items: {
  basePrice: number;
  vatAmount: number;
  quantity: number;
  total: number;
}[]): {
  subtotal: number;
  vatAmount: number;
  total: number;
} {
  let subtotalSum = 0;
  let vatSum = 0;
  let totalSum = 0;

  for (const item of items) {
    subtotalSum += round3Decimals(item.basePrice * item.quantity);
    vatSum += round3Decimals(item.vatAmount * item.quantity);
    totalSum += round3Decimals(item.total);
  }

  return {
    subtotal: round3Decimals(subtotalSum),
    vatAmount: round3Decimals(vatSum),
    total: round3Decimals(totalSum),
  };
}
