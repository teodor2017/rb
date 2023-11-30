import { ReleaseRequest } from "@/release/types";
import { GateResponse } from "./gate";

const checkRuns = async (payload, octokit, request: ReleaseRequest):Promise<GateResponse> => null

export default checkRuns