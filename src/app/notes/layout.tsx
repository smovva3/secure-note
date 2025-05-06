"use client";
import NotesHeader from "@/components/NotesHeader";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
            <Skeleton className="h-8 w-40" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </header>
        <main className="container mx-auto py-8 px-4">
          <Skeleton className="h-10 w-1/4 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NotesHeader />
      <main className="flex-grow container mx-auto py-8 px-4">
        {children}
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} SecureNote. All rights reserved.
      </footer>
    </div>
  );
}
