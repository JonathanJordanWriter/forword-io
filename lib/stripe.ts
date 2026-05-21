import Stripe from 'stripe'

// Singleton Stripe client — reused across API routes
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

export const PLANS = {
  author: {
    priceId: process.env.STRIPE_AUTHOR_PRICE_ID!,
    name: 'Author',
    price: '$9',
    period: 'month',
  },
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    name: 'Launch Pro',
    price: '$19',
    period: 'month',
  },
} as const

export type PlanKey = keyof typeof PLANS
