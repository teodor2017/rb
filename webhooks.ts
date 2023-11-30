import { app } from "../github/app";
import { determineNextVersion } from "../release/next";
import { getTags, putCheck } from "./service";
import { loadConfiguration } from "../configuration/loader";
import { createLogger } from "../logging";
import { processReleaseRequest } from "../release/process";
import { NextVersionPayload, ReleaseRequest } from "../release/types";
import { promoteRelease } from "../release/promote";
import { getInitialVersion } from "../release/versioning";

const logger = createLogger(__filename)


app.webhooks.on("issue_comment", async ({ payload, octokit }) => {
    if (payload.issue.user.login === "release-bot" && payload.comment.body.includes("approve")) {
        // approve mechanism here
    }
})

app.webhooks.on("check_run.completed", async ({ id, name, payload, octokit }) => {
    const app_name = (await import("@/github/app")).APP_NAME
    logger.debug(`check_run.completed: ${payload.check_run.app.name} ${payload.check_run.conclusion}`)
    // check approval mechanism here
    // if builds are successful, approve release
    // if builds are not successful, do not approve release
    // if check_run author is release-bot and check_run is successful, promote release

    if (payload.check_run.app.name !== app_name) {
        // enforce approval mechanism here
        // putCheck
    }

    if (payload.check_run.app.name === app_name && payload.check_run.conclusion === "success" ) {
        const request = JSON.parse(payload.check_run.output.text)
        promoteRelease({payload, octokit, request})
    }
})

app.webhooks.on("push", async ({payload, octokit}) => {
    let config

    logger.debug(`push: ${payload.repository.owner.login}/${payload.repository.name}`)
    try {
        config = await loadConfiguration(payload.repository.owner.login, payload.repository.name, octokit, payload.after)
        logger.debug(`Configuration loaded`)
    } catch (e) {
        logger.warn(`Failed to load configuration: ${e.message}`)
    }

    let next: NextVersionPayload =  {
        next: getInitialVersion(config),
        headCommit: payload.head_commit.id,
        previousSha: null,
    }

    const tags = await getTags(payload.repository.name, payload.repository.owner.login,  octokit)

    if (tags.length > 0) {
        logger.debug(`Found ${tags.length} tags`)
        next = determineNextVersion({config, tags, headCommit: payload.head_commit})
    }

    const request: ReleaseRequest = {
        next,
        config,
        approvers: true,
        runs: true,
        completed: false,
    }


    // executing the request, maybe we can get an instant release
    logger.debug(`processReleaseRequest: ${JSON.stringify(request)}`)
    const processed = await processReleaseRequest(payload, octokit, request)

    
    const output = {
        title: `Release ${next.next}`,
        summary: `Release ${next.next} is being enqued.`,
        // text: `${JSON.stringify(processed)}`,
    }

    // Own check runs are used as state 
    putCheck(
        payload.repository.owner.login,
        payload.repository.name,
        payload.head_commit.id,
        next.next,
        "in_progress",
        "neutral",
        // processed.completed ? "completed" :"in_progress",
        // processed.completed ? "success" : "neutral",
        output,
        octokit,
    )

    // processRelease
})


export {app};