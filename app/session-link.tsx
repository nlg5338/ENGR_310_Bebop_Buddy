"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";

type Target = { href: string; label: string };

/**
 * A link that changes when someone is logged in, so the static homepage
 * can say "Dashboard" instead of "Log in" without becoming a dynamic page.
 */
export function SessionLink({ loggedIn, loggedOut, className }: {
  loggedIn: Target;
  loggedOut: Target;
  className?: string;
}) {
  const { data: session } = authClient.useSession();
  const target = session ? loggedIn : loggedOut;
  return (
    <Link href={target.href} className={className}>
      {target.label}
    </Link>
  );
}
