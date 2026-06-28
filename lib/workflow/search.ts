import { tavily } from '@tavily/core';
import 'dotenv/config';

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

/**
 * Searches the web and returns a list of results with titles, links, and snippets.
 */
export async function generalSearch(query: string): Promise<SearchResult[]> {
  try {
    console.log(`Searching web for: "${query}"...`);
    const response = await tvly.search(query, {
      searchDepth: 'advanced',
      maxResults: 8,
    });

    return response.results.map((result) => ({
      title: result.title,
      url: result.url,
      content: result.content,
    }));
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

/**
 * Scrapes the full content of a specific URL.
 */
export async function getLinkContent(url: string) {
  try {
    console.log(`Scraping content from: ${url}...`);
    const response = await tvly.extract([url]);
    return response.results[0]?.rawContent || '';
  } catch (error) {
    console.error(`Scraping error for ${url}:`, error);
    return '';
  }
}
