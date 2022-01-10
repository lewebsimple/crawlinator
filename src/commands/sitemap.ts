import { $fetch } from "ohmyfetch";
import cheerio from "cheerio";
import type { Arguments, CommandBuilder } from "yargs";

type Options = {
  url: string;
};

export const command = "$0 <url>";
export const desc = "Crawl XML sitemap at <url>";

export const builder: CommandBuilder<Options, Options> = (yargs) =>
  yargs.positional("url", { type: "string", demandOption: true });

export const handler = async (argv: Arguments<Options>): Promise<void> => {
  const { url } = argv;

  const urls = getUrlsFromSitemap(await $fetch(url));
  for (const pageUrl of urls) {
    urls.push(...getUrlsFromPage(await $fetch(pageUrl)));
  }

  process.exit(0);
};

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
