import { ReleaseRequest } from "../release/types";
import { GateResponse } from "./gate";

const enforceApprovalWorkflow = async (payload, octokit, request: ReleaseRequest):Promise<GateResponse> => null


export default enforceApprovalWorkflow