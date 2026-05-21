import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo.png" alt="forword.io" width={200} height={57} priority />
          <p className="text-gray-500 mt-2 text-sm">Move your book forward.</p>
        </div>
        {children}
      </div>
    </div>
  )
}
