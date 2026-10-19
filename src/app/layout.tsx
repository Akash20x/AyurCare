import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { GoogleIdentityProvider } from "@/components/providers/GoogleIdentityProvider";
import Header from "@/components/layout/Header"; 
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "AyurCare",
  description: "Book Ayurvedic consultations with trusted practitioners.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <GoogleIdentityProvider>
          <AuthProvider>
            <Header />
            <a
              href="#main-content"
              className="sr-only fixed left-4 top-4 z-[100] rounded-md bg-white px-4 py-2 font-medium text-green-800 shadow focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-green-700"
            >
              Skip to main content
            </a>
            <main id="main-content">{children}</main>
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </GoogleIdentityProvider>
      </body>
    </html>
  );
}
