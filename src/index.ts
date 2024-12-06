#!/usr/bin/env node

import { Command } from "commander";
import { version } from "../package.json";
import logger from "./logger";
import { crawl } from "./crawl";
import { report } from "./report";

const program = new Command();
program
  .name("crawlinator")
  .version(version)
  .argument("<url>", "The base URL to check")
  .option("-d, --depth <number>", "The maximum depth to crawl", "1")
  .option("-f, --format <type>", "The output format (list or csv)", "list")
  .option("--hide-success", "Hide successful links", false)
  .option("--hide-external", "Hide external links", false)
  .showHelpAfterError(true)
  .action(async (url: string, options) => {
    try {
      const results = await crawl(url, {
        depth: parseInt(options.depth),
        hideSuccess: options.hideSuccess,
        hideExternal: options.hideExternal,
      });
      report(results, options.format);
    }
    catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      logger.error(message);
      process.exit(1);
    }
  });

program.parse();
