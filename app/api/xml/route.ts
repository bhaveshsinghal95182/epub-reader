import { NextRequest, NextResponse } from 'next/server';
import { generateEpubMetadataXml, generateOpdsXml } from '@/utils/xml-utils';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');
  const bookId = searchParams.get('bookId');
  
  // Sample book data - in a real app, this would come from a database
  const sampleBook = {
    title: "Sample Book",
    creator: "John Doe",
    publisher: "Sample Publisher",
    language: "en",
    identifier: "sample-book-1",
    date: "2023-06-01",
    description: "This is a sample book description.",
    subjects: ["Fiction", "Adventure"],
    rights: "All rights reserved",
    chapters: [
      { id: "chapter1", title: "Chapter 1", href: "chapter1.html" },
      { id: "chapter2", title: "Chapter 2", href: "chapter2.html" },
      { id: "chapter3", title: "Chapter 3", href: "chapter3.html" }
    ]
  };
  
  // If a specific book is requested
  if (type === 'book' && bookId) {
    // In a real app, you would fetch the book data from a database
    // For this example, we'll just use the sample book
    
    const xml = generateEpubMetadataXml(sampleBook);
    
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'max-age=3600'
      }
    });
  }
  
  // If a catalog is requested
  if (type === 'catalog') {
    const books = [sampleBook];
    // In a real app, you would fetch multiple books from a database
    
    const xml = generateOpdsXml(books);
    
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'max-age=3600'
      }
    });
  }
  
  // Default response if no valid type is provided
  return new NextResponse('Invalid request. Please specify a valid type parameter.', {
    status: 400,
    headers: {
      'Content-Type': 'text/plain'
    }
  });
} 