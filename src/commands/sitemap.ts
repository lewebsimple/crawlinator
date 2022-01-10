import type { Arguments, CommandBuilder } from "yargs";
import { crawlUrl } from "../utils/crawl";

type Options = {
  url: string;
};

export const command = "$0 <url>";
export const desc = "Crawl XML sitemap at <url>";

export const builder: CommandBuilder<Options, Options> = (yargs) =>
  yargs.positional("url", { type: "string", demandOption: true });

export const handler = async (argv: Arguments<Options>): Promise<void> => {
  const { url } = argv;

  try {
    const website = new URL(url);
    await crawlUrl(website.origin);
  } catch (error) {
    throw new Error("Invalid URL");
  }

  process.exit(0);
};
