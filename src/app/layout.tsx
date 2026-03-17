import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Company Dashboard",
  description: "Gérez votre entreprise",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${inter.className} bg-gray-950 text-white min-h-screen`}>
        <Toaster position="top-right" toastOptions={{ style: { background: "#1f2937", color: "#fff" } }} />
        {children}
      </body>
    </html>
  );
}
