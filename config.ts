import { Configuration, InternalConfiguration } from "./types"


const internals: InternalConfiguration = {
    issue_template: {
        title: "Release {version}-{name} await approval",
        body: `
# {version} awaits triage

Here are the changes from the last release ({latest_stable_version}):

{compare_url}

## Changelog 

{changelog}

To approve this release, comment with the following command:

**/poe:approve**
`
    },

}

const defaults: Configuration = {
    default_branch: "main",
    versioning: {
        default_major: 0,
        default_minor: 0,
        default_patch: 0,
    },
    // Should serve this functionality:
    // https://github.com/microsoft/TypeScript/issues/31590
    // cherry_pick: {
    //     enable: true,
    //     match_regx: ["fix.*"],
    //     destination_branches: ["0.*", "1.*"]
    // },
    create_maintenance_branch: true,
    release_trigger: {
        enable: false,
        token: "bump-version",
    },
    // clean_maintenance_branch: true,
    channels: [
        {
            name: "next",
            enforce_checks: {
                workflows: []
            },
            approvals: {
                required_approvers: [],
            },
            create_release: false,
            mark_as_prerelease: true,
        },
        {
            name: "rc",
            enforce_checks: {
                workflows: ["*"],
            },
            approvals: {
                required_approvers: ["*"],
            },
            create_release: true,
            mark_as_prerelease: true,
        }, { // the last channel will be stable  
            name: "stable",
            enforce_checks: {
                workflows: ["*"],
            },
            approvals: {
                required_approvers: ["*"],
            },
            create_release: true,
            mark_as_prerelease: false,
        },
    ],
}

export {defaults, internals}
