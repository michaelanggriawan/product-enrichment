// app/layout.tsx
import './globals.css';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <nav className="bg-gray-900 text-white px-6 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">🧠 Product Enrichment</h1>
            <div className="flex gap-6 text-sm">
              <Link href="/" className="hover:underline">
                Upload History
              </Link>
              <Link href="/upload" className="hover:underline">
                Upload
              </Link>
            </div>
          </div>
        </nav>
        <Toaster position="top-right" />
        <main className="max-w-7xl mx-auto p-6">{children}</main>
      </body>
    </html>
  );
}
