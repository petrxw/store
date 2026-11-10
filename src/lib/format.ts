import { brand } from "@/config/brand";

const formatter = new Intl.NumberFormat(brand.locale, { style: "currency", currency: brand.currency });

export const formatPrice = (amount: number) => formatter.format(amount);

/** Line total computed in cents to avoid floating point drift. */
export const lineTotal = (price: number, qty: number) => (Math.round(price * 100) * qty) / 100;
