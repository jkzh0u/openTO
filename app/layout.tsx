import type { Metadata } from 'next'
import { Abril_Fatface, Oswald, Playfair_Display, Source_Serif_4 } from 'next/font/google'
import NewsShell from './components/NewsShell'
import './globals.css'

const nameplate = Abril_Fatface({ weight: '400', subsets: ['latin'], variable: '--font-nameplate' })
const headline = Playfair_Display({ subsets: ['latin'], variable: '--font-headline' })
const body = Source_Serif_4({ subsets: ['latin'], variable: '--font-body' })
const label = Oswald({ subsets: ['latin'], variable: '--font-label' })

export const metadata: Metadata = {
  title: 'The OpenTO',
  description: 'Live Toronto police, fire, TTC and GO news, reported with unnecessary urgency.'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${nameplate.variable} ${headline.variable} ${body.variable} ${label.variable}`}>
      <body>
        <NewsShell>{children}</NewsShell>
      </body>
    </html>
  )
}
