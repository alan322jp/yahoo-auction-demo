import './globals.css'

export const metadata = {
  title: 'Yahoo Auction Demo',
  description: 'Enhanced UI with Tailwind',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}