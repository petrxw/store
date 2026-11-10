export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string | null;
  active: boolean;
  featured: boolean;
  stock_quantity: number;
  attributes: Record<string, string>;
  activation_instructions: string | null;
  delivery_info: string | null;
};

export type Review = {
  id: string;
  author_name: string;
  rating: number;
  body: string;
  created_at: string;
};

export type PaymentStatus = "pending" | "paid" | "failed" | "expired" | "refunded" | "flagged";
export type DeliveryStatus = "pending" | "awaiting_manual" | "allocated" | "sending" | "delivered" | "failed";
