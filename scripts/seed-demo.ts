// Creates the grader's demo account from DEMO_EMAIL / DEMO_PASSWORD in .env.local.
// Run with: npm run db:seed-demo
import { auth } from "../lib/auth.ts";

const email = process.env.DEMO_EMAIL;
const password = process.env.DEMO_PASSWORD;

if (!email || !password) {
  console.error("Set DEMO_EMAIL and DEMO_PASSWORD in .env.local first.");
  process.exit(1);
}

try {
  await auth.api.signUpEmail({ body: { email, password, name: "Demo User" } });
  console.log(`Created demo account ${email}.`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (/exist/i.test(message)) {
    console.log(`Demo account ${email} already exists.`);
  } else {
    console.error("Could not create demo account:", message);
    process.exit(1);
  }
}

process.exit(0);
