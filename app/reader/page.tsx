"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { EpubReader } from "@/components/epub-reader"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Settings } from "lucide-react"
import { ReaderSettings } from "@/components/reader-settings"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"

export default function ReaderPage() {
  const [epubUrl, setEpubUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>("")
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Get the EPUB file data from sessionStorage
    const storedData = sessionStorage.getItem("epubFileData")
    const storedName = sessionStorage.getItem("epubFileName") || "document.epub"

    if (!storedData) {
      console.log('No EPUB data found in sessionStorage');
      router.push("/")
      return
    }

    console.log('Found stored EPUB data, length:', storedData.length);
    console.log('File name:', storedName);

    try {
      // Convert base64 to blob
      const binaryString = atob(storedData);
      console.log('Decoded base64 data, length:', binaryString.length);

      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Create blob with the correct MIME type
      const blob = new Blob([bytes], { type: 'application/epub+zip' });
      console.log('Created blob:', blob.size, 'bytes');

      const url = URL.createObjectURL(blob);
      console.log('Created blob URL:', url);

      setEpubUrl(url)
      setFileName(storedName)

      // Clean up the URL when the component unmounts
      return () => {
        console.log('Cleaning up blob URL');
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error processing EPUB file:', error);
      toast({
        variant: "error",
        title: "Error",
        description: "Failed to load EPUB file. Please try uploading again.",
      });
      router.push("/");
    }
  }, [router, toast])

  if (!epubUrl) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F5] text-[#222222] dark:bg-[#222222] dark:text-[#F5F5F5]">
      <SiteHeader />

      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.push("/")}
          className="border-2 border-[#222222] dark:border-[#F5F5F5] shadow-[4px_4px_0px_rgba(0,0,0,0.9)] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.9)] hover:shadow-[2px_2px_0px_rgba(0,0,0,0.9)] dark:hover:shadow-[2px_2px_0px_rgba(255,255,255,0.9)] transition-shadow hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_rgba(0,0,0,0.9)]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="border-2 border-[#222222] dark:border-[#F5F5F5] shadow-[4px_4px_0px_rgba(0,0,0,0.9)] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.9)] hover:shadow-[2px_2px_0px_rgba(0,0,0,0.9)] dark:hover:shadow-[2px_2px_0px_rgba(255,255,255,0.9)] transition-shadow hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_rgba(0,0,0,0.9)]"
          >
            <Settings className="h-4 w-4" />
            <span className="sr-only">Reader Settings</span>
          </Button>
        </div>
      </div>

      {isSettingsOpen && <ReaderSettings onClose={() => setIsSettingsOpen(false)} />}

      <main className="flex-1 container mx-auto px-4 py-4">
        <EpubReader url={epubUrl} />
      </main>

      <SiteFooter />
      <Toaster />
    </div>
  )
}

