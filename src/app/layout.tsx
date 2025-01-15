import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "FakeThesisGenerator",
  description: "FakeThesisGenerator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
