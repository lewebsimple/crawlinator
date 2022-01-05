#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

yargs(hideBin(process.argv))
  .scriptName("crawlinator")
  .commandDir("commands", {
    extensions: process.argv[0].includes("ts-node") ? ["js", "ts"] : ["js"],
  })
  .strict()
  .alias({ h: "help" })
  .help().argv;
