"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Header() {
  const pathname = usePathname()

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2L20 7V17L12 22L4 17V7L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M12 11L16 13.5V18.5L12 21L8 18.5V13.5L12 11Z" fill="currentColor" />
              </svg>
            </div>
            <span className="text-xl font-bold">Ryzer</span>
          </Link>
          <nav>
            <ul className="flex gap-6">
              <li>
                <Link
                  href="/"
                  className={`${pathname === "/" ? "text-purple-500 font-medium" : "text-gray-900 hover:text-gray-600"}`}
                >
                  Wallet
                </Link>
              </li>

              <li>
                <Link
                  href="/portfolio"
                  className={`${pathname.startsWith("/portfolio") ? "text-purple-500 font-medium" : "text-gray-900 hover:text-gray-600"}`}
                >
                  Portfolio
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"></span>
          </Button>
          <div className="flex items-center gap-2">
            <Image
              src="/mystical-forest-spirit.png"
              alt="User avatar"
              width={40}
              height={40}
              className="rounded-full"
            />
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>
    </header>
  )
}
