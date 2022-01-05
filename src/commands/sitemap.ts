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

  console.log(`Crawling XML sitemap ${url}...`);
  const response = await $fetch(url);

  const $ = cheerio.load(response, { xmlMode: true });
  const pages: string[] = [];
  $("loc").each((i, loc) => {
    pages.push($(loc).text());
  });

  // TODO Crawl links inside pages (href, src, )

  process.exit(0);
};
