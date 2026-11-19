"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export interface QuickContactBarProps {
  onBookClick?: () => void;
}

export function QuickContactBar({ onBookClick }: QuickContactBarProps) {
  const phoneHref = "tel:02225891949";
  const whatsappHref = "https://wa.me/919987076628?text=Hello%20Densistt%20Dental%20Clinic%2C%20I%20would%20like%20to%20inquire%20about%20an%20appointment.";
  const mapsHref = "https://maps.google.com/?q=Happy+Valley+Shopping+Complex+Manpada+Thane+West";

  return (
    <>
      {/* 1. Mobile Bottom Sticky Conversion Bar (Visible on mobile screens) */}
      <nav
        aria-label="Quick Contact & Booking"
        className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border py-2 px-3 shadow-lg md:hidden"
      >
        <div className="max-w-lg mx-auto grid grid-cols-4 gap-2 text-center">
          {/* Call Clinic */}
          <a
            href={phoneHref}
            className="flex flex-col items-center justify-center py-1 px-1 rounded-lg text-foreground hover:text-primary hover:bg-accent/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Call clinic directly"
          >
            <svg
              className="w-5 h-5 text-primary mb-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <span className="text-[11px] font-semibold leading-none">Call</span>
          </a>

          {/* WhatsApp Chat */}
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center py-1 px-1 rounded-lg text-foreground hover:text-success hover:bg-accent/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Chat on WhatsApp"
          >
            <svg
              className="w-5 h-5 text-success mb-1"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.586 1.761.884 2.791.884h.005c3.179 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.773-5.77zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.085-1.921-.448-1.554-.643-2.531-2.23-2.608-2.333-.077-.104-.635-.845-.635-1.609 0-.765.401-1.141.545-1.298.144-.157.313-.197.418-.197.104 0 .209.001.3.006.096.005.224-.036.35.267.129.313.438 1.071.477 1.15.039.079.065.172.013.277-.052.104-.078.17-.156.262-.078.092-.164.205-.234.275-.078.079-.16.165-.069.321.091.156.406.669.871 1.083.599.534 1.104.7 1.26.779.157.078.248.065.34-.039.091-.105.391-.456.495-.613.105-.157.209-.131.352-.078.144.052.913.43 1.07.509.157.078.261.117.3.183.039.065.039.378-.105.783z" />
            </svg>
            <span className="text-[11px] font-semibold leading-none">WhatsApp</span>
          </a>

          {/* Clinic Directions */}
          <a
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center py-1 px-1 rounded-lg text-foreground hover:text-primary hover:bg-accent/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="View clinic location on Google Maps"
          >
            <svg
              className="w-5 h-5 text-secondary mb-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-[11px] font-semibold leading-none">Directions</span>
          </a>

          {/* Book Appointment CTA */}
          <button
            type="button"
            onClick={onBookClick}
            className="flex flex-col items-center justify-center py-1 px-1 rounded-lg bg-primary text-primary-foreground font-semibold shadow-xs hover:bg-primary-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
            aria-label="Book appointment modal"
          >
            <svg
              className="w-5 h-5 mb-1"
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
            <span className="text-[11px] font-semibold leading-none">Book</span>
          </button>
        </div>
      </nav>

      {/* 2. Desktop Floating Quick-Action Pill (Bottom Right) */}
      <div
        className="hidden md:flex fixed bottom-6 right-6 z-40 items-center gap-2 p-1.5 rounded-full bg-card/95 backdrop-blur-md border border-border shadow-xl"
        role="region"
        aria-label="Quick Actions"
      >
        <a
          href={phoneHref}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-foreground hover:bg-accent/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          title="Call clinic reception"
        >
          <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span>022-25891949</span>
        </a>

        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          title="Chat with clinic on WhatsApp"
        >
          <svg className="w-3.5 h-3.5 text-success" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.586 1.761.884 2.791.884h.005c3.179 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.773-5.77zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.085-1.921-.448-1.554-.643-2.531-2.23-2.608-2.333-.077-.104-.635-.845-.635-1.609 0-.765.401-1.141.545-1.298.144-.157.313-.197.418-.197.104 0 .209.001.3.006.096.005.224-.036.35.267.129.313.438 1.071.477 1.15.039.079.065.172.013.277-.052.104-.078.17-.156.262-.078.092-.164.205-.234.275-.078.079-.16.165-.069.321.091.156.406.669.871 1.083.599.534 1.104.7 1.26.779.157.078.248.065.34-.039.091-.105.391-.456.495-.613.105-.157.209-.131.352-.078.144.052.913.43 1.07.509.157.078.261.117.3.183.039.065.039.378-.105.783z" />
          </svg>
          <span>WhatsApp</span>
        </a>

        <Button
          variant="primary"
          size="sm"
          onClick={onBookClick}
          className="rounded-full shadow-sm font-semibold"
        >
          Book Appointment
        </Button>
      </div>
    </>
  );
}
