import { getChannelConfig } from "../configuration/loader"
import { ReleaseRequest } from "./types"
import { createRelease, createTag } from "../github/service";
import { extractTokensFromTag } from "./versioning";
import { GateResponse, gates } from "../gate/gate";

export const postRelease = async (payload, octokit, request: ReleaseRequest) => {
    const tag = await createTag(request.next.next, request.next.headCommit, payload.owner.login, payload.repository.name, request.next.next, octokit)

    const tokens = extractTokensFromTag(request.next.next, request.config)
    const chan = getChannelConfig(request.config, tokens.channel)
    return await createRelease(
        request.next.next, 
        "", // extract changelog
        payload.owner.login,
        payload.repository.name,
        chan.mark_as_prerelease,
        octokit
    )

}

export const processReleaseRequest = async (payload, octokit, request: ReleaseRequest) => {
    // assures if checks are successful.

    const promises: Promise<GateResponse>[] = []

    for (let index = 0; index < gates.length; index++) {
        promises.push(gates[index](payload, octokit, request));
    }

    Promise.all(promises).then( responses => {
        // Getting all output
        responses.map( response => {
            request[response.id] = response
        })

        // Checking if all gates are ok
        if (responses.every( response => response.ok)) {
            // create release
            postRelease(payload, octokit, request)
            request.completed = true
        }
    })

    return request
}
