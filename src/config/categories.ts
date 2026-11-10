export type Category = {
  slug: string;
  name: string;
  blurb: string;
  theme: "default" | "gold";
};

export const categories: Category[] = [
  {
    slug: "pirate-shop",
    name: "Pirate Shop Rewards",
    blurb: "Pirate Shop tokens. Every listing shows its activation steps and delivery details before you pay.",
    theme: "default",
  },
  {
    slug: "golden-asap-rocky",
    name: "Golden A$AP Rocky",
    blurb: "A premium listing with its own activation guide and delivery information.",
    theme: "gold",
  },
  {
    slug: "v-bucks",
    name: "V-Bucks",
    blurb: "V-Bucks in several denominations. Check the platform and region on each product before you buy.",
    theme: "default",
  },
  {
    slug: "rare-cosmetics",
    name: "Rare Gaming Cosmetics",
    blurb: "Search and filter cosmetic collections. Items appear here only when we are permitted to sell them.",
    theme: "default",
  },
];

export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);
