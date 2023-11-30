import { GithubTag } from "../github/types";
import { Channel, Configuration } from "../configuration/types";
import { createLogger } from "../logging";

const logger = createLogger(__filename)

interface VersionTokens {
    major: number
    minor: number
    patch: number
    build: number
    channel: string
}

export const isTagSemver = (tag: GithubTag) => /^(v?\d+\.\d+\.\d+)(-\w+)?(\.\d+)?(.*)?/.test(tag.name)

export const isTagExact = (tag: GithubTag) => /^v?\d+\.\d+\.\d+$/.test(tag.name)

export const cleanVersion = (v: string) => v.replace(/-\w+(\.\d+)?(.*)?/i, '')


export const compareVersion = (a: string, b: string, config: Configuration) => {
    //returning -1 if b is greater and 1 if a is greater
    if (a && !b) {
        logger.debug("compareVersion: a is greater than b on null")
        return -1
    }
    if (!a && b) {
        logger.debug("compareVersion: b is greater than a on null")
        return 1
    }
    const aTokens = extractTokensFromTag(a, config)
    const bTokens = extractTokensFromTag(b, config)
    const channels = config.channels.map( channel => channel.name)



    if (aTokens.major > bTokens.major) {
        return -1
    } else if (aTokens.major < bTokens.major) {
        return 1
    } else if (aTokens.minor > bTokens.minor) {
        return -1
    } else if (aTokens.minor < bTokens.minor) {
        return 1
    } else if (aTokens.patch > bTokens.patch) {
        return -1
    } else if (aTokens.patch < bTokens.patch) {
        return 1
    } else if (channels.indexOf(aTokens.channel) > channels.indexOf(bTokens.channel)) {
        return -1
    } else if (channels.indexOf(aTokens.channel) < channels.indexOf(bTokens.channel)) {
        return 1
    } else if (aTokens.build != -1 && aTokens.build > bTokens.build) {
        return -1
    } else if (aTokens.build != -1 && aTokens.build < bTokens.build) {
        return 1
    } else {
        return 0
    }
}


export const sortedTags = (tags: GithubTag[], config: Configuration) => tags.sort((a, b) => compareVersion(a.name, b.name, config))

/**
 * Extracts version tokens such from tag name
 * @param {string} tag - raw tag name
 * @returns {VersionTokens}
 */
const extractTokensFromTag = (tag, config) => {
    const regx = /^(v)?(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(-(?<channel>\w+)\.(?<build>\d+))?(.*)?/g
    const { groups: { major, minor, patch, build, channel } } = regx.exec(tag)
    return {
        major: parseInt(major, 10),
        minor: parseInt(minor, 10),
        patch: parseInt(patch, 10),
        build: build != undefined ? parseInt(build, 10) : -1, // returning negative if build number does not exist
        channel: channel ? channel : getStableChannel(config).name 
    }
}


/**
 * Generates raw version from version tokens
 * @param {VersionTokens} version - raw branch name
 * @returns {string} 
 */
const generateTagFromTokens = (version: VersionTokens): string => {
    if (version.build >= 0) {
        return `v${version.major}.${version.minor}.${version.patch}-${version.channel}.${version.build}`
    } else {
        return `v${version.major}.${version.minor}.${version.patch}-${version.channel}`
    }
}


export const getReleaseBranchNameFromVersion = (version, config: Configuration) => {
    const versionTokens = extractTokensFromTag(version, config)
    if (versionTokens.channel == getStableChannel(config).name) {
        return `${versionTokens.channel}-${versionTokens.major}.${versionTokens.minor}`
    }
    return `${versionTokens.channel}-${versionTokens.major}.${versionTokens.minor}.${versionTokens.patch}`
}


/**
 * Bumps the build number it will increment 
 * the patch version as well, since this is a future release
 * @param {string} version 
 */
export const bumpBuild = (version:string, config: Configuration): string => {
    const tokens = extractTokensFromTag(version, config)
    if (tokens.build == -1) {
        tokens.build = 0
    }
    tokens.build += 1
    return generateTagFromTokens(tokens) 
    
}

/**
 * Bumps the patch number  
 * @param {string} version 
 */
export const bumpPatch = (version:string, config: Configuration): string => {
    const tokens = extractTokensFromTag(version, config)
    tokens.patch += 1
    tokens.build = 0
    tokens.channel = config.channels[0].name
    return generateTagFromTokens(tokens) 
}

/**
 * Bumps minor version
 * @param {string} version 
 * @returns {string}
 */
export const bumpMinor = (version:string, config: Configuration): string => {
    const tokens = extractTokensFromTag(version, config)
    tokens.minor += 1
    tokens.patch = config.versioning.default_patch
    tokens.build = 0
    tokens.channel = config.channels[0].name
    return generateTagFromTokens(tokens) 
}


/**
 * Bumps major version
 * @param {string} version 
 * @returns {string}
 */
export const bumpMajor = (version:string, config: Configuration): string => {
    const tokens = extractTokensFromTag(version, config)
    tokens.major += 1
    tokens.minor = config.versioning.default_minor
    tokens.patch = config.versioning.default_patch
    tokens.build = 0
    tokens.channel = config.channels[0].name
    return generateTagFromTokens(tokens) 
}

export const setChannel = (version:string, chan: string, config): string => {
    const tokens = extractTokensFromTag(version, config)
    tokens.channel = chan
    return generateTagFromTokens(tokens)
}

export const getVersionFromBranch = (branch: string): string => {
    const tokens = branch.split('-')
    const version = tokens[1]
    return `v${version}`
}

export const getInitialVersion = (config: Configuration): string => {
    return `v${config.versioning.default_major}.${config.versioning.default_minor}.${config.versioning.default_patch}-${config.channels[0].name}.1`
}

export const getStableChannel = (config: Configuration): Channel => config.channels[config.channels.length - 1]

export {
    generateTagFromTokens, 
    extractTokensFromTag,
}