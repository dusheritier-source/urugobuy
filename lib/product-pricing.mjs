export const sellingPrice = (product) =>
  Math.round(product.price * (1 - Math.max(0, Math.min(100, product.discount)) / 100) * 100) / 100;

export const shouldNotifyPriceDrop = (subscriptionPrice, currentPrice, stock) =>
  Number.isFinite(subscriptionPrice) && Number.isFinite(currentPrice) && stock > 0 && currentPrice < subscriptionPrice;
