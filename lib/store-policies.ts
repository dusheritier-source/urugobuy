export const RETURN_WINDOW_DAYS = 30;
export const STORE_POLICIES = {
  shipping: {
    title: "Shipping information", path: "/shipping",
    text: "Shipping is available nationwide in Rwanda. Delivery estimates depend on your selected location and order size. Standard shipping costs 15 in the catalog currency, or is free when the subtotal after promotions is at least 100. Express shipping costs 30; pickup has no shipping fee. Exact arrival dates are not provided by the current delivery integration. Confirm the final options at checkout.",
  },
  returns: {
    title: "Returns and exchanges", path: "/returns",
    text: `Delivered items may be submitted for return within ${RETURN_WINDOW_DAYS} days after delivery, subject to review. Sign in and select your delivered order on the Returns page. Available requests are refund, replacement, or store credit. A submitted request does not guarantee approval or immediate reimbursement.`,
  },
  warranty: {
    title: "Warranty and support", path: "/contact",
    text: "Warranty coverage must be confirmed for the individual product. The catalog has no verified warranty-duration field. Contact Urugo support before buying if warranty coverage is essential; do not assume a duration or manufacturer coverage.",
  },
  contact: {
    title: "Contact Urugo", path: "/contact",
    text: "For store support contact hello@urugo.rw or +250 788 000 000. Use the Contact page for support. Do not share payment-card details or passwords in chat.",
  },
} as const;
