"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { clinicContent } from "@/config/clinic-content";
import { TBDText } from "@/components/ui/tbd-badge";

export interface NavbarProps {
  onBookClick?: () => void;
}

export function Navbar({ onBookClick }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [visible, setVisible] = React.useState(true);
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const lastScrollY = React.useRef(0);

  const menuRef = React.useRef<HTMLDivElement>(null);
  const toggleBtnRef = React.useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // Scroll listener for progress bar and shrink / hide-on-scroll-down
  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(totalHeight > 0 ? (currentScrollY / totalHeight) * 100 : 0);
      setScrolled(currentScrollY > 40);

      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setVisible(false); // Hide on scroll down
      } else {
        setVisible(true); // Reappear on scroll up
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
        toggleBtnRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Treatments", href: "/services" },
    { label: "Our Dentists", href: "/dentists" },
    { label: "Smile Gallery", href: "/gallery" },
    { label: "Blog", href: "/blog" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/contact" },
    { label: "Patient Portal", href: "/portal" },
  ];

  return (
    <>
      {/* Top Deep Teal Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 right-0 h-1 bg-primary z-50 pointer-events-none transition-all"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      />

      <header
        className={`sticky top-0 z-40 w-full border-b border-border transition-all duration-300 ${
          visible ? "translate-y-0" : "-translate-y-full"
        } ${scrolled ? "bg-card/85 backdrop-blur-md shadow-sm h-16" : "bg-background/95 backdrop-blur-xs h-20"}`}
      >
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 transition-all duration-300 ${scrolled ? "h-16" : "h-20"}`}>
        {/* Brand Logo / Identity */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-foreground font-serif text-xl sm:text-2xl font-bold tracking-tight rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 p-1"
        >
          <span className="h-9 w-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-serif text-lg font-bold shadow-xs">
            D
          </span>
          <span className="flex flex-col leading-none">
            <TBDText
              value={clinicContent.clinic.brandName}
              fallbackKey="clinic_brand"
              className="text-base sm:text-lg font-serif font-bold text-foreground"
            />
            <span className="text-[10px] font-sans uppercase tracking-widest text-secondary font-semibold mt-0.5">
              Dental Excellence
            </span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          className="hidden lg:flex items-center gap-1 xl:gap-2"
          aria-label="Main Navigation"
        >
          {navLinks.map((link) => {
            const currentPath = pathname || "";
            const isActive =
              currentPath === link.href ||
              (link.href !== "/" && currentPath.startsWith(link.href));
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`px-3 py-2 text-sm font-medium transition-colors duration-fast rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                  isActive
                    ? "text-primary font-semibold bg-accent/30"
                    : "text-foreground hover:text-primary hover:bg-accent/20"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Persistent Action Group: Book Appointment CTA + Mobile Toggle */}
        <div className="flex items-center gap-3">
          {/* Persistent CTA Button per SRS §3.3 */}
          {onBookClick ? (
            <Button
              variant="primary"
              size="md"
              onClick={onBookClick}
              className="shadow-sm font-semibold shrink-0"
              id="nav-book-cta"
            >
              <svg
                className="w-4 h-4 mr-1.5 hidden sm:inline-block"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Book Appointment
            </Button>
          ) : (
            <Button
              asChild
              variant="primary"
              size="md"
              className="shadow-sm font-semibold shrink-0"
              id="nav-book-cta"
            >
              <Link href="/book">
                <svg
                  className="w-4 h-4 mr-1.5 hidden sm:inline-block"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Book Appointment
              </Link>
            </Button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            ref={toggleBtnRef}
            type="button"
            className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-foreground hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] min-w-[44px]"
            aria-controls="mobile-menu"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Accessible Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          ref={menuRef}
          id="mobile-menu"
          role="region"
          aria-label="Mobile Navigation"
          className="lg:hidden border-t border-border bg-background px-4 pt-3 pb-6 flex flex-col gap-1.5 shadow-lg animate-in slide-in-from-top-2 duration-fast"
        >
          {navLinks.map((link) => {
            const currentPath = pathname || "";
            const isActive =
              currentPath === link.href ||
              (link.href !== "/" && currentPath.startsWith(link.href));
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2.5 text-base font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] flex items-center ${
                  isActive ? "bg-accent/40 text-primary font-semibold" : "text-foreground hover:bg-accent/30"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-border/60 mt-2">
            <Button
              variant="secondary"
              size="lg"
              className="w-full justify-center"
              onClick={() => {
                setMobileMenuOpen(false);
                onBookClick?.();
              }}
            >
              Schedule Consultation
            </Button>
          </div>
        </div>
      )}
    </header>
    </>
  );
}
