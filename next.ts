import { createLogger } from "../logging"
import { bumpBuild, bumpMajor, bumpMinor, compareVersion, getInitialVersion, getStableChannel, isTagExact, isTagSemver, sortedTags } from "./versioning"
import { NextVersionPayload, ReleaseRequest } from "./types"

const logger = createLogger(__filename)

export const determineNextVersion = ({config, tags, headCommit}): NextVersionPayload => {
    const prodTags = sortedTags(tags.filter( tag => isTagSemver(tag) && (tag.name.includes(getStableChannel(config).name) || isTagExact(tag))), config)
    const buildTags = sortedTags(tags.filter( tag => isTagSemver(tag) && tag.name.includes(config.channels[0].name)), config)

    if (prodTags.length == 0 && buildTags.length == 0) {
        logger.debug(`No tags found - creating initial version`)
        return {headCommit: headCommit.id, next: getInitialVersion(config), previousSha: null };
    }

    const latest = prodTags.length ? prodTags[0] : null
    const latestBuild = buildTags.length ? buildTags[0] : null
    const cmp = compareVersion(latest?.name, latestBuild?.name, config)
    const lastRelease = buildTags.length  === 0 || cmp === -1 ? latest : latestBuild
    let next = lastRelease.name;

    if (cmp === -1) {
        logger.debug(`Found latest build ${latestBuild?.name} - bumping minor`)
        next = bumpMinor(lastRelease.name, config)
    } 

    if (headCommit.message.includes(config.release_trigger.bumpMajorToken)) {
        logger.debug(`release.getNextVersion: Found bump major token - bumping major`)
        next = bumpMajor(lastRelease.name, config)
    }

    // do getLastRelease
    logger.debug(`release.getNextVersion: Found latest release ${lastRelease?.name} - bumping build`)
    next = bumpBuild(next, config)
    return {next, headCommit: headCommit.id, previousSha: null}
}