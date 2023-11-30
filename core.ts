
export interface Releaser {
    postReleaseStatus: (...args) => void
    processReleaseRequest: (...args) => void
    promoteRelease: (...args) => void
    createRelease: (...args) => void
}

