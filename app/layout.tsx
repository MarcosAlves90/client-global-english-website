import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import "@uiw/react-md-editor/markdown-editor.css"
import "@uiw/react-markdown-preview/markdown.css"
import "@uiw/react-markdown-preview/markdown.css"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/components/auth-provider"
import { Toaster } from "sonner"
import { getMetadataBase, siteConfig } from "@/lib/seo"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: siteConfig.title,
    template: "%s | Global English",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "curso de inglês",
    "plataforma de inglês",
    "trilhas de inglês",
    "atividades de inglês",
    "Global English",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TooltipProvider>
          <AuthProvider>{children}</AuthProvider>
          <Toaster
            richColors
            position="top-right"
            closeButton
            theme="dark"
            toastOptions={{
              className: "border-primary/20 bg-card/80 backdrop-blur-xl text-foreground rounded-2xl shadow-2xl shadow-primary/5",
              descriptionClassName: "text-muted-foreground text-xs",
              style: {
                border: "1px solid oklch(1 0 0 / 10%)",
                fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui",
              }
            }}
          />
        </TooltipProvider>
      </body>
    </html>
  )
}
