import * as v from "valibot";
import { normalizeUrl } from "./utils";

// Crawl URL normalization
export const crawlUrlSchema = v.pipe(v.string(), v.url(), v.transform(normalizeUrl));
export type CrawlUrl = v.InferOutput<typeof crawlUrlSchema>;

// Crawl link
export const crawlLinkSchema = v.object({
  url: crawlUrlSchema,
  status: v.number(),
  error: v.optional(v.string()),
});
export type CrawlLink = v.InferOutput<typeof crawlLinkSchema>;

// Crawl result for a single page
export const crawlResultSchema = v.object({
  url: crawlUrlSchema,
  links: v.set(crawlLinkSchema),
});
export type CrawlResult = v.InferOutput<typeof crawlResultSchema>;
