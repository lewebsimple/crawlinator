import { $fetch } from "ohmyfetch";
import cheerio from "cheerio";

const urls: string[] = [];

// Fetch a single URL and log the status message
export async function fetchUrl(url: string): Promise<string> {
  // Skip URL if already fetched
  if (urls.includes(url)) {
    return "";
  }
  urls.push(url);

  // Perform fetch request
  return await $fetch(url, {
    onResponse: async (response) => {
      const status = response.response.status;
      console.log(`${status} - ${url}`);
    },
    responseType: "text",
  }).catch(() => {
    return "";
  });
}

// Crawl web site
export async function crawl(url: string): Promise<void> {
  try {
    const { origin } = new URL(url);
    const content = await fetchUrl(origin);

    // Crawl sitemap.xml
    const sitemapUrl = `${origin}/sitemap.xml`;
    const sitemap = await fetchUrl(sitemapUrl);
    const $ = cheerio.load(sitemap, { xmlMode: true });
    const locs = $("loc").map((i, loc) => $(loc).text());
    for (const loc of locs) {
      const content = await fetchUrl(loc);
      const contentUrls = getUrlsFromContent(content);
      for (const contentUrl of contentUrls) {
        await fetchUrl(contentUrl);
      }
    }
  } catch (error) {
    console.log(`Could not crawl ${url}`);
  }
}

// Parse HTML content for URLs to crawl
function getUrlsFromContent(content: string): string[] {
  const urls: string[] = [];

  const $ = cheerio.load(content);

  // href
  $("a").each((i, link) => {
    const href = $(link).attr("href");
    if (href) {
      urls.push(href);
    }
  });

  // src
  $("img,script,style").each((i, img) => {
    const src = $(img).attr("src");
    if (src) {
      urls.push(src);
    }
  });

  return urls;
}
