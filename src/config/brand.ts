/* Change the store name, currency and contact details here. Everything else reads from this file. */
const name = "NEXORA";

export const brand = {
  name,
  tagline: "Your next level starts here.",
  description: "Discover exclusive gaming rewards and digital products.",
  currency: "EUR",
  locale: "en-IE",
  // Replace before launch.
  supportEmail: "support@example.com",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  maxQtyPerLine: 10,
  disclaimer: `${name} is an independent store. It is not affiliated with, endorsed by or sponsored by Epic Games, Inc. Fortnite and V-Bucks are trademarks of Epic Games, Inc.`,
} as const;
