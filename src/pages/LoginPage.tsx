import LoginForm from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/notes', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading || user) { // Prevents rendering LoginForm if loading or user is already defined
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
