"use client";

import { PhoneLogin } from "@/shared/components/auth/phone-login";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleContinue = (phoneNumber: string) => {
    // TODO: Call API to send OTP
    console.log("Phone number:", phoneNumber);
  };

  const handleVerify = (otp: string) => {
    // TODO: Call API to verify OTP
    console.log("OTP:", otp);
    
    // Mock routing based on OTP
    if (otp === "0000") {
      // Navigate to risk assessment questions
      router.push("/risk-assessment");
    } else if (otp === "1111") {
      // Navigate to app page
      router.push("/app");
    } else {
      // For other OTPs, verify normally (TODO: implement actual API call)
      console.log("Verifying OTP:", otp);
      // After successful verification, navigate to app
      // router.push("/app");
    }
  };

  return <PhoneLogin onContinue={handleContinue} onVerify={handleVerify} />;
}

