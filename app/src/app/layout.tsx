import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "RRA Session Planner",
  description: "Rajasthan Royals Academy Melbourne — Elite Program Session Planner",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-montserrat antialiased">
        <ThemeProvider>
          {children}
          <Toaster position="bottom-right" richColors closeButton duration={3000} />
        </ThemeProvider>
      </body>
    </html>
  );
}
