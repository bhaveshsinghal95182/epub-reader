import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { FileText, Rss } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b-4 border-[#222222] bg-[#F5F5F5] shadow-[5px_5px_0px_rgba(0,0,0,0.9)] dark:bg-[#222222] dark:text-white text-black">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <span className="font-heading text-xl font-bold">EPUB Reader</span>
        </Link>
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="border-2 border-[#222222] dark:border-[#F5F5F5]">
                <FileText className="h-4 w-4" />
                <span className="sr-only">XML Resources</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/sitemap.xml" target="_blank" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Sitemap XML</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/rss.xml" target="_blank" className="flex items-center gap-2">
                  <Rss className="h-4 w-4" />
                  <span>RSS Feed</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/api/xml?type=catalog" target="_blank" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>OPDS Catalog</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}

