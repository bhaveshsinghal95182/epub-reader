import { FileUploader } from "@/components/file-uploader"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Toaster } from "@/components/ui/toaster"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F5] text-[#222222] dark:bg-[#222222] dark:text-[#F5F5F5]">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <section className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mb-4">EPUB Reader</h1>
            <p className="text-xl md:text-2xl">
              Upload your EPUB file and read it online.
            </p>
          </div>

          <FileUploader />
        </section>
      </main>
      <SiteFooter />
      <Toaster />
    </div>
  )
}

