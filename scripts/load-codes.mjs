// Loads verified codes for one product. Run from the project root:
//   npm run load-codes -- <product-slug> <file-with-one-code-per-line>
// Codes are encrypted before they leave your machine. Duplicates are skipped.
import { readFileSync } from "node:fs";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

try { process.loadEnvFile(".env.local"); } catch {}

const [slug, file] = process.argv.slice(2);
if (!slug || !file) {
  console.error("Usage: npm run load-codes -- <product-slug> <codes-file>");
  process.exit(1);
}

const raw = process.env.CODE_ENCRYPTION_KEY;
const key = raw ? Buffer.from(raw, "base64") : null;
if (!key || key.length !== 32) {
  console.error("CODE_ENCRYPTION_KEY must be 32 bytes, base64 encoded.");
  process.exit(1);
}

const encrypt = (plain) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), enc.toString("base64")].join(":");
};
const hash = (plain) => crypto.createHmac("sha256", key).update(plain).digest("hex");

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data: product } = await db.from("products").select("id, name").eq("slug", slug).maybeSingle();
if (!product) {
  console.error(`No product with slug "${slug}".`);
  process.exit(1);
}

const codes = [...new Set(readFileSync(file, "utf8").split(/\r?\n/).map((l) => l.trim()).filter(Boolean))];
const rows = codes.map((c) => ({ product_id: product.id, encrypted_code: encrypt(c), code_hash: hash(c) }));

let inserted = 0;
for (let i = 0; i < rows.length; i += 200) {
  const { data, error } = await db
    .from("digital_inventory")
    .upsert(rows.slice(i, i + 200), { onConflict: "product_id,code_hash", ignoreDuplicates: true })
    .select("id");
  if (error) {
    console.error("Insert failed:", error.message);
    process.exit(1);
  }
  inserted += data?.length ?? 0;
}
console.log(`${product.name}: ${inserted} new codes added, ${codes.length - inserted} duplicates skipped.`);
