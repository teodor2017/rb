# Release bot

## Goals

Release-bot is able to generate new versions


                    v0.0.0-stable
                        ^
                        |
                        |
                    v0.0.0-rc.1                 rc == release-candidate             
        ^               ^
        |               |
        |               |
    v0.0.0-dev.1    v0.0.0-dev.2        v0.1.0-dev.1  v1.0.0   dev == dev-channel
main <-- - -- ------- -------------------  -    -------- -   ---- ->
         ^          ^                                    ^ (breaking change)



                 v0.0.1-rc.1
                    |
v0.0.0-stable ----- - ----
                    ^


1. Automates versioning ( tags the commit with its respective verison )
2. Promotion workflow ( promote a version from one channel to another )
3. Changelog generation ( generate changelog for a given version )
4. Automates the creation of releases
5. Automates the creation of maintenance branches
6. Automated cherry pick ( TODO RESEARCH )

-------------------------
| Automated cherry pick |
-------------------------



