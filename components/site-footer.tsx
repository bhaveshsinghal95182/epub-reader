import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="py-6 border-t-4 border-[#FF0055] bg-[#F5F5F5] dark:bg-[#222222] dark:text-[#F5F5F5]">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm font-medium">
          Made with ❤️ by <strong><Link href="https://bhaveshsinghal.xyz" target="_blank" className="relative after:absolute after:bg-current after:bottom-0 after:left-1/2 after:h-[1px] after:w-0 hover:after:left-0 hover:after:w-full after:transition-all after:duration-300">Bhavesh Singhal</Link></strong>
        </p>
      </div>
    </footer>
  )
}

