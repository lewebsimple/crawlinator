import type { Page } from "playwright";
import * as v from "valibot";
import { chromium } from "playwright";
import { load } from "cheerio";
import logger from "./logger";
import type { CrawlLink, CrawlResult } from "./schemas";
import { crawlResultSchema, crawlUrlSchema } from "./schemas";
import { checkLink, normalizeUrl, shouldCrawl } from "./utils";

type CrawlOptions = {
  depth: number;
  hideExternal: boolean;
  hideSuccess: boolean;
};
/**
 * Crawl a URL and return the result
 *
 * @param url Starting URL for crawling
 * @param options Crawl options
 * @returns Crawl result
 */
export async function crawl(url: string, { depth, hideExternal, hideSuccess }: CrawlOptions): Promise<Map<string, CrawlResult>> {
  // Create browser instance
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Crawl the page
  const results = new Map<string, CrawlResult>();
  await crawlPage(url, depth, results, page, new URL(url).origin);

  // Hide external links
  if (hideExternal) {
    const origin = new URL(url).origin;
    results.forEach((result) => {
      result.links.forEach((link) => {
        if (!link.url.startsWith(origin)) {
          result.links.delete(link);
        }
      });
    });
  }

  // Hide result links that are successful
  if (hideSuccess) {
    results.forEach((result) => {
      result.links.forEach((link) => {
        if (link.status >= 200 && link.status < 400) {
          result.links.delete(link);
        }
      });
    });
  }

  // Close browser instance
  await browser.close();

  return results;
}

/**
 * Crawl a page and verify its links
 * @param url Page URL
 * @param depth Maximum depth to crawl
 * @param results Results of the crawl
 * @param page Playwright page instance
 * @param baseUrl Base URL for relative links
 */
async function crawlPage(
  url: string,
  depth: number,
  results: Map<string, CrawlResult>,
  page: Page,
  baseUrl: string,
): Promise<void> {
  try {
    // Normalize URLs
    baseUrl = v.parse(crawlUrlSchema, baseUrl);
    url = normalizeUrl(url, baseUrl);

    // Check if the URL has already been crawled or the depth limit has been reached
    if (results.has(url) || depth <= 0) return;

    // Intercept requests
    const links = new Set<CrawlLink>();
    await page.route("**/*", async (route) => {
      switch (route.request().resourceType()) {
        case "stylesheet":
        case "image":
        case "media":
        case "font":
          route.abort();
          links.add(await checkLink(route.request().url(), baseUrl));
          break;
        default:
          route.continue();
          break;
      }
    });

    // Get the page content
    logger.info(`Crawling: ${url}`);
    let content: string;
    if (url.includes(".xml")) {
      const response = await fetch(url);
      content = await response.text();
    }
    else {
      const response = await page.goto(url, { waitUntil: "domcontentloaded" });
      if (!response) throw new Error(`Could not open page: ${url}`);
      const contentType = response.headers()["content-type"];
      if (!contentType.includes("text/html")) {
        logger.warn(`Skipping non-HTML page: ${url}`);
        return;
      }
      content = await page.content();
    }

    // Extract links from the page content
    await extractLinks(content, baseUrl, links);

    // Append the crawl result
    results.set(url, v.parse(crawlResultSchema, { url, links }));

    // Recursively crawl the internal links
    const internalLinks = Array.from(links).filter((link) => shouldCrawl(link.url, baseUrl));
    for (const link of internalLinks) {
      await crawlPage(link.url, depth - 1, results, page, baseUrl);
    }
  }
  catch (error) {
    const message = error instanceof Error ? error.message : "Could not crawl URL";
    logger.error(message);
  }
}

/**
 * Extract URLs from a page
 * @param page Playwright page instance
 * @param baseUrl Base URL for relative links
 * @returns Extracted URLs
 */
async function extractLinks(content: string, baseUrl: string, links: Set<CrawlLink>): Promise<void> {
  const $ = load(content);
  const { hrefUrls = [], srcUrls = [], locUrls = [] } = $.extract({
    hrefUrls: [{ selector: "a", value: "href" }],
    srcUrls: [{ selector: "[src]", value: "src" }],
    locUrls: ["loc"],
  });
  const urls = [...hrefUrls, ...srcUrls, ...locUrls];
  for (const url of urls) {
    if (!url) continue;
    links.add(await checkLink(url, baseUrl));
  }
}
