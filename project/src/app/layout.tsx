// project/src/app/layout.tsx
import type { Metadata } from "next";
import AppLayout from "../layouts/appLayout";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/globals.css";
import ThemeBody from "@/util/wrappers/ThemeBody";

export const metadata: Metadata = {
  title: "Project CMS",
  description: "Project CMS",
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ThemeBody>
        <AppLayout>{children}</AppLayout>
        <ToastContainer />
      </ThemeBody>
    </html>
  );
}
