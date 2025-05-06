"use client";
import LoginForm from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/notes');
    }
  }, [user, router]);

  if (user) { // Prevents rendering LoginForm if user is already defined (avoids flash)
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-foreground">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-accent/30 p-4">
      <LoginForm />
    </div>
  );
}
