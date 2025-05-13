import type { Metadata } from 'next'; // Keep for reference, but not directly used by React CSR
import { Geist, Geist_Mono } from 'next/font/google'; // Keep font setup, will need manual integration if not using Next
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import NotesLayout from './layouts/NotesLayout';
import NotesListPage from './pages/NotesListPage';
import CreateNotePage from './pages/CreateNotePage';
import EditNotePage from './pages/EditNotePage';
import NoteDetailsPage from './pages/NoteDetailsPage';
import HomePage from './pages/HomePage';
import { AuthProvider, useAuth } from './hooks/useAuth'; // AuthProvider to wrap routes

// Font setup might need to be handled differently in a non-Next.js app (e.g., via CSS import)
// For simplicity, we'll assume the CSS variables are set up in globals.css or index.html for now.
// const geistSans = Geist({
//   variable: '--font-geist-sans',
//   subsets: ['latin'],
// });

// const geistMono = Geist_Mono({
//   variable: '--font-geist-mono',
//   subsets: ['latin'],
// });


// This metadata object is Next.js specific and won't apply directly.
// Document title can be set using `document.title` or a library like react-helmet-async.
// export const metadata: Metadata = {
//   title: 'SecureNote',
//   description: 'A secure note-taking application.',
// };


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    // You can return a loading spinner here
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}


export default function App() {
  // The dark mode script from Next.js's RootLayout is now in public/index.html's <head>

  return (
    // <div className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
    // Font class variables would typically be on <html> or <body>, set up via globals.css or index.html
    <div className="antialiased bg-background text-foreground font-sans"> {/* Apply font family via Tailwind config or globals */}
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/notes"
            element={
              <ProtectedRoute>
                <NotesLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<NotesListPage />} />
            <Route path="create" element={<CreateNotePage />} />
            <Route path=":id" element={<NoteDetailsPage />} />
            <Route path="edit/:id" element={<EditNotePage />} />
          </Route>
          {/* Add a catch-all or 404 route if desired */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </div>
  );
}
