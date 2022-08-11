import type { Arguments, CommandBuilder } from "yargs";
import { crawl } from "../utils/crawling";

type Options = {
  url: string;
  errorsOnly: boolean;
};

export const command = "$0 <url>";
export const desc = "Crawl web site or sitemap at <url>";

export const builder: CommandBuilder<Options, Options> = (yargs) =>
  yargs.positional("url", { type: "string", demandOption: true }).option("e", {
    alias: "errors-only",
    boolean: true,
    default: false,
    description: "Affiche seulement les erreurs",
  });

export const handler = async (argv: Arguments<Options>): Promise<void> => {
  const { url, errorsOnly } = argv;
  await crawl(url, { errorsOnly });
  process.exit(0);
};
