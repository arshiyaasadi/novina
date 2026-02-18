"use client";

import { PhoneLogin } from "@/shared/components/auth/phone-login";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleContinue = (phoneNumber: string) => {
    // TODO(phase2): Call API to send OTP
    console.log("Phone number:", phoneNumber);
  };

  const handleVerify = (otp: string) => {
    // TODO(phase2): Call API to verify OTP
    console.log("OTP:", otp);
    
    // Navigate to main app page after OTP verification
    router.push("/app");
  };

  return <PhoneLogin onContinue={handleContinue} onVerify={handleVerify} />;
}

