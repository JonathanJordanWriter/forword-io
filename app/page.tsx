import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center">
      <div className="mb-4">
        <Image src="/logo.png" alt="forword.io" width={280} height={80} priority />
      </div>
      <h1 className="text-xl text-gray-500 mb-10">Move your book forward.</h1>
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

      {/* Footer */}
      <div className="absolute bottom-6 flex items-center gap-6">
        <p className="text-xs font-medium text-brand-button">Follow us</p>
        <a
          href="https://www.youtube.com/@forwordwriting"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-[#FF0000] hover:opacity-75 transition-opacity font-medium"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.8 15.5V8.5l6.3 3.5-6.3 3.5z"/>
          </svg>
          YouTube
        </a>
        <a
          href="https://jonathanjordan.substack.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-[#FF6719] hover:opacity-75 transition-opacity font-medium"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/>
          </svg>
          Substack
        </a>
      </div>
    </div>
  )
}
