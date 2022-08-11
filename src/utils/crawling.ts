import { $fetch } from "ohmyfetch";
import { load } from "cheerio";
import chalk from "chalk";

interface UrlCache {
  status: number;
  links: string[];
  headings: Record<string, string[]>;
  crawled: boolean;
}
const urlCache: Record<string, UrlCache> = {};

let domain = "";

interface CrawlOptions {
  errorsOnly: boolean;
}

// Crawl URL
export async function crawl(url: string, { errorsOnly }: CrawlOptions) {
  if (!domain) {
    const { origin } = new URL(url);
    domain = origin;
  }
  process.stdout.write(`\n${chalk.blue(url)}\n`);
  const { links } = await fetchUrl(url);
  urlCache[url].crawled = true;

  // Headings
  if (!url.endsWith(".xml")) {
    if (urlCache[url].headings.h1.length === 1) {
      !errorsOnly && process.stdout.write(`  ${chalk.green("H1")} - ${urlCache[url].headings.h1[0]}\n`);
    } else if (urlCache[url].headings.h1.length > 1) {
      urlCache[url].headings.h1.forEach((h1) => process.stdout.write(`  ${chalk.red("H1")} - ${h1}\n`));
    } else {
      process.stdout.write(`  ${chalk.red("H1")} - (empty)\n`);
    }
  }

  // Links
  for (const link of links) {
    const { status } = await fetchUrl(link);
    switch (status) {
      case 200:
        !errorsOnly && process.stdout.write(`  ${chalk.green(status)} - ${link}\n`);
        break;
      default:
        process.stdout.write(`  ${chalk.red(status)} - ${link}\n`);
        break;
    }
  }

  for (const link of links) {
    if (shouldCrawl(link)) {
      await crawl(link, { errorsOnly });
    }
  }
}

// Fetch URL
async function fetchUrl(url: string): Promise<UrlCache> {
  if (!urlCache[url]) {
    let status = 0;
    const content = await $fetch(url, {
      responseType: "text",
      onResponse: async ({ response }) => {
        status = response.status;
      },
    }).catch(() => "");
    urlCache[url] = {
      status,
      links: getLinksFromContent(content),
      headings: getHeadingsFromContent(content),
      crawled: false,
    };
  }
  return urlCache[url];
}

// Get links from HTML content
function getLinksFromContent(content: string): string[] {
  const links: string[] = [];
  const $ = load(content);

  // loc
  $("loc").each((i, loc) => {
    links.push($(loc).text());
  });

  // href
  $("a").each((i, link) => {
    const href = $(link).attr("href");
    href && links.push(href);
  });

  // src
  $("img,script,style").each((i, img) => {
    const src = $(img).attr("src");
    if (src) {
      links.push(src);
    }
  });

  // Process returned links
  return links
    .map((link) => {
      if (link.startsWith("http")) return link;
      if (link.startsWith("/")) return `${domain}${link}`;
      return "";
    })
    .filter((link) => link.length);
}

function getHeadingsFromContent(content: string): Record<string, string[]> {
  const headings: Record<string, string[]> = {};
  const $ = load(content);
  ["h1", "h2"].forEach((tag) => {
    headings[tag] = $(tag)
      .map((_i, heading) => $(heading).text())
      .toArray();
  });
  return headings;
}

// Helper: Should URL be crawled
function shouldCrawl(url: string): boolean {
  // Don't crawl external URLs
  if (!url.startsWith(domain)) return false;

  // Crawl only once
  if (urlCache[url] && urlCache[url].crawled) return false;

  // Crawl only XML and empty extensions
  const { origin, pathname } = new URL(url);
  const extension = pathname.includes(".") ? pathname.split(".").pop() || "" : "";
  if (!["", "xml"].includes(extension)) return false;

  return true;
}
