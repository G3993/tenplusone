import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "TEN PLUS ONE | World Cup 2026 Fan Gear",
  description: "The ultimate World Cup 2026 fan gear experience. Bet on your team, win big. Pre-order now for guaranteed delivery.",
  keywords: ["World Cup 2026", "Soccer", "Football", "Fan Gear", "Jersey", "Prediction Market"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-pixel antialiased">
        {children}
      </body>
    </html>
  );
}
