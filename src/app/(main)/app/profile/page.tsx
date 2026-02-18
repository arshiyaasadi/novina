"use client";

import { useState, useEffect } from "react";
import { UserInfoSection } from "@/shared/components/profile/user-info-section";
import { VerificationSection } from "@/shared/components/profile/verification-section";
import { AppSettingsSection } from "@/shared/components/profile/app-settings-section";
import { NationalIdModal } from "@/shared/components/profile/national-id-modal";
import { useUserStore } from "@/shared/store/user-store";

// Mock last activity - will be fetched from API in the future
const mockLastActivity = "۲ روز پیش";

export default function ProfilePage() {
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    useUserStore.getState().hydrate();
  }, []);

  const verificationLevel = user?.nationalId ? "basic" : "none";

  const handleVerifyClick = () => {
    setIsModalOpen(true);
  };

  const handleNationalIdSubmit = (nationalId: string, username: string) => {
    // TODO: Call API to verify national ID and get user info (mobile, birthDate, etc.)
    // For now, update global user store with available fields; mobile and birthDate from API later
    setUser({
      mobile: user?.mobile ?? "",
      nationalId,
      firstName: user?.firstName ?? "علی",
      lastName: user?.lastName ?? "احمدی",
      birthDate: user?.birthDate ?? "",
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 p-4">
      <UserInfoSection
        firstName={user?.firstName ?? null}
        lastName={user?.lastName ?? null}
        username={null}
        onVerifyClick={handleVerifyClick}
      />

      {verificationLevel !== "none" && (
        <VerificationSection level={verificationLevel} />
      )}

      <AppSettingsSection lastActivity={mockLastActivity} />

      <NationalIdModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleNationalIdSubmit}
      />
    </div>
  );
}

