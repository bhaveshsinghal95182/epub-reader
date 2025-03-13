import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b-4 border-[#222222] bg-[#F5F5F5] shadow-[5px_5px_0px_rgba(0,0,0,0.9)] dark:bg-[#222222] dark:text-white text-black">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <span className="font-heading text-xl font-bold">EPUB Reader</span>
        </Link>
        <div className="flex items-center gap-4">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}

