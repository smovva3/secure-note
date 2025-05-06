
"use client";
import { LogOut, Notebook, PlusCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function NotesHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/notes" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
          <Notebook className="h-7 w-7" aria-hidden="true" />
          <h1 className="text-2xl font-bold">SecureNote</h1>
        </Link>
        <div className="flex items-center gap-4">
          {user && <span className="text-sm text-muted-foreground hidden sm:inline" aria-label={`Logged in as ${user.username}`}>Welcome, {user.username}</span>}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant="ghost" size="icon" className="text-primary hover:bg-primary/10">
                  <Link href="/notes/create" aria-label="Create New Note">
                    <PlusCircle className="h-6 w-6" aria-hidden="true" />
                    <span className="sr-only">Create New Note</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create New Note</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={logout} className="text-destructive hover:bg-destructive/10" aria-label="Logout">
                  <LogOut className="h-6 w-6" aria-hidden="true" />
                  <span className="sr-only">Logout</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Logout</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
}
