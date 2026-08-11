'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import FeedbackModal from './FeedbackModal'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)

  const listItems = [
    { Link: "/#how-it-works", Item: "How it Works" },
    { Link: "/#features", Item: "Features" },
    { Link: "/#stories", Item: "Stories" },
    { Link: "/#pricing", Item: "Pricing" }
  ]

  return (
    <header className="flex justify-center relative w-full z-50 mt-3 ">
      <main className="bg-white w-full h-20 px-6 lg:px-8 items-center lg:mx-20 mx-2 justify-between flex flex-row shadow-md rounded-md">

        {/* Logo */}
        <div className="shrink-0 flex items-center">
          <Link href="/">
            <Image src="/images/Logo.png" width={120} height={40} alt="Logo" priority />
          </Link>
        </div>

        {/* Nav Links (Desktop) */}
        <nav className="hidden lg:flex items-center mx-4">
          <ul className="flex flex-row items-center gap-6 xl:gap-10 whitespace-nowrap">
            {listItems.map((item) => (
              <li key={item.Item} className="m-0 cursor-pointer">
                <Link
                  href={item.Link}
                  className="relative group block h-7 overflow-hidden text-sm font-medium"
                >
                  <div className="flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-1/2">
                    {/* Default Gray Text */}
                    <span className="h-7 flex items-center justify-center text-gray-600 font-medium whitespace-nowrap">
                      {item.Item}
                    </span>

                    {/* Bouncy Gradient Text */}
                    <span className="h-7 flex items-center justify-center text-primary-linear font-semibold whitespace-nowrap">
                      {item.Item}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Action Buttons */}
        <div className="hidden lg:flex items-center gap-3 shrink-0 whitespace-nowrap">
          <Link href="/Login">
            <button className="relative group overflow-hidden border-2 border-gray-300 shadow-sm px-6 py-2 flex items-center justify-center transition-all duration-900">
              <span className="absolute bottom-0 right-0 w-64 h-64 bg-gray-800 rounded-full translate-x-1/2 translate-y-1/2 scale-0 group-hover:scale-[1.5] transition-transform duration-900 ease-in-out origin-center"></span>
              <span className="relative z-10 text-gray-600 font-medium group-hover:text-white transition-colors duration-700">
                Sign In
              </span>
            </button>
          </Link>
          <Link href="/Register">
            <button className="group border-2 bg-primary-linear px-6 py-2 text-white hover:bg-white hover:border-primary-linear transition-all">
              <span className="group-hover:text-primary-linear">Get Started</span>
            </button>
          </Link>
        </div>

        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex lg:hidden flex-col justify-center items-center gap-1.5 w-8 h-8 p-0 bg-transparent border-0 hover:bg-transparent! shrink-0"
          aria-label="Toggle Menu"
        >
          <span className={`h-0.5 w-6 bg-gray-700 transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`h-0.5 w-6 bg-gray-700 transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`} />
          <span className={`h-0.5 w-6 bg-gray-700 transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </main>

      {/* Mobile Menu Dropdown */}
      <div className={`absolute top-22 left-0 w-full bg-white shadow-xl rounded-md p-6 lg:hidden transition-all duration-300 origin-top transform ${isOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 pointer-events-none'}`}>
        <nav className="mb-6">
          <ul className="flex flex-col gap-4">
            {listItems.map((item) => (
              <li key={item.Item} className="w-full text-center py-2 border-b border-gray-50 flex justify-center">
                <Link
                  href={item.Link}
                  onClick={() => setIsOpen(false)}
                  className="relative group block h-7 overflow-hidden text-sm font-medium"
                >
                  <div className="flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-1/2">
                    <span className="h-7 flex items-center justify-center text-gray-600 font-medium whitespace-nowrap">
                      {item.Item}
                    </span>
                    <span className="h-7 flex items-center justify-center text-primary-linear font-semibold whitespace-nowrap">
                      {item.Item}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex justify-center gap-3">
          <Link href="/Login">
            <button className="relative group overflow-hidden border-2 border-gray-300 shadow-sm px-6 py-2 flex items-center justify-center transition-all duration-900">
              <span className="absolute bottom-0 right-0 w-64 h-64 bg-gray-800 rounded-full translate-x-1/2 translate-y-1/2 scale-0 group-hover:scale-[1.5] transition-transform duration-900 ease-in-out origin-center"></span>
              <span className="relative z-10 text-gray-600 font-medium group-hover:text-white transition-colors duration-700">
                Sign In
              </span>
            </button>
          </Link>
          <Link href="/Register">
            <button className="group border-2 bg-primary-linear px-6 py-2 text-white hover:bg-white hover:border-primary-linear transition-all">
              <span className="group-hover:text-primary-linear">Get Started</span>
            </button>
          </Link>
        </div>
      </div>
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </header>
  )
}

export default Navbar