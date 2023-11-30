import { Octokit } from "@octokit/rest";
import { createLogger } from "../logging";
import { Branch, CreateGithubTag, GithubIssue, GithubTag } from "@/github/types";
import { CreateBranchResponse } from "@/github/types";


const log = createLogger(__filename)

export const getTagCompareURL = (org, repo, v1, v2) => {
    return `https://github.com/${org}/${repo}/compare/${v1}...${v2}`
}

export const getComments = async(issue_number: number, owner:string, repo:string, octokit: Octokit) => {
    const res = await octokit.paginate("GET /repos/{owner}/{repo}/issues/{issue_number}/comments", {
        owner,
        repo,
        issue_number,
    })
    return res
}

/**
 * Returns comparison between two releases url
 * @param sha 
 * @param octokit 
 */
const getCompareURL = (owner: string, repo: string, previousTag: string, latestTag:string): string => {
    // TODO replace main with default branch per user
    return `https://github.com/${owner}/${repo}/compare/${previousTag ? previousTag : 'main@{1year}'}...${latestTag}`
}

/**
 * 
 * @param sha 
 * @param octokit 
 */
const createBranch = async(name:string, sha: string, owner: string, repo: string, octokit: Octokit): Promise<CreateBranchResponse> => {
    const data = await octokit.request("POST /repos/{owner}/{repo}/git/refs", {
        owner: owner,
        repo: repo,
        ref: `refs/heads/${name}`,
        sha: sha
    })
    return data.data
}


/**
 * 
 * @param name 
 * @param sha 
 * @param octokit 
 */
const createTag = async(tag: string, sha: string, owner: string, repo: string, message: string, octokit: Octokit): Promise<CreateGithubTag> => {
    await octokit.request("POST /repos/{owner}/{repo}/git/refs", {
        owner,
        repo,
        sha,
        ref: `refs/tags/${tag}`
    })
    const res = await octokit.request("POST /repos/{owner}/{repo}/git/tags", {
        owner,
        repo,
        tag,
        type: "commit",
        message,
        tagger: {
            name: "poe",
            email: "poethebutler@deepai.services",
            date: new Date().toJSON(),
        },
        object: sha
    })

    return res.data
}

/**
 * Sets labels for a PR or Issues
 * @param labels 
 * @param payload 
 * @param octokit 
 * @returns 
 */
const setLabels = async( labels: string[], payload, octokit ) => {
    return await octokit.request(
        "PUT /repos/{owner}/{repo}/issues/{issue_number}/labels", {
            "owner": payload.repository.owner.login,
            "issue_number": payload.pull_request.number,
            "labels": [...new Set(labels)],
            "repo": payload.repository.name
        }
    )
}




export const searchInTags = async (needle: string, chan: string, owner:string, repo: string, octokit: Octokit) => {
    log.debug({repo, owner}, `github.service.searchInTags: Searching for ${needle} in tags with ${chan}`)
    return octokit.paginate("GET /repos/{owner}/{repo}/tags", {owner, repo}, (res, done) => {
        return res.data.filter(elem => {
            log.debug({repo, owner}, `github.service.searchInTags: Filtering ${elem.name} with ${needle}`)
            return elem.name.includes(needle) && elem.name.includes(chan)
        })
    }).catch(err => {
        log.warn({err}, `github.service.searchInTags: Error while searching for ${needle} in tags with ${chan}`)
        return null
    })
}

/**
 * Retrieves a list of github tags
 * @param repo 
 * @param owner 
 * @param octokit 
 * @returns 
 */
const getTags = async (repo: string, owner: string, octokit: Octokit): Promise<GithubTag[]> => {
    log.debug({repo, owner}, `Getting tags`)
    return await octokit.paginate("GET /repos/{owner}/{repo}/tags", {owner, repo}, res => {
        log.debug({repo, owner}, `response for tags: ${res.url} ${res.status}`)
        if (res.status != 200) {
            throw `Failed accesing ${res.url}`
        }
        return res.data ? res.data : []
    }) 
}

/**
 * Creates a unique github issue 
 * In case one already exists (closed or opened) it will not create another one
 * @param {string} repo - repo name
 * @param {string} owner - owner name
 * @param {Octokit} octokit - authenticated octokit client
 * @param {GithubIssue} issue - github issue
 */
const createUniqueIssue = async (repo: string, owner: string, octokit: Octokit, issue: GithubIssue, labels) => {
    log.debug({repo, owner, issue}, `Creating issue`)
    const foundIssue = await octokit.paginate("GET /repos/{owner}/{repo}/issues", {repo, owner}, (res, done) => {
        const l = res.data.filter( iss => iss.title == issue.title && iss.state == "open" )
        if (l.length > 0) { 
            done()
            return [l[0]] 
        }
        return []
    })
    issue.body = issue.body.slice(0, 65550)
    if (foundIssue.length > 0) {
        log.debug(`Found issue updating it`)
        return octokit.request("PATCH /repos/{owner}/{repo}/issues/{issue_number}", {
            repo,
            owner,
            title: issue.title,
            body: issue.body,
            issue_number: foundIssue[0].number,
            labels: labels
        }).then(res => res.data)
    }
    log.debug({issue}, `Creating new issue`)
    return await octokit.request('POST /repos/{owner}/{repo}/issues', {
        owner: owner,
        repo: repo,
        title: issue.title,
        body: issue.body,
        labels: labels
    }).then(res => res.data)
}

