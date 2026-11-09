import type { Metadata } from 'next'
import { Abril_Fatface, Oswald, Playfair_Display, Source_Serif_4 } from 'next/font/google'
import NewsShell from './components/NewsShell'
import { currentMinute, loadInitialFeeds } from './lib/serverFeeds'
import { SITE_URL } from './lib/site'
import './globals.css'

const nameplate = Abril_Fatface({ weight: '400', subsets: ['latin'], variable: '--font-nameplate' })
const headline = Playfair_Display({ subsets: ['latin'], variable: '--font-headline' })
const body = Source_Serif_4({ subsets: ['latin'], variable: '--font-body' })
const label = Oswald({ subsets: ['latin'], variable: '--font-label' })

// Pages are rebuilt with fresh feeds at most once a minute.
export const revalidate = 60

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'The OpenTO | Live Toronto Police, Fire, TTC and GO Updates',
  description:
    'One live dashboard for what is happening in Toronto: police calls, fire incidents, TTC delays and subway closures, and GO Transit alerts.'
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const initialFeeds = await loadInitialFeeds()

  return (
    <html lang="en" className={`${nameplate.variable} ${headline.variable} ${body.variable} ${label.variable}`}>
      <body>
        <NewsShell initialFeeds={initialFeeds} serverNow={currentMinute()}>
          {children}
        </NewsShell>
      </body>
    </html>
  )
}
