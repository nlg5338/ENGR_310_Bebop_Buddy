"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
  }

  return (
    <button type="button" className="btn btn-ghost" onClick={handleSignOut}>
      Log out
    </button>
  );
}
