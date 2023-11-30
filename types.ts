import { Configuration } from "../configuration/types"

export interface NextVersionPayload {
    next: string
    headCommit: string
    previousSha?: string

}

export interface ReleaseRequest {
    next: NextVersionPayload
    config: Configuration
    approvers: boolean,
    runs: boolean
    completed: boolean
}