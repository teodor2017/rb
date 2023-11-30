import yaml from "yaml";
import { loadFileFromGithub } from "../github/service";
import { createLogger } from "../logging";
import { defaults } from "./config";
import { Channel,  Configuration } from "./types";
import { Octokit } from "@octokit/rest";

import { validateConfiguration } from "./validator";
import { getStableChannel } from "../release/versioning";


export class Config {
    raw: Configuration

    constructor(config: Configuration) {
        this.raw = config
    }

    get stableChannel(): Channel {
        return this.raw.channels[this.raw.channels.length - 1]
    }

    getChannelConfig = (channel: string): Channel => {
        return this.raw.channels.find(c => c.name === channel)
    }

    getPreviousChannel = (channel: string): Channel => {
        const cfg = this.getChannelConfig(channel)
        const idx = this.raw.channels.indexOf(cfg)
        if (idx > 0) {
            return this.raw.channels[idx - 1]
        }
        return null;
    }

    getChannelConfigFromVersion = (version: string): Channel => {
        for (let index = 0; index < this.raw.channels.length; index++) {
            const element = this.raw.channels[index];
            if (version.indexOf(element.name) !== -1) {
                return element
            }
        }
        if (/^(v)?\d+\.\d+\.\d+(-\w+)?/.test(version)) {
            return this.stableChannel 
        }
        throw new Error("No channel found for version: " + version)
    }
}

const DEFAULT_POE_CONFIG_PATH = ".github/poe/config.yaml"

const decodeBase64 = (str: string) => Buffer.from(str, "base64").toString("utf8")

const log = createLogger(__filename)

export const loadConfiguration = async (owner: string, repo: string, octokit: Octokit, sha: string): Promise<Configuration> => {
    let fileContents;
    try {
        fileContents = await loadFileFromGithub(owner, repo, DEFAULT_POE_CONFIG_PATH, octokit)
    } catch {
        // putCheck(owner, repo, sha, "Poe is now using default configuration.", "completed", "success", {
        //     "title": "Poe is now using default configuration.",
        //     "summary": "⚠️Could not read a custom configuration from the repository.⚠️ \n***Using the default configuration.***",
        //     "text": "```yaml\n" + yaml.stringify(defaults) + "\n```"
        //     }, octokit)
        log.debug(`Could not read a custom configuration from the repository. Using the default configuration.`)
        return defaults
    }
    const configuration = {...defaults, ...yaml.parse(decodeBase64(fileContents))}

    // if (!valid.valid) {
        // log.debug(`configuration.loadConfiguration: Configuration invalid for ${owner}/${repo}`)
        // putCheck(owner, repo, sha, "Poe configuration failed.", "completed", "failure", {
        //     "title": "Poe could not be configured properly.",
        //     "summary": "The configuration file provided in ```.github/poe/config.yaml``` does not follow the configuration guideline.",
        //     "text": valid.errors
        //     }, octokit)
        
        // throw new Error("Invalid configuration")
    // }

    return configuration
}

export const getChannelConfig = (config: Configuration, channel: string): Channel => {
    return config.channels.find(c => c.name === channel)
}

export const getPreviousChannel = (config: Configuration, channel: string): Channel => {
    const cfg = getChannelConfig(config, channel)
    const idx = config.channels.indexOf(cfg)
    if (idx > 0) {
        return config.channels[idx - 1]
    }
    return null;
}

export const getChannelConfigFromVersion = (version: string, config: Configuration): Channel => {
    for (let index = 0; index < config.channels.length; index++) {
        const element = config.channels[index];
        if (version.indexOf(element.name) !== -1) {
            return element
        }
    }
    if (/^(v)?\d+\.\d+\.\d+(-\w+)?/.test(version)) {
        return getStableChannel(config)
    }
    throw new Error("No channel found for version: " + version)
}
