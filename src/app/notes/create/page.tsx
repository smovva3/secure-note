"use client";
import CreateNoteForm from "@/components/notes/CreateNoteForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CreateNotePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Button asChild variant="outline" className="mb-6 text-primary border-primary hover:bg-primary/10">
        <Link href="/notes">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Notes
        </Link>
      </Button>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Create New Note</CardTitle>
          <CardDescription className="text-muted-foreground">
            Fill in the details below to add a new note to your collection.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateNoteForm />
        </CardContent>
      </Card>
    </div>
  );
}
