"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, FileText, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export function FileUploader() {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const validateFile = (file: File): boolean => {
    if (!file.name.endsWith(".epub")) {
      setError("Please upload an EPUB file")
      toast({
        variant: "error",
        title: "Invalid File",
        description: "Please upload an EPUB file",
      })
      return false
    }

    if (file.size > 50 * 1024 * 1024) {
      // 50MB limit
      setError("File size exceeds 50MB limit")
      toast({
        variant: "error",
        title: "File Too Large",
        description: "File size exceeds 50MB limit",
      })
      return false
    }

    return true
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    setError(null)

    const droppedFile = e.dataTransfer.files[0]
    if (!droppedFile) return

    if (validateFile(droppedFile)) {
      setFile(droppedFile)
      toast({
        title: "File Added",
        description: `${droppedFile.name} is ready to be processed.`,
      })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (validateFile(selectedFile)) {
      setFile(selectedFile)
      toast({
        title: "File Added",
        description: `${selectedFile.name} is ready to be processed.`,
      })
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)

    try {
      toast({
        title: "Processing File",
        description: "Preparing your EPUB file for viewing...",
      })

      // Convert file to array buffer
      const reader = new FileReader();
      
      reader.onload = function(e) {
        if (e.target?.result) {
          // Convert ArrayBuffer to Base64
          const arrayBuffer = e.target.result as ArrayBuffer;
          const bytes = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64Data = btoa(binary);
          
          // Store the base64 data
          sessionStorage.setItem("epubFileData", base64Data);
          sessionStorage.setItem("epubFileName", file.name);

          toast({
            variant: "success",
            title: "File Ready",
            description: "Opening EPUB reader...",
          });

          // Redirect to the reader page
          router.push("/reader");
        }
      };

      reader.onerror = function(error) {
        throw new Error("Failed to read file");
      };

      // Read the file as ArrayBuffer
      reader.readAsArrayBuffer(file);
    } catch (error) {
      setError("Failed to process file. Please try again.")
      toast({
        variant: "error",
        title: "Processing Failed",
        description: "Failed to process file. Please try again.",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="w-full">
      <div
        className={`border-4 border-dashed border-[#222222] rounded-lg p-8 text-center transition-colors ${
          isDragging ? "bg-[#0055FF]/10" : "bg-white dark:bg-[#333333]"
        } shadow-[8px_8px_0px_rgba(0,0,0,0.9)] dark:shadow-[8px_8px_0px_rgba(255,255,255,0.9)]`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-xl">
              <FileText className="h-8 w-8 text-[#FF0055]" />
              <span className="font-medium truncate max-w-xs">{file.name}</span>
            </div>
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="bg-[#FF0055] hover:bg-[#FF0055]/90 text-white font-bold py-3 px-6 rounded-md shadow-[5px_5px_0px_rgba(0,0,0,0.9)] dark:shadow-[5px_5px_0px_rgba(255,255,255,0.9)] hover:shadow-[2px_2px_0px_rgba(0,0,0,0.9)] dark:hover:shadow-[2px_2px_0px_rgba(255,255,255,0.9)] transition-all border-2 border-[#222222] dark:border-[#F5F5F5] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[1px_1px_0px_rgba(0,0,0,0.9)] active:scale-95"
            >
              {isUploading ? "Processing..." : "Open EPUB"}
            </Button>
            <div>
              <button
                onClick={() => setFile(null)}
                className="text-[#0055FF] underline mt-2 hover:text-[#0055FF]/80 transition-colors"
              >
                Choose a different file
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="h-12 w-12 mx-auto text-[#FF0055] animate-pulse" />
            <h3 className="text-xl font-heading font-bold">Drag & Drop your EPUB file here</h3>
            <p className="text-gray-600 dark:text-gray-300">or</p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#FF0055] hover:bg-[#0055FF]/90 text-white font-bold py-3 px-6 rounded-md shadow-[5px_5px_0px_rgba(0,0,0,0.9)] dark:shadow-[5px_5px_0px_rgba(255,255,255,0.9)] hover:shadow-[2px_2px_0px_rgba(0,0,0,0.9)] dark:hover:shadow-[2px_2px_0px_rgba(255,255,255,0.9)] transition-all border-2 border-[#222222] dark:border-[#F5F5F5] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[1px_1px_0px_rgba(0,0,0,0.9)] active:scale-95"
            >
              Browse Files
            </Button>
            <p className="text-sm text-gray-500 dark:text-gray-400">Supports .epub files up to 50MB</p>
          </div>
        )}
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".epub" className="hidden" />
      </div>

      {error && (
        <div className="mt-4 p-3 bg-[#FF2222]/10 border-2 border-[#FF2222] rounded-md flex items-center gap-2 text-[#FF2222]">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

