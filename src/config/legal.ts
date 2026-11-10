import { brand } from "./brand";

export type LegalPage = { slug: string; title: string; sections: { heading: string; body: string }[] };

/* DRAFT TEMPLATES. Have these reviewed for your country and business before launch.
   Fill every [BRACKET]. Do not publish placeholders. */
export const legalPages: LegalPage[] = [
  {
    slug: "terms",
    title: "Terms and conditions",
    sections: [
      { heading: "Who we are", body: `${brand.name} is operated by [LEGAL ENTITY NAME], [REGISTERED ADDRESS], [COMPANY NUMBER]. Contact: ${brand.supportEmail}.` },
      { heading: "What we sell", body: "We sell digital products delivered by email. Each product page describes what you receive, how to activate it and how long delivery takes. By ordering you confirm you have read that page." },
      { heading: "Independence", body: brand.disclaimer },
      { heading: "Orders and payment", body: "Orders are paid through our payment provider. An order is only accepted once the provider confirms the payment to us." },
      { heading: "Delivery", body: "Delivery details are sent to the email address entered at checkout. You are responsible for entering it correctly." },
      { heading: "Governing law", body: "[GOVERNING LAW AND COURTS]" },
    ],
  },
  {
    slug: "refunds",
    title: "Refund policy",
    sections: [
      { heading: "Before delivery", body: "If your order has not been delivered, you can ask for a full refund by contacting us with your order reference." },
      { heading: "After delivery", body: "Digital codes cannot be returned once delivered. If a code does not work as described on the product page, contact us within [NUMBER] days with your order reference and we will investigate and, where the code is faulty, replace it or refund you." },
      { heading: "Your statutory rights", body: "Nothing in this policy limits rights you have under consumer law. [ADD WITHDRAWAL-RIGHT WORDING FOR DIGITAL CONTENT REVIEWED FOR YOUR COUNTRY]" },
      { heading: "How to ask", body: `Email ${brand.supportEmail} with your order reference and a short description of the problem.` },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy policy",
    sections: [
      { heading: "What we collect", body: "Your email address and order details. Card details are handled by our payment provider and are never stored by us." },
      { heading: "Why we use it", body: "To take payment, deliver your order, provide support and meet legal obligations." },
      { heading: "Who we share it with", body: "Our payment provider, our email delivery provider and our database host, only to run the store. [LIST PROCESSORS]" },
      { heading: "Analytics and ads", body: "[DESCRIBE ANY ANALYTICS OR ADVERTISING COOKIES AND HOW CONSENT IS COLLECTED]" },
      { heading: "Your rights", body: `You can ask us to access, correct or delete your data by emailing ${brand.supportEmail}. [ADD SUPERVISORY AUTHORITY DETAILS]` },
    ],
  },
  {
    slug: "contact",
    title: "Contact",
    sections: [
      { heading: "Support", body: `Email ${brand.supportEmail}. Please include your order reference, which is shown on the confirmation page and in your delivery email.` },
      { heading: "Business details", body: "[LEGAL ENTITY NAME], [REGISTERED ADDRESS]" },
    ],
  },
];
