import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import AuthHeader from "@/components/auth/AuthHeader";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Side Quest",
  description:
    "Side Quest turns life into a game with weekly real-world challenges, proof uploads, and community verification.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <AuthHeader />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
