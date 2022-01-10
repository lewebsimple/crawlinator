import { $fetch } from "ohmyfetch";
import cheerio from "cheerio";

export async function crawlUrl(url: string): Promise<string> {
  return await $fetch(url, {
    onResponse: async (response) => {
      const status = response.response.status.toString();
      console.log(`${status} - ${url}`);
    },
  }).catch(() => {
    return "";
  });
}

function getUrlsFromSitemap(sitemap: string): string[] {
  const urls: string[] = [];

  const $sitemap = cheerio.load(sitemap, { xmlMode: true });
  $sitemap("loc").each((i, loc) => {
    urls.push($sitemap(loc).text());
  });

  return urls;
}

function getUrlsFromPage(page: string): string[] {
  const urls: string[] = [];

  const $page = cheerio.load(page);

  // a href
  $page("a").each((i, link) => {
    const href = $page(link).attr("href");
    if (href && href.startsWith("http")) {
      urls.push(href);
    }
  });

  // img src
  $page("img").each((i, img) => {
    const src = $page(img).attr("src");
    if (src) {
      urls.push(src);
    }
  });

  return urls;
}
