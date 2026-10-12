"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ForgotPassword from "../forgot-password/page";
import { useAuth } from "@clerk/nextjs";

export default function ResetPassword() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  return <ForgotPassword />;
}