/**
 * Creates a github issue 
 * @param {string} repo - repo name
 * @param {string} owner - owner name
 * @param {Octokit} octokit - authenticated octokit client
 * @param {GithubIssue} issue - github issue
 */
const createIssue = async (repo: string, owner: string, octokit, issue: GithubIssue) => {
    log.debug({repo, owner}, `Creating issue ${issue.title}`)
    return await octokit.request('POST /repos/{owner}/{repo}/issues', {
        owner: owner,
        repo: repo,
        title: issue.title,
        body: issue.body.slice(65550)
    })
}

/**
 * Retrieves all github issues
 * @param {string} repo - repo name
 * @param {string} owner - owner name
 * @param {Octokit} octokit - authenticated octokit client
 */
const getIssues = async (repo: string, owner: string, octokit: Octokit) => {
    return await octokit.paginate("GET /repos/{owner}/{repo}/issues", {repo, owner})
}

/**
 * Create a issue comment
 * @param issue_number 
 * @param owner 
 * @param repo 
 * @param body 
 * @param octokit 
 * @returns 
 */
const createComment = async (issue_number: number, owner: string, repo: string,  body: string, octokit: Octokit) => {
    const res = await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
        repo,
        owner, 
        body,
        issue_number 
    })
    return res.data
}


/**
 * Updates issues by setting its state to 'closed'
 * @param issue_number 
 * @param owner 
 * @param repo 
 * @param octokit 
 * @returns 
 */
const closeIssue = async (issue_number: number, owner: string, repo: string, octokit: Octokit) => {
    const res = await octokit.request("PATCH /repos/{owner}/{repo}/issues/{issue_number}", {
        issue_number,
        owner,
        repo,
        state: "closed"
    })
    return res.data
}

const createRelease = async (tag_name, body: string, owner:string, repo:string, prerelease: boolean, octokit:Octokit) => {
    const res = await octokit.request("POST /repos/{owner}/{repo}/releases", {
        owner,
        repo,
        tag_name,
        body,
        prerelease: prerelease
    })
    return res.data
}


const loadFileFromGithub = async(owner: string, repo: string, file: string, octokit: Octokit) => {
    log.debug({owner, repo, file}, `github.loadFileFromGithub`)
    const res = await octokit.request("GET /repos/{owner}/{repo}/contents/{file}", {
        owner,
        repo,
        file
    }).catch( err => {
        throw err
    })
    log.debug({res}, `github.loadFileFromGithub`)
    return res.data.content
}



const listCheckRunsForSha = async(owner: string, repo: string, sha: string, octokit: Octokit) => {
    return octokit.paginate("GET /repos/{owner}/{repo}/commits/{sha}/check-runs", {
        owner,
        repo,
        sha
    })
}


const listCheckRunsGitRef = (owner: string, repo: string, ref: string, octokit: Octokit) => {
    return octokit.paginate("GET /repos/{owner}/{repo}/commits/{ref}/check-runs", {
        owner,
        repo,
        ref
    })
}

export const validateAllChecksPassed = async (owner: string, repo: string, ref: string, octokit: Octokit): Promise<any> => {
    const runs = await listCheckRunsGitRef(owner, repo, ref, octokit)


    const failed = runs.filter(run => run.status == "completed" && run.conclusion == "failure")
    log.debug({failed}, `Failed checks`)
    const in_progress = runs.filter(run => run.status != "completed")
    log.debug({in_progress}, `In progress checks`)
    // returning null if in progress returning true and false for success/fail
    const success = runs.filter(run => run.status == "completed" && run.conclusion == "success")
    log.debug({success}, `Success checks`)
    return {
        in_progress,
        failed,
        success,
        total: in_progress.length + failed.length + success.length,
        conclusion: in_progress.length != 0 ? "in_progress" : failed.length != 0 ? "failed" : "success"
    }
}

export const getBranch = async(owner: string, repo: string, branch: string, octokit: Octokit) => {
    const res = await octokit.request("GET /repos/{owner}/{repo}/branches/{branch}", {
        owner,
        repo,
        branch
    })
    return res.data
}

export const deleteBranch = async(owner: string, repo: string, branch: string, octokit: Octokit) => {
    const res = await octokit.request("DELETE /repos/{owner}/{repo}/git/refs/{ref}", {
        owner,
        repo,
        ref: `heads/${branch}`
    })
    return res.data
}


export const getIssueComments = (owner: string, repo: string, issue_number: number, octokit: Octokit) => {
    return octokit.paginate("GET /repos/{owner}/{repo}/issues/{issue_number}/comments", {
        owner,
        repo,
        issue_number
    })
}


export const putCheck = async (owner: string, repo: string, sha: string, name: string, status: "queued" | "in_progress" | "completed", conclusion: "success" | "failure" | "neutral" | "cancelled" | "skipped" | "timed_out" | "action_required" | "stale", output, octokit: Octokit) => {
    const res = await octokit.request("POST /repos/{owner}/{repo}/check-runs", {
        owner,
        repo,
        head_sha: sha,
        name,
        status,
        conclusion,
        output
    })
    return res.data
}


export {
    setLabels, 
    createIssue, 
    createUniqueIssue,
    getTags, 
    getIssues,
    createBranch,
    createTag,
    closeIssue,
    createComment,
    createRelease,
    getCompareURL,
    loadFileFromGithub,
    listCheckRunsGitRef,
    listCheckRunsForSha,
}
