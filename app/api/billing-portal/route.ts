import { auth } from "@/lib/auth";
import { getStripe } from "@/lib/billing";
import { db } from "@/lib/db";

/** Opens Stripe's customer portal, where Pro users can cancel or update their card. */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Please log in." }, { status: 401 });

  const { rows } = await db.query<{ stripe_customer_id: string }>(
    `SELECT stripe_customer_id FROM subscription WHERE user_id = $1`,
    [session.user.id],
  );
  if (!rows[0]) return Response.json({ error: "No subscription found." }, { status: 404 });

  const portal = await getStripe().billingPortal.sessions.create({
    customer: rows[0].stripe_customer_id,
    return_url: `${new URL(request.url).origin}/dashboard`,
  });
  return Response.json({ url: portal.url });
}
