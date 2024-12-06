import consola from "consola";

const logger = consola.create({
  defaults: {
    tag: "crawlinator",
  },
  stdout: process.stderr,
});

export default logger;
