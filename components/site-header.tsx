import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"
import { Github } from "lucide-react"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b-4 border-[#222222] bg-[#F5F5F5] shadow-[5px_5px_0px_rgba(0,0,0,0.9)] dark:bg-[#222222] dark:text-white text-black">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <span className="font-heading text-xl font-bold">EPUB Reader</span>
        </Link>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/bhaveshsinghal95182/epub-reader"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#FF0055] hover:bg-[#0055FF] text-white font-bold py-2 px-4 rounded-md shadow-[5px_5px_0px_rgba(0,0,0,0.9)] dark:shadow-[5px_5px_0px_rgba(255,255,255,0.9)] hover:shadow-[2px_2px_0px_rgba(0,0,0,0.9)] dark:hover:shadow-[2px_2px_0px_rgba(255,255,255,0.9)] transition-all border-2 border-[#222222] dark:border-[#F5F5F5] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[1px_1px_0px_rgba(0,0,0,0.9)] active:scale-95"
          >
            <Github className="h-5 w-5" />
            <span>GitHub</span>
          </a>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}

