import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jóvenes Más Madrid | Archivo interno",
  description:
    "Espacio privado de organización, archivo y memoria interna de Jóvenes Más Madrid.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
