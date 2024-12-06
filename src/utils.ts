import { request as httpRequest } from "http";
import { request as httpsRequest } from "https";

import type { CrawlLink, CrawlResult } from "./schemas";

/**
 * Normalize URL by sorting query parameters alphabetically and ensuring a trailing slash
 *
 * @param url URL to normalize
 * @returns Normalized URL
 */
export const normalizeUrl = (url: string, baseUrl?: string) => {
  try {
    const parsedUrl = new URL(url, baseUrl);

    // Ensure a trailing slash if the URL path is not empty
    if (parsedUrl.pathname && !parsedUrl.pathname.endsWith("/") && !parsedUrl.pathname.includes(".")) {
      parsedUrl.pathname += "/";
    }
    else if (parsedUrl.pathname === "/") {
      parsedUrl.pathname = "/";
    }

    // Sort query parameters alphabetically
    const params = [...parsedUrl.searchParams.entries()];
    params.sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

    // Clear and reset the search parameters
    parsedUrl.search = "";
    for (const [key, value] of params) {
      parsedUrl.searchParams.append(key, value);
    }

    return parsedUrl.toString();
  }
  catch (error) {
    const message = error instanceof Error ? error.message : "Invalid URL";
    throw new Error(message);
  }
};

// Cache for checked links
const links = new Map<string, CrawlLink>();

/**
 * Check if a link is valid
 *
 * @param url URL to check
 * @param baseUrl Base URL for relative links
 * @returns Crawl link
 */
export async function checkLink(url: string, baseUrl: string): Promise<CrawlLink> {
  try {
    // Normalize the URLs
    baseUrl = normalizeUrl(baseUrl);
    url = normalizeUrl(url, baseUrl);

    // Check the cache
    if (links.has(url)) return links.get(url) as CrawlLink;

    // Determine if https is required
    const isHttps = url.startsWith("https");
    const request = isHttps ? httpsRequest : httpRequest;

    // Check the link and cache the result
    const link = await new Promise<CrawlLink>((resolve, reject) => {
      const req = request(url, { method: "HEAD" }, (response) => {
        resolve({ url, status: response.statusCode || 0 });
      });
      req.on("error", (error) => {
        reject(error.message);
      });
      req.on("timeout", () => {
        req.destroy();
        reject("Request timed out");
      });
      req.end();
    });
    links.set(url, link);
    return link;
  }
  catch (error) {
    // Cache the error
    const link = { url, status: 0, error: error instanceof Error ? error.message : "Request failed" };
    links.set(url, link);
    return link;
  }
}

/**
 * Check if a URL should be crawled
 *
 * @param url The URL to check
 * @param baseUrl Base URL for relative links
 * @returns Whether the URL should be crawled
 */
export function shouldCrawl(url: string, baseUrl: string): boolean {
  const allowedExtensions = ["html", "php", "xml"];
  try {
    const { origin, pathname } = new URL(url, baseUrl);
    // Reject external links
    if (origin !== new URL(baseUrl).origin) return false;
    // Reject URLs with extensions not in the allowed list
    if (pathname.includes(".") && !allowedExtensions.includes(pathname.split(".").pop() || "")) return false;
    return true;
  }
  catch {
    return false;
  }
}

/**
 * Sort results by URL
 *
 * @param results Results to sort
 * @returns Sorted results
 */
export function sortResults(results: Map<string, CrawlResult>) {
  return new Map([...results.entries()].sort((a, b) => a[0].localeCompare(b[0])));
}

/**
 * Sort links by URL
 *
 * @param links Links to sort
 * @returns Array of sorted links
 */
export function sortLinks(links: Set<CrawlLink>) {
  return [...links].sort((a, b) => a.url.localeCompare(b.url));
}
