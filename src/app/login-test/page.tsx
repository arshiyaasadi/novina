"use client";

import { PhoneLogin } from "@/shared/components/auth/phone-login";

export default function LoginTestPage() {
  const handleContinue = (phoneNumber: string) => {
    console.log("Phone number:", phoneNumber);
  };

  return <PhoneLogin onContinue={handleContinue} />;
}

