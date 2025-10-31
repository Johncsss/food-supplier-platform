import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { CartProvider } from '@/components/providers/CartProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FoodSupplier Pro - Restaurant Food Supply Platform',
  description: 'Premium food supplier platform for restaurants with yearly membership. Order fresh ingredients, meats, produce, and more.',
  keywords: 'restaurant food supply, wholesale food, restaurant ingredients, food supplier, membership',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <CartProvider>
            {children}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
} 