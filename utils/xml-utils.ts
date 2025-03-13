/**
 * Utility functions for generating XML files from EPUB metadata
 */

interface EpubMetadata {
  title: string;
  creator?: string;
  publisher?: string;
  language?: string;
  identifier?: string;
  date?: string;
  description?: string;
  subjects?: string[];
  rights?: string;
  chapters: {
    id: string;
    title: string;
    href: string;
  }[];
}

/**
 * Generate an XML representation of EPUB metadata
 */
export function generateEpubMetadataXml(metadata: EpubMetadata): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<epub-metadata xmlns="http://www.idpf.org/2007/opf">
  <metadata>
    <title>${escapeXml(metadata.title)}</title>
    ${metadata.creator ? `<creator>${escapeXml(metadata.creator)}</creator>` : ''}
    ${metadata.publisher ? `<publisher>${escapeXml(metadata.publisher)}</publisher>` : ''}
    ${metadata.language ? `<language>${escapeXml(metadata.language)}</language>` : ''}
    ${metadata.identifier ? `<identifier>${escapeXml(metadata.identifier)}</identifier>` : ''}
    ${metadata.date ? `<date>${escapeXml(metadata.date)}</date>` : ''}
    ${metadata.description ? `<description>${escapeXml(metadata.description)}</description>` : ''}
    ${metadata.rights ? `<rights>${escapeXml(metadata.rights)}</rights>` : ''}
    ${metadata.subjects ? metadata.subjects.map(subject => `<subject>${escapeXml(subject)}</subject>`).join('\n    ') : ''}
  </metadata>
  <manifest>
    ${metadata.chapters.map(chapter => 
      `<item id="${escapeXml(chapter.id)}" href="${escapeXml(chapter.href)}" media-type="application/xhtml+xml" />`
    ).join('\n    ')}
  </manifest>
  <spine>
    ${metadata.chapters.map(chapter => 
      `<itemref idref="${escapeXml(chapter.id)}" />`
    ).join('\n    ')}
  </spine>
</epub-metadata>`;

  return xml;
}

/**
 * Generate an OPDS (Open Publication Distribution System) catalog XML
 * OPDS is a syndication format for electronic publications based on Atom
 */
export function generateOpdsXml(books: EpubMetadata[]): string {
  const now = new Date().toISOString();
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"
      xmlns:dc="http://purl.org/dc/terms/"
      xmlns:opds="http://opds-spec.org/2010/catalog">
  <id>urn:uuid:${generateUuid()}</id>
  <title>EPUB Reader Library</title>
  <updated>${now}</updated>
  <author>
    <name>EPUB Reader</name>
    <uri>https://epub-reader-delta.vercel.app</uri>
  </author>
  <link rel="self" href="https://epub-reader-delta.vercel.app/catalog.xml" type="application/atom+xml;profile=opds-catalog;kind=acquisition"/>
  <link rel="start" href="https://epub-reader-delta.vercel.app/catalog.xml" type="application/atom+xml;profile=opds-catalog;kind=acquisition"/>
  
  ${books.map(book => `
  <entry>
    <title>${escapeXml(book.title)}</title>
    <id>urn:uuid:${generateUuid()}</id>
    <updated>${now}</updated>
    ${book.creator ? `<author><name>${escapeXml(book.creator)}</name></author>` : ''}
    ${book.description ? `<summary>${escapeXml(book.description)}</summary>` : ''}
    ${book.language ? `<dc:language>${escapeXml(book.language)}</dc:language>` : ''}
    ${book.publisher ? `<dc:publisher>${escapeXml(book.publisher)}</dc:publisher>` : ''}
    ${book.subjects ? book.subjects.map(subject => `<category term="${escapeXml(subject)}" />`).join('\n    ') : ''}
    <link rel="http://opds-spec.org/acquisition" href="https://epub-reader-delta.vercel.app/reader?book=${encodeURIComponent(book.identifier || book.title)}" type="application/epub+zip"/>
  </entry>`).join('\n  ')}
</feed>`;

  return xml;
}

/**
 * Generate a simple XML sitemap for books
 */
export function generateBookSitemapXml(books: EpubMetadata[]): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${books.map(book => `
  <url>
    <loc>https://epub-reader-delta.vercel.app/reader?book=${encodeURIComponent(book.identifier || book.title)}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n  ')}
</urlset>`;

  return xml;
}

/**
 * Escape special characters for XML
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Generate a simple UUID
 */
function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
} 