import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center">
      <div className="mb-4">
        <Image src="/logo.png" alt="forword.io" width={280} height={80} priority />
      </div>
      <p className="text-xl text-gray-500 mb-10">Move your book forward.</p>
      <p className="text-gray-600 max-w-md mb-10 leading-relaxed">
        Generate a personalized 90-day marketing plan for your book — built around your genre,
        goals, platforms, and the time you actually have.
      </p>
      <div className="flex gap-4">
        <Link
          href="/signup"
          className="px-6 py-3 bg-brand-button text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
        >
          Get started free
        </Link>
        <Link
          href="/login"
          className="px-6 py-3 border-2 border-brand-coal text-brand-coal text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
        >
          Log in
        </Link>
      </div>
    </div>
  )
}
