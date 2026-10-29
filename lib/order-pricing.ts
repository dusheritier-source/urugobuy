export const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
export function orderTotals(lines: Array<{ unitPrice: number; quantity: number }>, method: "standard" | "express" | "pickup", discount = 0) {
  const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0));
  const discountedSubtotal = roundMoney(Math.max(0, subtotal - discount));
  const shipping = method === "express" ? 30 : method === "pickup" || discountedSubtotal >= 100 ? 0 : 15;
  const tax = roundMoney(discountedSubtotal * 0.18);
  return { subtotal, discount, shipping, tax, total: roundMoney(discountedSubtotal + shipping + tax) };
}
