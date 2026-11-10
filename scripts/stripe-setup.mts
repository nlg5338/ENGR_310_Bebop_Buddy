// Creates the Pro price and the $1-first-month promo code in Stripe.
// Safe to run more than once. Run with: npm run stripe:setup
// Uses STRIPE_SECRET_KEY, so run it once with your test key and again with your live key.
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("Set STRIPE_SECRET_KEY in .env.local first.");
  process.exit(1);
}
const stripe = new Stripe(key);
console.log(`Using Stripe ${key.startsWith("sk_live") ? "LIVE" : "test"} mode.`);

// 1. Pro: $6/month
const prices = await stripe.prices.list({ lookup_keys: ["pro_monthly"], limit: 1 });
if (prices.data[0]) {
  console.log("Pro price already exists.");
} else {
  const product = await stripe.products.create({
    name: "Bebop Buddy Pro",
    description: "Unlimited AI-written solos and the full lesson path.",
  });
  await stripe.prices.create({
    product: product.id,
    unit_amount: 600,
    currency: "usd",
    recurring: { interval: "month" },
    lookup_key: "pro_monthly",
  });
  console.log("Created Bebop Buddy Pro at $6/month.");
}

// 2. Coupon: $5 off the first month, so the first payment is $1
const COUPON_ID = "first-month-1";
try {
  await stripe.coupons.retrieve(COUPON_ID);
  console.log("First-month coupon already exists.");
} catch {
  await stripe.coupons.create({
    id: COUPON_ID,
    name: "First month for $1",
    amount_off: 500,
    currency: "usd",
    duration: "once",
  });
  console.log("Created coupon: $5 off the first month.");
}

// 3. Promo code customers type at checkout
const CODE = "FIRSTMONTH";
const codes = await stripe.promotionCodes.list({ code: CODE, active: true, limit: 1 });
if (codes.data[0]) {
  console.log(`Promo code ${CODE} already exists.`);
} else {
  await stripe.promotionCodes.create({
    code: CODE,
    promotion: { type: "coupon", coupon: COUPON_ID },
    restrictions: { first_time_transaction: true },
  });
  console.log(`Created promo code ${CODE} (first month $1, new customers only).`);
}
