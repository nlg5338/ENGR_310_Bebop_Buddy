import { auth } from "@/lib/auth";
import { getOrCreateCustomer, getStripe, PRO_PRICE_LOOKUP_KEY } from "@/lib/billing";
import { getPlan } from "@/lib/db";

/** Starts a Stripe Checkout for Pro and returns the URL to send the user to. */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Please log in." }, { status: 401 });
  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: "Payments aren't set up yet." }, { status: 503 });
  }
  if ((await getPlan(session.user.id)).pro) {
    return Response.json({ error: "You're already on Pro." }, { status: 400 });
  }

  const stripe = getStripe();
  const { data: prices } = await stripe.prices.list({ lookup_keys: [PRO_PRICE_LOOKUP_KEY], limit: 1 });
  if (!prices[0]) {
    return Response.json({ error: "The Pro price isn't set up yet (run npm run stripe:setup)." }, { status: 503 });
  }

  const origin = new URL(request.url).origin;
  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: await getOrCreateCustomer(session.user),
    client_reference_id: session.user.id,
    line_items: [{ price: prices[0].id, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${origin}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/dashboard?checkout=canceled`,
  });

  return Response.json({ url: checkout.url });
}
