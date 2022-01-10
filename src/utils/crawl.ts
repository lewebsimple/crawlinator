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
    const content = await fetchUrl(url);

    const { origin, pathname } = new URL(url);
    const extension = pathname.includes(".") ? pathname.split(".").pop() || "" : "";
    if (["", "xml"].includes(extension)) {
      const contentUrls = getUrlsFromContent(content);
      for (const contentUrl of contentUrls) {
        if (contentUrl.startsWith(origin)) await crawl(contentUrl);
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

  // loc
  $("loc").each((i, loc) => {
    urls.push($(loc).text());
  });

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
