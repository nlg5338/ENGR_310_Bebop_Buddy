import Stripe from "stripe";
import { db } from "./db.ts";

// The $6/month Pro price, found by this key (created by `npm run stripe:setup`).
export const PRO_PRICE_LOOKUP_KEY = "pro_monthly";

let stripe: Stripe | null = null;
// Created on first use so builds work without STRIPE_SECRET_KEY.
export const getStripe = () => (stripe ??= new Stripe(process.env.STRIPE_SECRET_KEY as string));

/** Finds this user's Stripe customer, creating one the first time they check out. */
export async function getOrCreateCustomer(user: { id: string; email: string; name: string }): Promise<string> {
  const { rows } = await db.query<{ stripe_customer_id: string }>(
    `SELECT stripe_customer_id FROM subscription WHERE user_id = $1`,
    [user.id],
  );
  if (rows[0]) return rows[0].stripe_customer_id;

  const customer = await getStripe().customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId: user.id },
  });
  await db.query(
    `INSERT INTO subscription (user_id, stripe_customer_id, status) VALUES ($1, $2, 'none')`,
    [user.id, customer.id],
  );
  return customer.id;
}

/** Copies a customer's latest subscription from Stripe into our database. */
export async function syncCustomer(customerId: string) {
  const { data } = await getStripe().subscriptions.list({ customer: customerId, status: "all", limit: 1 });
  const sub = data[0];
  const periodEnd = sub?.items.data[0]?.current_period_end;

  await db.query(
    `UPDATE subscription
        SET stripe_subscription_id = $2,
            status = $3,
            current_period_end = $4,
            cancel_at_period_end = $5,
            updated_at = now()
      WHERE stripe_customer_id = $1`,
    [
      customerId,
      sub?.id ?? null,
      sub?.status ?? "none",
      periodEnd ? new Date(periodEnd * 1000) : null,
      sub?.cancel_at_period_end ?? false,
    ],
  );
}
