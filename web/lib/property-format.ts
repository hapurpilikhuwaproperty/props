export function formatCompactPrice(value: number | string | null | undefined) {
  const price = Number(value || 0);
  if (!Number.isFinite(price) || price <= 0) return "Price on request";
  if (price >= 10_000_000) return `₹${(price / 10_000_000).toFixed(price % 10_000_000 === 0 ? 0 : 2)} Cr`;
  if (price >= 100_000) return `₹${(price / 100_000).toFixed(price % 100_000 === 0 ? 0 : 2)} L`;
  return `₹${price.toLocaleString("en-IN")}`;
}

export function formatPricePerSqft(price: number | string | null | undefined, area: number | string | null | undefined) {
  const amount = Number(price || 0);
  const sqft = Number(area || 0);
  if (!Number.isFinite(amount) || !Number.isFinite(sqft) || amount <= 0 || sqft <= 0) return null;
  return `₹${Math.round(amount / sqft).toLocaleString("en-IN")}/sq.ft`;
}
