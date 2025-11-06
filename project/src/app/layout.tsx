// project/src/app/layout.tsx
import type { Metadata } from "next";
import AppLayout from "../layouts/appLayout";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/globals.css";

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
    <html
      lang="en"
      style={{
        backgroundColor: "white",
      }}
    >
      <body>
        <AppLayout>{children}</AppLayout>
        <ToastContainer />
      </body>
    </html>
  );
}
