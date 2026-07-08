"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * BPlen HUB — Step Journey Index 🧬🛡️
 * Redirects the member to their current active stage.
 */
export default function JourneyIndex() {
  const router = useRouter();

  useEffect(() => {
    // In the future, this will check Firestore for the last active step.
    // For now, default to onboarding.
    router.replace("/hub/journey/onboarding");
  }, [router]);

  return null;
}
