"use client";

import { useState, useEffect } from "react";
import { UserInfoSection } from "@/shared/components/profile/user-info-section";
import { VerificationSection } from "@/shared/components/profile/verification-section";
import { AppSettingsSection } from "@/shared/components/profile/app-settings-section";
import { NationalIdModal } from "@/shared/components/profile/national-id-modal";

// Mock data - will be fetched from API or context in the future
const initialUserData = {
  firstName: null as string | null,
  lastName: null as string | null,
  username: null as string | null,
  email: "ali.ahmadi@example.com",
};

// Mock last activity - will be fetched from API in the future
const mockLastActivity = "۲ روز پیش";

export default function ProfilePage() {
  const [userData, setUserData] = useState(initialUserData);
  const [verificationLevel, setVerificationLevel] = useState<"none" | "basic" | "advanced">("none");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load user data from localStorage on mount
  useEffect(() => {
    try {
      const savedUsername = localStorage.getItem("username");
      const savedNationalId = localStorage.getItem("nationalId");
      
      if (savedUsername) {
        setUserData(prev => ({
          ...prev,
          username: savedUsername,
        }));
      }
      
      if (savedNationalId) {
        setVerificationLevel("basic");
      }
    } catch (error) {
      console.error("Failed to load user data from localStorage:", error);
    }
  }, []);

  const handleVerifyClick = () => {
    setIsModalOpen(true);
  };

  const handleNationalIdSubmit = (nationalId: string, username: string) => {
    // Save to localStorage
    try {
      localStorage.setItem("username", username);
      localStorage.setItem("nationalId", nationalId);
    } catch (error) {
      console.error("Failed to save user data to localStorage:", error);
    }

    // TODO: Call API to verify national ID and get user info
    // For now, simulate getting user data from national ID
    setUserData({
      firstName: "علی",
      lastName: "احمدی",
      username: username,
      email: userData.email,
    });
    setVerificationLevel("basic");
  };

  return (
    <div className="space-y-6 p-4">
      <UserInfoSection
        firstName={userData.firstName}
        lastName={userData.lastName}
        username={userData.username}
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

