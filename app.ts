import { App } from "@octokit/app";
import { paginateRest } from "@octokit/plugin-paginate-rest";
import { Octokit } from "@octokit/rest";
import { createLogger } from "../logging";

const logger = createLogger(__filename)


export let APP_NAME = ""

const BotApp = App.defaults({
  Octokit: Octokit.plugin(paginateRest)
})

const app = new BotApp({
  appId: process.env.GITHUB_APP_ID,
  privateKey: process.env.GITHUB_APP_PRIVATE_KEY,
  oauth: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  },
  webhooks: {
    secret: process.env.GITHUB_WEBHOOK_SECRET,
  },
});

(async () => {
  const { data } = await app.octokit.request("/app");
  logger.info("authenticated as %s", data.name);
  APP_NAME = data.name
})()


export { app }