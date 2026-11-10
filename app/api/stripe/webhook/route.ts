import type Stripe from "stripe";
import { getStripe, syncCustomer } from "@/lib/billing";

// Stripe calls this whenever a subscription starts, renews, changes, or is canceled.
const SUBSCRIPTION_EVENTS = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
]);

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return new Response("Webhook not configured", { status: 400 });

  // Verify the event really came from Stripe.
  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(await request.text(), signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (SUBSCRIPTION_EVENTS.has(event.type)) {
    const object = event.data.object as { customer?: string | { id: string } | null };
    const customer = typeof object.customer === "string" ? object.customer : object.customer?.id;
    if (customer) await syncCustomer(customer);
  }

  return Response.json({ received: true });
}
