import type { Metadata, Viewport } from "next"
import { Archivo, Public_Sans } from "next/font/google"
import { Providers } from "@/components/providers"
import "@/styles/globals.css"

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
})

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "UVERGS 360",
    template: "%s · UVERGS 360",
  },
  description: "Plataforma institucional de relacionamento, eventos e inteligência territorial da UVERGS.",
}

export const viewport: Viewport = {
  themeColor: "#041a4f",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${publicSans.variable} h-full`}>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
