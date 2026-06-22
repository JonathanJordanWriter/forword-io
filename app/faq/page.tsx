import Link from 'next/link'
import FAQAccordion from '@/components/support/FAQAccordion'

type FAQItem = { q: string; a: React.ReactNode }
type Section = { title: string; items: FAQItem[] }

const sections: Section[] = [
  {
    title: 'About forword.io',
    items: [
      {
        q: 'What is forword.io?',
        a: <>forword.io is designed to reduce the confusion and overwhelm around marketing your book. With so much conflicting advice online, it can be difficult to know what to do for your specific book within your specific preferences. forword.io drafts a customized book marketing plan based on your genre, goals, book stage, time availability, and platform preferences. The suggestions are based on proven strategies that have worked for other authors — both fiction and nonfiction — and across all publishing paths.</>,
      },
      {
        q: 'How does the plan get created for my book?',
        a: <>First, you fill out an author profile during setup so we know a bit about you. Then you complete a book profile for whichever title you want a plan for. Our system is preloaded with suggestions based on what has worked for other authors, then modified to fit the information you gave us. AI is used to make the task selections customized for your book. We&apos;re aware that the A-word makes many writers nervous — but the same thing happens when Spotify or Netflix make recommendations for you based on your personal taste. We&apos;re constantly adding new task ideas based on feedback and what we see working so that everyone can win.</>,
      },
      {
        q: "I don't want AI taking my book. Does using forword.io compromise my book in any way?",
        a: <>We&apos;re 100% on the same page with you. forword.io is designed in a way that does not feed any of your info to an LLM (Large Language Model), and we will never ask you to upload your manuscript to an LLM. In fact, we actively discourage all authors from ever doing so. Any info about your book from your profile is private in your account and is not shared or accessible by other users. The only function the AI interface serves is to select from our task list so that you receive a customized plan instead of cookie-cutter advice. Think of it like how Spotify or Netflix makes personalized recommendations — that&apos;s how forword.io works.</>,
      },
      {
        q: 'Does forword.io sell my book for me?',
        a: <>As an author, you are your book&apos;s best evangelist. If you&apos;re looking for someone else to sell your book for you, you might want to reconsider whether you really want to be an author. We help by cutting through the noise and contradictory advice, tailoring a practical plan for you, your goals, and your schedule. Follow the steps and you will gain visibility and traction, which inevitably leads to more book sales. You can draft a 30-day plan totally free, no risk.</>,
      },
      {
        q: 'Does forword.io draft social media posts for me?',
        a: <>No — because we believe the best writing comes from humans, specifically you. The tasks will give you prompts to build off of based around proven strategies. We&apos;re considering a future feature that would build a customized prompt list so you spend less time staring at a blank page and more time gaining visibility. However, we will never draft writing for you. We draw a hard line there. If you want a platform that &quot;writes&quot; for you, forword.io is definitely not for you.</>,
      },
    ],
  },
  {
    title: 'Getting Started',
    items: [
      {
        q: 'How do I create an account?',
        a: <>Click <strong>Sign Up</strong> on the forword.io homepage and enter your email address and a password. You&apos;ll receive a confirmation email — open it and click the link inside to activate your account. If you don&apos;t see it within a few minutes, check your spam or junk folder.</>,
      },
      {
        q: 'I never received my confirmation email.',
        a: <>Double-check your spam or junk folder first. If it&apos;s still not there, add <strong>noreply@forword.io</strong> to your contacts and try signing up again. Some corporate or school email systems block automated emails from new senders — if that&apos;s the case, try signing up with a personal email address (Gmail, Outlook, etc.).</>,
      },
      {
        q: 'Can I sign in with Google?',
        a: <>Yes. On the login page, click <strong>Continue with Google</strong> to sign in without a password. Make sure you use the same method every time (Google or email/password) to access the same account.</>,
      },
      {
        q: "The site isn't loading. I just see a blank screen.",
        a: (
          <>
            <p className="mb-2">This is most often caused by a network-level security filter (common on work or school networks, or if you use a VPN or DNS filter like Pi-hole or NextDNS) blocking the forword.io domain. Try the following:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Switch from your WiFi to your phone&apos;s mobile hotspot and try again. If it loads, the block is on your network, not your device.</li>
              <li>Disable your VPN temporarily and reload.</li>
              <li>Try a different browser with extensions disabled.</li>
              <li>If the issue persists on all networks, contact us at <a href="mailto:support@forword.io" className="text-brand-button hover:underline">support@forword.io</a>.</li>
            </ul>
          </>
        ),
      },
      {
        q: 'What if I have a co-author or someone helping me with my plan? Can I give them access?',
        a: <>We can&apos;t tell you who to share your account access with, but our recommendation is to use one single email address for accessing your marketing plans. Consider creating an email account specifically for book marketing purposes that you and any helpers can access with your permission. You can always update the login email or password in your Account Settings.</>,
      },
    ],
  },
  {
    title: 'Setting Up Your Book',
    items: [
      {
        q: 'How many books can I add?',
        a: <>On the free Starter plan, you can add up to 2 books and see the first 30 days of tasks for each. Upgrading to Author ($9/month) gives you a full 90-day plan for one book, plus 30-day plans for as many other titles as you want. Note: you can switch your 90-day plan to a new title only once per month.</>,
      },
      {
        q: "What if I'm not sure which book stage to select?",
        a: (
          <>
            <p className="mb-2">Choose the stage that best describes where your manuscript is right now:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Just an idea / Outlining</strong> — you have a concept but haven&apos;t started writing yet, or you&apos;re mapping out structure.</li>
              <li><strong>Writing</strong> — you&apos;re actively working on the manuscript.</li>
              <li><strong>Finished manuscript / Beta reading</strong> — the first draft is done, possibly being reviewed by beta readers.</li>
              <li><strong>In revision / Querying</strong> — you&apos;re revising and refining, or querying agents and revising based on their feedback.</li>
              <li><strong>Developmental edit / Line edit</strong> — you&apos;re working with an editor to refine your manuscript.</li>
              <li><strong>Cover &amp; production / Proofreading</strong> — you&apos;re in the final pre-launch stage.</li>
              <li><strong>Already published</strong> — your book is live and available for purchase.</li>
            </ul>
            <p className="mt-2">Your book stage determines the type of tasks in your plan. You can update it at any time in your book profile and redraft accordingly.</p>
          </>
        ),
      },
      {
        q: 'What is the "Keywords / subgenre" field for?',
        a: <>This is a free-text field to add descriptors that make your book more specific — for example, &quot;slow burn, dark academia, found family&quot; for fiction, or &quot;technology, social justice, theology&quot; for nonfiction. These help personalize your plan tasks even more. It&apos;s optional but recommended.</>,
      },
      {
        q: "I'm on a lot of social media platforms. How many should I select?",
        a: <>You can choose as many as you want, but we typically recommend focusing on 3 platforms at first. It&apos;s an uphill battle to grow if you&apos;re only posting but not engaging. Spreading yourself too thin is a fast track to burnout. Focus on the platforms where your ideal readers are most likely to be and where you&apos;re already seeing a return on your time investment.</>,
      },
      {
        q: 'What does "Platforms you\'re open to exploring" mean?',
        a: <>These are platforms you don&apos;t currently use but would be willing to try. Your plan will include a small number of beginner-friendly tasks for these so you can ease in gradually without feeling overwhelmed. You can rank them in order of preference so your plan prioritizes the ones you&apos;re most interested in.</>,
      },
      {
        q: 'What is the "Comp titles" section for?',
        a: <>&quot;Comp titles&quot; (comparison titles) are recently published books similar to yours in genre, tone, or audience. They help forword.io draft tasks that reference the right reader communities, platforms, and marketing angles for your specific book. Add up to three comp titles. If you&apos;re not sure what your comp titles are yet, you can skip this section — your plan will still be personalized based on your genre and goals.</>,
      },
      {
        q: 'Can I upload a cover image?',
        a: <>Yes! On your book&apos;s plan page, click the portrait-shaped placeholder above your book profile to upload a cover image. It accepts any standard image format (JPG, PNG, etc.) up to 10 MB. You can replace it at any time by clicking the image again.</>,
      },
    ],
  },
  {
    title: 'Drafting & Redrafting Your Plan',
    items: [
      {
        q: 'How long does plan drafting take?',
        a: <>Plan drafting typically takes 1–2 minutes, though it can sometimes take up to 5 minutes. A loading screen will appear while your plan is being created. Please don&apos;t close or refresh the tab during this time — you can navigate away and come back, and your plan will be ready when you return.</>,
      },
      {
        q: 'My plan drafting failed. What do I do?',
        a: <>Try clicking <strong>Draft my plan</strong> again. If it fails a second time, make sure your book profile is complete — particularly the book type, genre, book stage, and at least one goal. If the problem continues, contact us at <a href="mailto:support@forword.io" className="text-brand-button hover:underline">support@forword.io</a> with your book title and we&apos;ll help you sort it out.</>,
      },
      {
        q: 'Can I update my book profile after the plan is created?',
        a: <>Yes — click <strong>Edit profile</strong> inside your book profile at any time to update any field. After saving, a <strong>Redraft plan</strong> button will appear inside the profile and also above your phase tabs. Click it to redraft your plan based on the updated information. Any tasks you&apos;ve already completed will be carried over automatically.</>,
      },
      {
        q: 'What happens to my completed tasks when I redraft?',
        a: <>Your completed tasks are preserved. When you redraft, forword.io adds new uncompleted tasks matched to your updated profile, while keeping a record of everything you&apos;ve already finished. You&apos;ll also see an option to <strong>Start completely fresh</strong> if you&apos;d prefer to reset everything.</>,
      },
      {
        q: 'Can I change my time availability after drafting my plan?',
        a: <>Yes. Inside the week navigator on your plan page, use the – and + buttons to adjust your weekly time availability up or down. After changing it, a <strong>Redraft plan</strong> prompt will appear — click it to redraft tasks matched to your new capacity.</>,
      },
    ],
  },
  {
    title: 'Working with Your Tasks',
    items: [
      {
        q: 'How do I mark a task as complete?',
        a: <>Click anywhere on the task card to toggle it complete. A green checkmark will appear and the task will be crossed out. Click it again to unmark it. You earn points for every completed task — if you unmark it, those points will be deducted from your total.</>,
      },
      {
        q: 'Can I add my own tasks?',
        a: <>Yes. At the bottom of any week&apos;s task list, click <strong>Add your own task</strong>. Enter a title, estimated time, optional description, and a category (which determines the reward points earned). Custom tasks appear in your plan alongside the tasks suggested by forword.io.</>,
      },
      {
        q: 'Can I move a task to a different week?',
        a: <>Yes. Below any incomplete, unlocked task, click <strong>Move task</strong>. You&apos;ll see options to shift it to the previous or next week within the same phase. Tasks can only be moved within their current phase, not across phases.</>,
      },
      {
        q: "Can I replace a task I don't want to do?",
        a: <>Yes. Below any incomplete, unlocked task, click <strong>Replace this task</strong>. forword.io will suggest a new task for the same week and phase. You can also scroll to the bottom of each week&apos;s task list and click <strong>Add your own task</strong> to create a custom one and assign it to the right category to earn points.</>,
      },
      {
        q: 'Why are some of my tasks blurred?',
        a: <>Tasks beyond the Day 30 marker are locked on the free Starter plan. You can see their titles but not their descriptions. Upgrading to Author ($9/month) unlocks all 90 days of tasks for one book of your choice. Upgrading to Launch Pro ($19/month) gives you 90-day plans for as many books as you want.</>,
      },
      {
        q: "What if I don't finish the tasks in 30 days?",
        a: <>Good news — they don&apos;t go anywhere. The 30 days is an estimate for how long it takes most authors to complete that number of tasks based on their time availability. Go at your own pace. The same applies to Author accounts with 90 days of tasks. Though 90 days is the recommended timeframe, you can take as much time as you need. That said, we recommend sticking as close to the timeframe as possible to maximize traction for your book.</>,
      },
    ],
  },
  {
    title: 'Rewards & Points',
    items: [
      {
        q: 'What are reward points?',
        a: <>You earn points every time you complete a task. Different task categories earn different amounts — PR and publishing tasks earn more points than planning tasks, for example. Points accumulate across your plan and can be viewed on your Rewards page.</>,
      },
      {
        q: 'Do I lose my points if I uncheck a completed task?',
        a: <>Yes — points are deducted if you unmark a task as complete. Your total will update immediately. You can never drop below 0 points, though.</>,
      },
      {
        q: 'What are phase completion bonuses?',
        a: <>When you complete every task in a phase, you earn a one-time phase completion bonus on top of the individual task points. A celebration screen appears to mark the milestone.</>,
      },
      {
        q: 'What do I get for my points?',
        a: <>Go to the <strong>Rewards</strong> tab to see your total points. At the bottom, you&apos;ll see a leaderboard for both Fiction and Nonfiction categories — the top 3 in each category win bonus points. If you have an Author or Launch Pro account, you can spend 2,500 points to &quot;Flip the Book&quot; for a variety of prizes, including discounts on your plan.</>,
      },
    ],
  },
  {
    title: 'Account & Billing',
    items: [
      {
        q: "What's the difference between the Starter, Author, and Launch Pro plans?",
        a: <>The free <strong>Starter</strong> plan gives you up to 2 book profiles and 30 days of tasks per plan. The <strong>Author</strong> plan ($9/month) gives you a full 90-day plan for one book, plus 30-day plans for any other titles you add. <strong>Launch Pro</strong> ($19/month) gives you unlimited 90-day plans for as many titles as you want — perfect for the seasoned author with multiple books requiring ongoing marketing support.</>,
      },
      {
        q: 'How do I upgrade?',
        a: <>From any book&apos;s plan page, click the <strong>Upgrade</strong> link that appears next to locked tasks, or go to <strong>Account Settings</strong> and click the upgrade button from there.</>,
      },
      {
        q: 'What if I need to update my billing info?',
        a: <>Go to <strong>Account Settings</strong> and under Subscription, click <strong>Manage billing</strong>. You can update your billing information there whenever needed.</>,
      },
      {
        q: 'How do I cancel my subscription?',
        a: <>Go to <strong>Account Settings</strong>, find your current plan, and click <strong>Manage billing</strong>. You&apos;ll see <strong>Cancel subscription</strong> as an option there. Your Author or Pro features will remain active until the end of your current billing period, then your account will revert to the Starter plan. Your books and completed task history are never deleted.</>,
      },
      {
        q: 'What happens to my plan if I downgrade?',
        a: <>Your plan stays in place but tasks beyond Day 30 will become locked again. All your completed task history and points are preserved. If you re-upgrade later, your tasks will unlock again without needing to redraft your plan.</>,
      },
    ],
  },
]

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-brand-button hover:opacity-75 transition-opacity">
          ← forword.io
        </Link>
        <a
          href="mailto:support@forword.io"
          className="text-sm text-gray-500 hover:text-brand-button transition-colors"
        >
          support@forword.io
        </a>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-brand-coal mb-2">Support FAQ</h1>
        <p className="text-gray-500 mb-10">Common questions and troubleshooting for authors.</p>

        <FAQAccordion sections={sections} />

        {/* Footer CTA */}
        <div className="mt-14 pt-8 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500 mb-1">Still need help?</p>
          <a
            href="mailto:support@forword.io"
            className="text-sm font-semibold text-brand-button hover:opacity-75 transition-opacity"
          >
            Email us at support@forword.io
          </a>
        </div>
      </div>
    </div>
  )
}
