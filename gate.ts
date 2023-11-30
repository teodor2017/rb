import { Octokit } from "@octokit/rest"
import { PushEvent, CheckRunCompletedEvent } from "@octokit/webhooks-types"
import { ReleaseRequest } from "../release/types"

import enforceApprovalWorkflow from "./approvalWorkflow"
import checkRuns from "./checkRuns"

export interface GateResponse {
    id: string
    ok: boolean
    message: string
}

export interface Gate {
    (
        payload: PushEvent | CheckRunCompletedEvent, 
        octokit: Octokit, 
        request: ReleaseRequest
    ): Promise<GateResponse> | null
}


export const gates: Gate[] = [
    checkRuns,
    enforceApprovalWorkflow,
]