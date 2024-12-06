import chalk from "chalk";
import logger from "./logger";
import type { CrawlResult } from "./schemas";
import { sortLinks, sortResults } from "./utils";

// Colorize the status code
const colorStatus = (status: number) => {
  if (status >= 200 && status < 300) return chalk.green(status.toString());
  if (status >= 300 && status < 400) return chalk.blue(status.toString());
  return chalk.red(status.toString());
};

/**
 * Report the crawling results
 *
 * @param results Crawling results
 */
export function report(results: Map<string, CrawlResult>, format: "list" | "csv") {
  switch (format) {
    case "list":
      sortResults(results).forEach((result) => {
        logger.log(chalk.underline(result.url));
        sortLinks(result.links).forEach((link) => {
          if (link.error) {
            logger.log(`  ${colorStatus(link.status)} ${link.url} ${chalk.red(link.error)}`);
          }
          else {
            logger.log(`  ${colorStatus(link.status)} ${link.url}`);
          }
        });
      });
      break;

    case "csv":
      console.log("Referer,URL,Status,Error");
      sortResults(results).forEach((result) => {
        sortLinks(result.links).forEach((link) => {
          console.log(`${result.url},${link.url},${link.status},${link.error || ""}`);
        });
      });
      break;
  }
}
