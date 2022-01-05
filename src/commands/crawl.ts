import type { Arguments, CommandBuilder } from "yargs";

type Options = {
  url: string;
};

export const command = "$0 <url>";
export const desc = "Crawl links at <url>";

export const builder: CommandBuilder<Options, Options> = (yargs) =>
  yargs.positional("url", { type: "string", demandOption: true });

export const handler = (argv: Arguments<Options>): void => {
  const { url } = argv;
  console.log(`Crawling ${url}!`);
  process.exit(0);
};
