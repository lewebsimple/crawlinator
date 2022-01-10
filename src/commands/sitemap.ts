import { $fetch } from "ohmyfetch";
import cheerio, { CheerioAPI } from "cheerio";
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

  console.log(`Crawling XML sitemap ${url}...`);
  const response = await $fetch(url);

  const urls = getUrlsFromSitemap(response);

  // TODO Crawl links inside pages (href, src, )

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
