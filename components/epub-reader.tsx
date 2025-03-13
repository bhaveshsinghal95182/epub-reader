"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Menu, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useToast } from "@/hooks/use-toast"
import JSZip from "jszip"
import { useTheme } from "next-themes"
import Head from "next/head"
import { generateEpubMetadataXml } from "@/utils/xml-utils"

interface EpubReaderProps {
  url: string
}

interface EpubContent {
  title: string;
  chapters: {
    id: string;
    title: string;
    href: string;
    content: string;
  }[];
  resources: {
    [key: string]: string;
  };
}

export function EpubReader({ url }: EpubReaderProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [epubContent, setEpubContent] = useState<EpubContent | null>(null)
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0)
  const [toc, setToc] = useState<any[]>([])
  const [showToc, setShowToc] = useState(false)
  const [fontSize, setFontSize] = useLocalStorage("epub-font-size", "100")
  const [fontFamily, setFontFamily] = useLocalStorage("epub-font-family", "serif")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { theme } = useTheme()
  const [currentChapterTitle, setCurrentChapterTitle] = useState<string>("")
  const [bookMetadata, setBookMetadata] = useState<any>(null)

  // Load the EPUB file
  useEffect(() => {
    if (!url) return

    setIsLoading(true)
    console.log('Loading EPUB with URL:', url);

    const loadEpub = async () => {
      try {
        // Fetch the EPUB file as an ArrayBuffer
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        
        // Use JSZip to extract the EPUB contents
        const zip = await JSZip.loadAsync(arrayBuffer);
        
        // Find the container.xml file
        const containerXml = await zip.file("META-INF/container.xml")?.async("text");
        if (!containerXml) {
          throw new Error("Invalid EPUB: Missing container.xml");
        }
        
        // Parse the container.xml to find the OPF file
        const opfPath = containerXml.match(/<rootfile[^>]*full-path="([^"]*)"[^>]*>/)?.[1];
        if (!opfPath) {
          throw new Error("Invalid EPUB: Cannot find OPF file path");
        }
        
        // Get the OPF file
        const opfContent = await zip.file(opfPath)?.async("text");
        if (!opfContent) {
          throw new Error("Invalid EPUB: Missing OPF file");
        }
        
        // Parse the OPF file to get metadata and spine
        const parser = new DOMParser();
        const opfDoc = parser.parseFromString(opfContent, "application/xml");
        
        // Get the title
        const title = opfDoc.querySelector("title")?.textContent || "Untitled";
        
        // Extract additional metadata
        const creator = opfDoc.querySelector("creator")?.textContent || undefined;
        const publisher = opfDoc.querySelector("publisher")?.textContent || undefined;
        const language = opfDoc.querySelector("language")?.textContent || undefined;
        const identifier = opfDoc.querySelector("identifier")?.textContent || undefined;
        const pubDate = opfDoc.querySelector("date")?.textContent || undefined;
        const description = opfDoc.querySelector("description")?.textContent || undefined;
        const rights = opfDoc.querySelector("rights")?.textContent || undefined;
        
        // Extract subjects
        const subjects = Array.from(opfDoc.querySelectorAll("subject")).map(
          subject => subject.textContent || ""
        ).filter(Boolean);
        
        // Get the spine items
        const spine = Array.from(opfDoc.querySelectorAll("spine itemref")).map(item => 
          item.getAttribute("idref")
        ).filter(Boolean) as string[];
        
        // Get the manifest items
        const manifest = Array.from(opfDoc.querySelectorAll("manifest item")).reduce((acc, item) => {
          const id = item.getAttribute("id");
          const href = item.getAttribute("href");
          const mediaType = item.getAttribute("media-type");
          if (id && href) {
            acc[id] = { href, mediaType };
          }
          return acc;
        }, {} as Record<string, { href: string; mediaType?: string | null }>);
        
        // Get the base directory of the OPF file
        const baseDir = opfPath.split("/").slice(0, -1).join("/");
        const getFullPath = (relativePath: string) => {
          if (baseDir) {
            return `${baseDir}/${relativePath}`;
          }
          return relativePath;
        };
        
        // Extract all resources (CSS, images, etc.)
        const resources: Record<string, string> = {};
        
        // Process all resources in the manifest
        for (const id in manifest) {
          const item = manifest[id];
          const fullPath = getFullPath(item.href);
          
          // Skip HTML files (they'll be processed separately)
          if (item.mediaType?.includes("html") || item.mediaType?.includes("xhtml")) {
            continue;
          }
          
          try {
            const file = zip.file(fullPath);
            if (!file) continue;
            
            if (item.mediaType?.includes("image")) {
              // For images, create data URLs
              const imageData = await file.async("arraybuffer");
              const base64 = btoa(
                new Uint8Array(imageData).reduce(
                  (data, byte) => data + String.fromCharCode(byte),
                  ''
                )
              );
              resources[fullPath] = `data:${item.mediaType};base64,${base64}`;
            } else if (item.mediaType?.includes("css") || item.mediaType?.includes("text/css")) {
              // For CSS, load as text
              const cssText = await file.async("text");
              resources[fullPath] = cssText;
            }
          } catch (error) {
            console.warn(`Failed to process resource: ${fullPath}`, error);
          }
        }
        
        // Process HTML content with embedded resources
        const processHtml = async (html: string, filePath: string) => {
          // Get the directory of the HTML file
          const fileDir = filePath.split("/").slice(0, -1).join("/");
          
          // Function to resolve relative paths
          const resolveRelativePath = (relativePath: string) => {
            if (relativePath.startsWith("/")) {
              return relativePath.substring(1); // Remove leading slash
            }
            
            // Handle relative paths
            if (fileDir) {
              return `${fileDir}/${relativePath}`;
            }
            return relativePath;
          };
          
          // Replace image sources with data URLs
          let processedHtml = html.replace(
            /<img[^>]*src=["']([^"']*)["'][^>]*>/gi,
            (match, src) => {
              const fullSrc = resolveRelativePath(src);
              if (resources[fullSrc]) {
                // Add alt text if missing for better accessibility
                if (!match.includes('alt=')) {
                  return match.replace('<img', '<img alt="Image from ebook"');
                }
                return match.replace(src, resources[fullSrc]);
              }
              return match;
            }
          );
          
          // Extract and embed CSS
          const cssLinks: string[] = [];
          processedHtml = processedHtml.replace(
            /<link[^>]*href=["']([^"']*)["'][^>]*>/gi,
            (match, href) => {
              if (match.toLowerCase().includes('stylesheet') || match.toLowerCase().includes('css')) {
                const fullHref = resolveRelativePath(href);
                if (resources[fullHref]) {
                  cssLinks.push(resources[fullHref]);
                  return ''; // Remove the link tag
                }
              }
              return match;
            }
          );
          
          // Add extracted CSS as style tags
          if (cssLinks.length > 0) {
            const styleTag = `<style>${cssLinks.join('\n')}</style>`;
            processedHtml = processedHtml.replace('</head>', `${styleTag}</head>`);
          }
          
          return processedHtml;
        };
        
        // Load chapters
        const chapters = await Promise.all(
          spine.map(async (id, index) => {
            const item = manifest[id];
            if (!item?.href) return null;
            
            const fullPath = getFullPath(item.href);
            const content = await zip.file(fullPath)?.async("text") || "";
            
            // Process HTML to embed resources
            const processedContent = await processHtml(content, fullPath);
            
            // Try to extract chapter title from content
            let chapterTitle = `Chapter ${index + 1}`;
            try {
              const tempDoc = new DOMParser().parseFromString(processedContent, 'text/html');
              const h1 = tempDoc.querySelector('h1');
              const h2 = tempDoc.querySelector('h2');
              const title = tempDoc.querySelector('title');
              
              if (h1 && h1.textContent) {
                chapterTitle = h1.textContent.trim();
              } else if (h2 && h2.textContent) {
                chapterTitle = h2.textContent.trim();
              } else if (title && title.textContent) {
                chapterTitle = title.textContent.trim();
              }
            } catch (e) {
              console.warn('Could not extract chapter title:', e);
            }
            
            return {
              id,
              title: chapterTitle,
              href: fullPath,
              content: processedContent
            };
          })
        );
        
        // Filter out null chapters
        const validChapters = chapters.filter(Boolean) as EpubContent["chapters"];
        
        setEpubContent({
          title,
          chapters: validChapters,
          resources
        });
        
        // Store complete metadata for XML export
        setBookMetadata({
          title,
          creator,
          publisher,
          language,
          identifier,
          date: pubDate,
          description,
          subjects,
          rights,
          chapters: validChapters.map(chapter => ({
            id: chapter.id,
            title: chapter.title,
            href: chapter.href
          }))
        });
        
        setToc(validChapters.map((chapter, index) => ({
          label: chapter.title,
          href: index.toString()
        })));
        
        setIsLoading(false);
        
        toast({
          variant: "success",
          title: "Book Loaded",
          description: "Your EPUB file is ready to read",
        });
      } catch (error) {
        console.error("Error loading EPUB:", error);
        setIsLoading(false);
        toast({
          variant: "error",
          title: "Loading Error",
          description: error instanceof Error ? error.message : "Failed to load EPUB file",
        });
      }
    };
    
    loadEpub();
  }, [url, toast]);

  // Display the current chapter
  useEffect(() => {
    if (!epubContent || !iframeRef.current) return;
    
    const chapter = epubContent.chapters[currentChapterIndex];
    if (!chapter) return;
    
    // Update current chapter title for SEO
    setCurrentChapterTitle(chapter.title);
    
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    
    // Determine text color based on theme
    const isDarkTheme = theme === 'dark';
    const textColor = isDarkTheme ? '#ffffff' : '#333333';
    const backgroundColor = isDarkTheme ? '#333333' : '#ffffff';
    const borderColor = isDarkTheme ? '#555555' : '#dddddd';
    const codeBackground = isDarkTheme ? '#222222' : '#f5f5f5';
    
    // Create a styled HTML document
    let html = chapter.content;
    
    // Common styles for both cases
    const commonStyles = `
      body {
        font-family: ${fontFamily}, serif;
        font-size: ${fontSize}%;
        line-height: 1.6;
        padding: 20px;
        margin: 0;
        color: ${textColor};
        background-color: ${backgroundColor};
      }
      
      /* Typography */
      h1, h2, h3, h4, h5, h6 {
        font-weight: 700;
        line-height: 1.2;
        margin-top: 1.5em;
        margin-bottom: 0.5em;
      }
      h1 {
        font-size: 2em;
        border-bottom: 1px solid ${borderColor};
        padding-bottom: 0.3em;
      }
      h2 {
        font-size: 1.75em;
      }
      h3 {
        font-size: 1.5em;
      }
      h4 {
        font-size: 1.25em;
      }
      h5 {
        font-size: 1em;
      }
      h6 {
        font-size: 0.85em;
        color: ${isDarkTheme ? '#bbbbbb' : '#666666'};
      }
      
      /* Links */
      a {
        color: ${isDarkTheme ? '#3b82f6' : '#2563eb'};
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
      
      /* Images */
      img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 1em auto;
        border-radius: 4px;
      }
      
      /* Lists */
      ul, ol {
        padding-left: 2em;
        margin: 1em 0;
      }
      li {
        margin-bottom: 0.5em;
      }
      
      /* Blockquotes */
      blockquote {
        border-left: 4px solid ${isDarkTheme ? '#555555' : '#dddddd'};
        padding-left: 1em;
        margin-left: 0;
        color: ${isDarkTheme ? '#bbbbbb' : '#666666'};
        font-style: italic;
      }
      
      /* Code blocks */
      pre, code {
        font-family: monospace;
        background-color: ${codeBackground};
        border-radius: 3px;
      }
      code {
        padding: 0.2em 0.4em;
        font-size: 0.9em;
      }
      pre {
        padding: 1em;
        overflow-x: auto;
      }
      pre code {
        padding: 0;
        background-color: transparent;
      }
      
      /* Tables */
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 1em 0;
      }
      th, td {
        border: 1px solid ${borderColor};
        padding: 0.5em;
        text-align: left;
      }
      th {
        background-color: ${isDarkTheme ? '#444444' : '#f0f0f0'};
      }
      
      /* Horizontal rule */
      hr {
        border: none;
        border-top: 1px solid ${borderColor};
        margin: 2em 0;
      }
      
      /* Paragraphs */
      p {
        margin: 1em 0;
      }
      
      /* First paragraph after headings */
      h1 + p, h2 + p, h3 + p, h4 + p, h5 + p, h6 + p {
        margin-top: 0.5em;
      }
    `;
    
    // If the content doesn't have HTML structure, wrap it
    if (!html.includes('<html')) {
      html = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>${epubContent.title} - ${chapter.title}</title>
            <meta name="description" content="Reading ${chapter.title} from ${epubContent.title}">
            <style>
              ${commonStyles}
            </style>
          </head>
          <body>
            ${html}
          </body>
        </html>
      `;
    } else {
      // If it has HTML structure, inject our styles and metadata
      if (!html.includes('<html lang=')) {
        html = html.replace('<html', '<html lang="en"');
      }
      
      // Add title if missing
      if (!html.includes('<title>')) {
        html = html.replace('</head>', `<title>${epubContent.title} - ${chapter.title}</title></head>`);
      }
      
      // Add meta description if missing
      if (!html.includes('<meta name="description"')) {
        html = html.replace('</head>', `<meta name="description" content="Reading ${chapter.title} from ${epubContent.title}"></head>`);
      }
      
      // Add our styles
      html = html.replace('</head>', `
        <style>
          ${commonStyles}
        </style>
      </head>`);
    }
    
    doc.open();
    doc.write(html);
    doc.close();
    
  }, [epubContent, currentChapterIndex, fontSize, fontFamily, theme]);

  const handlePrevPage = () => {
    if (!epubContent || isLoading) return;
    
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(currentChapterIndex - 1);
      // Scroll to top when navigating to previous chapter
      if (iframeRef.current && iframeRef.current.contentWindow) {
        setTimeout(() => {
          iframeRef.current?.contentWindow?.scrollTo(0, 0);
        }, 100);
      }
    }
  };

  const handleNextPage = () => {
    if (!epubContent || isLoading) return;
    
    if (currentChapterIndex < epubContent.chapters.length - 1) {
      setCurrentChapterIndex(currentChapterIndex + 1);
      // Scroll to top when navigating to next chapter
      if (iframeRef.current && iframeRef.current.contentWindow) {
        setTimeout(() => {
          iframeRef.current?.contentWindow?.scrollTo(0, 0);
        }, 100);
      }
    }
  };

  const handleTocItemClick = (href: string) => {
    if (!epubContent || isLoading) return;
    
    const index = parseInt(href, 10);
    if (!isNaN(index) && index >= 0 && index < epubContent.chapters.length) {
      setCurrentChapterIndex(index);
      setShowToc(false);
      // Scroll to top when navigating via TOC
      if (iframeRef.current && iframeRef.current.contentWindow) {
        setTimeout(() => {
          iframeRef.current?.contentWindow?.scrollTo(0, 0);
        }, 100);
      }
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrevPage();
      } else if (e.key === "ArrowRight") {
        handleNextPage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [epubContent, currentChapterIndex, isLoading]);

  // Generate structured data for SEO
  const generateStructuredData = () => {
    if (!epubContent) return null;
    
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Book",
      "name": epubContent.title,
      "readingOrder": epubContent.chapters.map((chapter, index) => ({
        "@type": "Chapter",
        "name": chapter.title,
        "position": index + 1
      }))
    };
    
    return JSON.stringify(structuredData);
  };

  // Function to download book metadata as XML
  const downloadMetadataXml = () => {
    if (!bookMetadata) return;
    
    try {
      const xml = generateEpubMetadataXml(bookMetadata);
      
      // Create a blob with the XML content
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${bookMetadata.title.replace(/\s+/g, '-').toLowerCase()}-metadata.xml`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        variant: "success",
        title: "XML Downloaded",
        description: "Book metadata XML has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error generating XML:", error);
      toast({
        variant: "error",
        title: "Download Failed",
        description: "Failed to generate XML file.",
      });
    }
  };

  return (
    <>
      {epubContent && (
        <Head>
          <title>{epubContent.title} - Online EPUB Reader</title>
          <meta name="description" content={`Read ${epubContent.title} online with our EPUB reader. Currently reading: ${currentChapterTitle}`} />
          <meta property="og:title" content={`${epubContent.title} - Online EPUB Reader`} />
          <meta property="og:description" content={`Read ${epubContent.title} online with our EPUB reader.`} />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:title" content={`${epubContent.title} - Online EPUB Reader`} />
          <meta name="twitter:description" content={`Read ${epubContent.title} online with our EPUB reader.`} />
          <script type="application/ld+json">{generateStructuredData()}</script>
        </Head>
      )}
      
      <div className="flex flex-col md:flex-row h-[calc(100vh-12rem)] gap-4" role="main" aria-label="EPUB Reader">
        {/* Mobile TOC toggle */}
        <div className="md:hidden mb-4">
          <Button
            variant="outline"
            onClick={() => setShowToc(!showToc)}
            className="border-2 border-[#222222] dark:border-[#F5F5F5] shadow-[4px_4px_0px_rgba(0,0,0,0.9)] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.9)] hover:shadow-[2px_2px_0px_rgba(0,0,0,0.9)] dark:hover:shadow-[2px_2px_0px_rgba(255,255,255,0.9)] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_rgba(0,0,0,0.9)]"
            aria-expanded={showToc}
            aria-controls="mobile-toc"
          >
            <Menu className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>{showToc ? "Hide" : "Show"} Table of Contents</span>
          </Button>
        </div>

        {/* Table of Contents - Mobile (Collapsible) */}
        {showToc && (
          <div 
            id="mobile-toc"
            className="md:hidden bg-white dark:bg-[#333333] p-4 rounded-lg border-2 border-[#222222] dark:border-[#F5F5F5] shadow-[5px_5px_0px_rgba(0,0,0,0.9)] dark:shadow-[5px_5px_0px_rgba(255,255,255,0.9)] mb-4 overflow-y-auto max-h-60"
            role="navigation"
            aria-label="Table of Contents"
          >
            <h3 className="font-heading text-lg font-bold mb-2">Table of Contents</h3>
            <ul className="space-y-1">
              {toc.map((item, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleTocItemClick(item.href)}
                    className="text-left w-full py-1 px-2 hover:bg-[#0055FF]/10 rounded transition-colors"
                    aria-current={currentChapterIndex === index ? "page" : undefined}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Main content area */}
        <div 
          className="flex-1 relative bg-white dark:bg-[#333333] rounded-lg border-2 border-[#222222] dark:border-[#F5F5F5] shadow-[8px_8px_0px_rgba(0,0,0,0.9)] dark:shadow-[8px_8px_0px_rgba(255,255,255,0.9)]"
          role="region"
          aria-label="Book Content"
        >
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-[#333333]/80 z-10" aria-live="polite">
              <div className="flex flex-col items-center">
                <div className="h-8 w-8 border-4 border-[#FF0055] border-t-transparent rounded-full animate-spin mb-2" aria-hidden="true"></div>
                <p className="text-sm font-medium">Loading book...</p>
              </div>
            </div>
          ) : (
            <iframe 
              ref={iframeRef}
              className="w-full h-full border-0"
              title={epubContent?.title ? `${epubContent.title} - ${currentChapterTitle}` : "EPUB Reader"}
              sandbox="allow-same-origin allow-scripts"
              aria-label={`Reading ${currentChapterTitle}`}
            />
          )}

          {/* Navigation buttons */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4" role="navigation" aria-label="Chapter Navigation">
            <Button
              onClick={handlePrevPage}
              variant="outline"
              disabled={isLoading || currentChapterIndex === 0}
              className="border-2 border-[#222222] dark:border-[#F5F5F5] shadow-[4px_4px_0px_rgba(0,0,0,0.9)] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.9)] hover:shadow-[2px_2px_0px_rgba(0,0,0,0.9)] dark:hover:shadow-[2px_2px_0px_rgba(255,255,255,0.9)] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_rgba(0,0,0,0.9)] disabled:opacity-50 disabled:shadow-none"
              aria-label="Previous Chapter"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Previous Chapter</span>
            </Button>
            
            {/* XML Download Button */}
            {bookMetadata && (
              <Button
                onClick={downloadMetadataXml}
                variant="outline"
                disabled={isLoading}
                className="border-2 border-[#222222] dark:border-[#F5F5F5] shadow-[4px_4px_0px_rgba(0,0,0,0.9)] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.9)] hover:shadow-[2px_2px_0px_rgba(0,0,0,0.9)] dark:hover:shadow-[2px_2px_0px_rgba(255,255,255,0.9)] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_rgba(0,0,0,0.9)] disabled:opacity-50 disabled:shadow-none"
                aria-label="Download XML Metadata"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Download XML</span>
              </Button>
            )}
            
            <Button
              onClick={handleNextPage}
              variant="outline"
              disabled={isLoading || !epubContent || currentChapterIndex >= epubContent.chapters.length - 1}
              className="border-2 border-[#222222] dark:border-[#F5F5F5] shadow-[4px_4px_0px_rgba(0,0,0,0.9)] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.9)] hover:shadow-[2px_2px_0px_rgba(0,0,0,0.9)] dark:hover:shadow-[2px_2px_0px_rgba(255,255,255,0.9)] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_rgba(0,0,0,0.9)] disabled:opacity-50 disabled:shadow-none"
              aria-label="Next Chapter"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Next Chapter</span>
            </Button>
          </div>
        </div>

        {/* Table of Contents - Desktop (Always visible) */}
        <div 
          className="hidden md:block w-64 bg-white dark:bg-[#333333] p-4 rounded-lg border-2 border-[#222222] dark:border-[#F5F5F5] shadow-[5px_5px_0px_rgba(0,0,0,0.9)] dark:shadow-[5px_5px_0px_rgba(255,255,255,0.9)] overflow-y-auto"
          role="navigation"
          aria-label="Table of Contents"
        >
          <h3 className="font-heading text-lg font-bold mb-2">Table of Contents</h3>
          <ul className="space-y-1">
            {toc.map((item, index) => (
              <li key={index}>
                <button
                  onClick={() => handleTocItemClick(item.href)}
                  className="text-left w-full py-1 px-2 hover:bg-[#0055FF]/10 rounded transition-colors"
                  aria-current={currentChapterIndex === index ? "page" : undefined}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}

