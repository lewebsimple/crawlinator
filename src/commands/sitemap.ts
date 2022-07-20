import type { Arguments, CommandBuilder } from "yargs";
import { crawl } from "../utils/crawling";

type Options = {
  url: string;
};

export const command = "$0 <url>";
export const desc = "Crawl web site at <url>";

export const builder: CommandBuilder<Options, Options> = (yargs) =>
  yargs.positional("url", { type: "string", demandOption: true });

export const handler = async (argv: Arguments<Options>): Promise<void> => {
  const { url } = argv;

  await crawl(url);

  process.exit(0);
};
