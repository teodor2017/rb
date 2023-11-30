import { Command } from "commander";
import { version } from "../package.json";
const program = new Command();

program
  .name('poe')
  .description('poe cli')
  .version(version);

program.command('server')
  .description('start listening for github webhooks')
  .option('-p, --port <int>', 'port to listen on', "3000")
  .action((str, options) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const server = require("./server");
    server.startServer(options.port);
  });

export {program}