import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  // "variable" (not a fixed weight list) is required to also use `axes` —
  // this loads the full variable font so both weight and the optical-size
  // axis (tunes it for display sizes) are usable via CSS.
  weight: "variable",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "FlockLine — Church Management",
  description:
    "WhatsApp-first church management for small congregations in Ghana and beyond.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
