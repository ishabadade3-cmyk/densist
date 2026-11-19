import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { SmoothScrollProvider } from "@/components/motion/smooth-scroll";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Densistt Dental Clinic | Premium Dental & Implantology Practice",
  description: "Bespoke, calm, luxury dental care and dental implants in Thane West, Maharashtra.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-accent selection:text-foreground">
        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
