export function isValidStripeSecretKey(key?: string | null): boolean {
  if (!key) return false;
  if (key.includes('...') || key.includes('changeme')) return false;
  return /^sk_(test|live)_[A-Za-z0-9]+$/.test(key);
}

export function isValidStripePriceId(priceId?: string | null): boolean {
  if (!priceId) return false;
  if (priceId.includes('...')) return false;
  return /^price_[A-Za-z0-9]+$/.test(priceId);
}
