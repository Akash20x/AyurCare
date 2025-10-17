"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { useAuthStore } from "@/stores/authStore";
import { Menu, User, Calendar, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Header() {
  const { user, isAuthenticated, logout, isLoading } = useAuthStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated === false) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {}
    router.push("/login");
  };

  const handleBookConsultation = () => {
    router.push("/explore");
  };

  return (
    <header className="w-full bg-white dark:bg-gray-950 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-green-700">
            AyurCare
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-6">
            <Link
              href="/explore"
              className="text-gray-700 dark:text-gray-200 hover:text-green-700 transition"
            >
              Find Doctors
            </Link>
            <Link
              href="/specializations"
              className="text-gray-700 dark:text-gray-200 hover:text-green-700 transition"
            >
              Specializations
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {!isAuthenticated ? (
              <Link href="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 cursor-pointer"
                >
                  <User className="w-4 h-4" />
                  Sign In
                </Button>
              </Link>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-full w-8 h-8 p-0 flex items-center justify-center"
                  >
                    <User className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuLabel>{user?.email || "My Account"}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer outline-none">
                      <Calendar className="w-4 h-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2 focus:text-red-700 cursor-pointer outline-none"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button
              size="sm"
              className="flex items-center gap-1 bg-green-700 hover:bg-green-600 text-white cursor-pointer"
              onClick={handleBookConsultation}
            >
              Book Consultation
            </Button>
          </div>

          {/* Mobile Drawer */}
          <div className="md:hidden flex items-center">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-700 dark:text-gray-200"
                >
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>

              {/* Drawer slides from top, full width */}
              <SheetContent
                side="top"
                className="w-full h-auto p-6 bg-white dark:bg-gray-950 shadow-lg [&_[data-radix-dialog-close]]:hidden"
              >
                {/* Hidden title for accessibility */}
                <SheetTitle className="sr-only">Mobile Menu</SheetTitle>

                {/* Header Row (Title + Built-in X) */}
                <div className="flex justify-between items-center border-b pb-3 mb-4 border-gray-400">
                  <h2 className="text-2xl font-bold text-green-700">AyurCare</h2>
                  {/* The built-in X is already added by ShadCN automatically */}
                   <SheetClose asChild>
                    <button
                      className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white text-3xl leading-none"
                      aria-label="Close menu"
                    >
                      ×
                    </button>
                  </SheetClose>
                </div>

                {/* Menu Links */}
                <div className="space-y-4">
                  <Link
                    href="/explore"
                    onClick={() => setOpen(false)}
                    className="block text-gray-800 dark:text-gray-200 text-base hover:text-green-700"
                  >
                    Find Doctors
                  </Link>

                  <Link
                    href="/specializations"
                    onClick={() => setOpen(false)}
                    className="block text-gray-800 dark:text-gray-200 text-base hover:text-green-700"
                  >
                    Specializations
                  </Link>

                  {isAuthenticated ? (
                    <>
                      <Link
                        href="/dashboard"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 text-gray-800 dark:text-gray-200 text-base hover:text-green-700"
                      >
                        <Calendar className="w-4 h-4" />
                        Dashboard
                      </Link>

                      <button
                        onClick={() => {
                          handleLogout();
                          setOpen(false);
                        }}
                        className="flex items-center gap-2 text-gray-800 dark:text-gray-200 text-base hover:text-red-700 w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 text-gray-800 dark:text-gray-200 text-base hover:text-green-700"
                    >
                      <User className="w-4 h-4" />
                      Sign In
                    </Link>
                  )}

                  <div className="mt-4">
                    <Button
                      className="w-full bg-green-700 hover:bg-green-600 text-white"
                      onClick={() => {
                        handleBookConsultation();
                        setOpen(false);
                      }}
                    >
                      Book Consultation
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
