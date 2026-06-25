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
        Draft a personalized 90-day marketing plan for your book, built around your genre, goals, platforms, and time.
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
        <a
          href="https://youtu.be/iTmEy7KvLdA"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 border-2 border-brand-button text-brand-button text-sm font-medium rounded-xl hover:bg-brand-button/5 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
          Watch demo
        </a>
      </div>
    </div>
  )
}
