'use client'

import { useState } from 'react'

type FAQItem = { q: string; a: React.ReactNode }
type Section = { title: string; items: FAQItem[] }

export default function FAQAccordion({ sections }: { sections: Section[] }) {
  const [open, setOpen] = useState<string | null>(null)

  function toggle(key: string) {
    setOpen(prev => (prev === key ? null : key))
  }

  return (
    <div className="space-y-10">
      {sections.map(section => (
        <div key={section.title}>
          <h2 className="text-lg font-bold text-brand-coal mb-3 pb-2 border-b border-gray-100">
            {section.title}
          </h2>
          <div className="divide-y divide-gray-100">
            {section.items.map(item => {
              const key = `${section.title}::${item.q}`
              const isOpen = open === key
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    onClick={() => toggle(key)}
                    className="w-full flex items-center justify-between gap-4 py-3.5 text-left"
                  >
                    <span className="text-sm font-semibold text-brand-coal">{item.q}</span>
                    <svg
                      className={`w-4 h-4 shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="pb-4 text-sm text-gray-600 leading-relaxed">
                      {item.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
