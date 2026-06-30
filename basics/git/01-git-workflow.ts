// ════════════════════════════════════════════════════════
// GIT 01: PROFESSIONAL GIT WORKFLOW
// Run: npx ts-node 01-git-workflow.ts
// ════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────
// SECTION 1: GIT INTERNALS (JUST ENOUGH)
// ─────────────────────────────────────────────────────────
/*
  Most engineers think Git stores diffs. It doesn't.
  Git stores SNAPSHOTS — a complete picture of every tracked
  file at every commit. Diffs are computed on the fly when
  you ask for them.

  ── THE THREE AREAS ───────────────────────────────────────

  Working Tree  →  Staging Area (Index)  →  Repository (.git/)
       ↑                  ↑                        ↑
  files you edit    git add lands here       git commit lands here

  git add    moves changes from working tree → staging
  git commit moves changes from staging → repository
  git status shows the state of both transitions

  ── OBJECT DATABASE ───────────────────────────────────────

  .git/objects/ holds four object types:

  blob   — raw file content (no filename, no metadata)
  tree   — directory listing: maps names → blobs/trees
  commit — snapshot: points to a root tree, parent commits,
            author, timestamp, message
  tag    — annotated tag: pointer to a commit + metadata

  Every object is content-addressed: its name IS its content's
  SHA-1 hash (40 hex chars). Same content = same SHA.

    $ git cat-file -t d670460b4b4aece5915caf5c68d12f560a9fe3e4
    blob

    $ git cat-file -p HEAD
    tree 4b825dc642cb6eb9a060e54bf8d69288fbee4904
    parent 1a2b3c4d...
    author  Dev Name <dev@co.com> 1710000000 +0530
    committer Dev Name <dev@co.com> 1710000000 +0530

    Add user authentication

  ── HEAD POINTER ──────────────────────────────────────────

  HEAD is a file (.git/HEAD) that points to the current branch,
  which in turn points to a commit SHA.

    ref: refs/heads/main          ← on a branch (normal)
    d670460b4b4aece5915caf5c68d1   ← DETACHED HEAD (dangerous!)

  DETACHED HEAD happens when you checkout a specific commit or tag:
    git checkout abc1234           ← detaches HEAD
    git checkout v1.0.0            ← also detaches

  Any commits you make in detached HEAD are orphaned the moment
  you switch branches — Git's garbage collector will eventually
  delete them.

  FIX detached HEAD immediately:
    git checkout -b rescue-branch  ← create branch before switching

  ── REAL COMMAND TO EXPLORE ───────────────────────────────

    git log --oneline --graph --all   # visual history
    git cat-file -p HEAD              # inspect HEAD commit
    git ls-tree HEAD                  # list root tree
    git reflog                        # full local history including resets
    git fsck --unreachable            # find orphaned objects

  ⚠️  GOTCHA: SHA hashes look stable but are NOT portable across
  history rewrites. Rebase, amend, cherry-pick ALL produce new
  SHAs. If someone shares "just cherry-pick abc1234" and you've
  diverged from their history, that SHA may not exist on your
  machine. Always communicate intent, not just SHAs.
*/

// ─────────────────────────────────────────────────────────
// SECTION 2: BRANCHING STRATEGIES
// ─────────────────────────────────────────────────────────
/*
  ── TRUNK-BASED DEVELOPMENT (TBD) ────────────────────────

  Used by: Google, Meta, Netflix, Amazon
  Rule: everyone commits to main (trunk) multiple times a day.
  Incomplete features ship behind feature flags.

  Structure:
    main ←─ everyone pushes small commits here
    short-lived branches: 1-2 days max, then merged

  Pros:
    - No integration hell — you integrate constantly
    - CI catches bugs within hours not weeks
    - "Done" means "in trunk", not "in a long-lived branch"

  Cons:
    - Requires discipline (feature flags, good CI)
    - Harder for teams new to the practice

  Example workflow:
    git checkout -b feat/add-avatar   # branch lives < 1 day
    # make ONE small change
    git push origin feat/add-avatar
    # open PR, get reviewed same day, merge
    # delete branch immediately

  ── GITFLOW ───────────────────────────────────────────────

  Used by: teams with scheduled release cycles (every 2 weeks, monthly)
  Branches: main, develop, feature/*, release/*, hotfix/*

    main       — production-ready code only
    develop    — integration branch for features
    feature/*  — branch off develop, merge back to develop
    release/*  — branch off develop when release is near
    hotfix/*   — branch off main for emergency prod fixes

  Example:
    git checkout -b feature/payments develop
    # ... work ...
    git checkout develop && git merge --no-ff feature/payments

  Pros: clear structure for regulated/enterprise environments
  Cons: ceremony overhead, long-lived branches cause pain

  ── GITHUB FLOW ───────────────────────────────────────────

  Simple version: branch + PR + merge to main.
  Used by: most startups, open source projects.

    main is always deployable
    branch for every change
    open PR early (even as draft)
    merge after review
    deploy main

  ── CHOOSING A STRATEGY ───────────────────────────────────

  | Team/Context                        | Use            |
  |-------------------------------------|----------------|
  | Startup, continuous deployment      | Trunk-based    |
  | Open source, contributor-friendly   | GitHub Flow    |
  | Enterprise, fixed release schedule  | GitFlow        |
  | Monorepo at scale                   | Trunk-based    |

  ⚠️  GOTCHA: Long-lived feature branches are the #1 cause of
  painful merge conflicts. A feature branch that lives 2 weeks
  while main moves 300 commits ahead is a merge nightmare. The
  team that opened that PR will spend a full day resolving
  conflicts and praying nothing broke. The antidote is to merge
  small, merge often, use feature flags for incomplete work.
*/

// ─────────────────────────────────────────────────────────
// SECTION 3: THE PROFESSIONAL COMMIT
// ─────────────────────────────────────────────────────────
/*
  ── ATOMIC COMMITS ────────────────────────────────────────

  One commit = one logical change. This is not about size —
  it's about cohesion. A commit should be:
    - Self-contained: the codebase works before and after it
    - Focused: fixes one bug OR adds one feature OR refactors one thing
    - Understandable: a reviewer can understand why it exists

  Bad:   "fixed login bug and also refactored auth service
          and updated dependencies and fixed typos in docs"
  Good:  four separate commits, each shippable alone

  ── CONVENTIONAL COMMITS SPEC ─────────────────────────────

  Format:
    <type>[optional scope][optional !]: <description>

    [optional body]

    [optional footer(s)]

  Types:
    feat     — new feature (triggers MINOR version bump)
    fix      — bug fix (triggers PATCH version bump)
    docs     — documentation only
    style    — formatting, no logic change (whitespace, semicolons)
    refactor — code change that neither fixes a bug nor adds a feature
    test     — adding or updating tests
    chore    — build process, dependency updates, tooling
    perf     — performance improvement
    ci       — CI/CD configuration changes
    revert   — reverts a previous commit

  Scopes (optional, in parentheses):
    feat(auth): add OAuth2 login
    fix(cart): prevent double-charge on retry
    refactor(api): extract validation middleware

  Breaking changes:
    feat!: redesign user API                 ← ! signals breaking
    feat(auth)!: remove session-based login  ← scope + breaking

    OR in footer:
    BREAKING CHANGE: removed /api/v1/session endpoint

  Full example:
    feat(checkout): add PayPal as payment option

    Users can now pay with PayPal in addition to credit cards.
    The PayPal SDK is initialized lazily on checkout page load.

    Closes #342
    Reviewed-by: priya@company.com

  ── SEMANTIC VERSIONING FROM COMMITS ──────────────────────

  Tools like semantic-release read your commits and auto-bump:
    fix:    → 1.0.0 → 1.0.1 (PATCH)
    feat:   → 1.0.1 → 1.1.0 (MINOR)
    feat!:  → 1.1.0 → 2.0.0 (MAJOR)

  This only works if your commits are disciplined. "WIP" and
  "asdf" commits break semantic-release entirely.

  ── WRITING THE SUBJECT LINE ──────────────────────────────

  Rules:
    - Imperative mood: "Add login" not "Added login" or "Adding login"
    - 72 characters max
    - No period at the end
    - Lowercase after the type
    - Present tense describes what the commit does, not what you did

  ⚠️  GOTCHA: `git commit -m "fix stuff"` will haunt you at 2am
  six months later when you're bisecting a production outage and
  have no idea which "stuff" was fixed. Every commit message is a
  note to your future self and your colleagues. The 30 seconds
  you spend writing a good message saves hours of archaeology.
*/

// ─────────────────────────────────────────────────────────
// SECTION 4: REBASE VS MERGE
// ─────────────────────────────────────────────────────────
/*
  ── MERGE ─────────────────────────────────────────────────

  Creates a new "merge commit" that joins two histories.
  History is preserved exactly as it happened.

    main:    A─B─C─────────M
                  \       /
    feature:       D─E─F─

    Result: A─B─C─D─E─F─M  (M is the merge commit)

  When to merge:
    - Merging PRs into main/develop
    - Integrating shared branches
    - Anywhere the full history of "who did what when" matters

    git checkout main
    git merge feature/login        # fast-forward or creates merge commit
    git merge --no-ff feature/login  # always create a merge commit

  ── REBASE ────────────────────────────────────────────────

  Moves your commits to the tip of another branch by replaying
  them. Produces a LINEAR history — looks like you wrote your
  code on top of the latest main.

    Before:
      main:    A─B─C
      feature:   D─E  (branched off B)

    After `git rebase main` on feature branch:
      main:    A─B─C
      feature:       D'─E'  (new commits, new SHAs)

  D and E are gone. D' and E' are new commits with the same
  content but different SHAs and a different parent (C, not B).

  When to rebase:
    - Cleaning up your LOCAL feature branch before opening a PR
    - Updating your feature branch with the latest main changes
    - ONLY on commits nobody else has pulled

  NEVER rebase shared/public branches. If teammates have built
  on your branch and you rebase it, their history diverges from
  yours. Every push will fail and everyone will hate you.

  ── INTERACTIVE REBASE ────────────────────────────────────

  The best tool for cleaning up commit history before a PR:

    git rebase -i HEAD~5    # interactive rebase of last 5 commits

  This opens an editor with a list:
    pick abc1234 Add login form
    pick def5678 fix typo
    pick ghi9012 WIP
    pick jkl3456 WIP more work
    pick mno7890 Add login validation

  You can change "pick" to:
    squash (s)  — combine with previous commit, merge messages
    fixup (f)   — combine with previous, discard this message
    reword (r)  — keep commit, edit the message
    drop (d)    — delete the commit entirely
    reorder     — just drag lines to reorder

  Result after cleanup:
    pick abc1234 Add login form
    squash def5678 fix typo
    fixup ghi9012 WIP
    fixup jkl3456 WIP more work
    squash mno7890 Add login validation

  Becomes two clean commits:
    feat(auth): add login form
    feat(auth): add login validation

  ── GOLDEN RULE ───────────────────────────────────────────

  Never rebase commits that exist on a remote branch someone
  else might have pulled. The SHA changes, their history
  diverges, and you've created a git civil war.

  Safe rebase:
    git fetch origin
    git rebase origin/main        # rebase your local feature branch

  Dangerous rebase (don't do this):
    git push --force origin main  # overwrites shared history

  ⚠️  GOTCHA: `git push --force` on a shared branch is one of
  the most damaging things you can do to a team's workflow.
  Your rebase rewrites SHAs; their copies still have the old
  SHAs. Now nobody can push without conflicts. Use
  `git push --force-with-lease` at minimum — it fails if
  someone else pushed while you weren't looking.
*/

// ─────────────────────────────────────────────────────────
// SECTION 5: PULL REQUESTS AND CODE REVIEW
// ─────────────────────────────────────────────────────────
/*
  ── GOOD PR DESCRIPTION ───────────────────────────────────

  A PR without context makes reviewers guess. Template:

    ## What
    Brief description of what changed and why it was needed.

    ## Why
    The problem this solves. Link to issue/ticket.
    - Fixes #123
    - Part of the Q2 checkout revamp

    ## How
    Key decisions made. What to look at first.
    - Extracted PaymentProvider into its own module
    - Added retry logic for failed API calls (max 3 attempts)
    - Used optimistic UI update to avoid loading flicker

    ## How to test
    Step-by-step for reviewers who want to run it locally.
    1. Checkout this branch
    2. `npm install && npm run dev`
    3. Go to /checkout and use test card 4242-4242-4242-4242
    4. Confirm order confirmation appears

    ## Screenshots (if UI change)
    Before / After

  ── PR SIZE ───────────────────────────────────────────────

  Research across codebases shows:
    < 100 lines  — reviewed thoroughly in under 10 min
    100–400 lines — reviewers slow down, may miss things
    > 400 lines  — review quality drops sharply
    > 1000 lines — "LGTM" without reading (rubber stamp)

  If your PR is large:
    - Split by layer: DB change → service layer → API → UI
    - Split by feature flag: ship the infrastructure first, then enable
    - Ask: "what's the smallest PR that moves this forward?"

  ── REVIEWER ETIQUETTE ────────────────────────────────────

  Prefix your comments so intent is clear:

    nit: missing semicolon in line 42
      → Minor, non-blocking. Author can choose to fix or not.

    blocking: this will cause a race condition under high load
      → Must be addressed before merge.

    question: why did you choose setTimeout over requestAnimationFrame here?
      → Seeking understanding, not necessarily requesting change.

    suggestion: consider extracting this into a custom hook
      → Not required, but worth thinking about.

  As author:
    - Don't take review comments personally — they're about code
    - Respond to every comment: fix it, explain why you didn't, or ask for clarification
    - Don't push force-pushes after review starts — add new commits
      so reviewers can see what changed since their last look

  ── MERGE STRATEGIES ON GITHUB ────────────────────────────

  GitHub gives three options when merging a PR:

  Merge commit (--no-ff)
    Creates a merge commit. Full feature history preserved.
    Good for: features you want traceable as a unit in history.

  Squash and merge
    Combines all PR commits into ONE commit on main.
    Good for: messy branches ("WIP WIP fix WIP"), small features.
    Downside: loses per-commit history of the feature.

  Rebase and merge
    Replays each commit onto main individually. Linear history.
    Good for: disciplined atomic commits you want in main exactly.
    Downside: rewrites SHAs; local copies of that branch are orphaned.

  Most teams pick ONE strategy and enforce it. Squash merge is
  the pragmatic default for most companies (clean main history,
  forgiving about branch quality).

  ⚠️  GOTCHA: Opening a PR to a team that has no PR checklist
  is a red flag about their engineering culture. If you join a
  company that merges PRs without review or testing steps, that's
  technical debt accumulating with every merge. Push for a PR
  template in .github/PULL_REQUEST_TEMPLATE.md — it takes
  15 minutes to create and saves hours weekly.
*/

// ─────────────────────────────────────────────────────────
// SECTION 6: COMMON GIT RESCUE OPERATIONS
// ─────────────────────────────────────────────────────────
/*
  Keep this section bookmarked. You WILL need it.

  ── UNDO LAST COMMIT (keep changes staged) ────────────────

    git reset HEAD~1              # moves HEAD back, keeps files staged
    git reset --soft HEAD~1       # same thing, explicit flag

  Use when: you committed too early and want to adjust.

  ── UNDO LAST COMMIT (unstage changes, keep files) ────────

    git reset HEAD~1              # default is --mixed
    git reset --mixed HEAD~1      # same, unstages but keeps files

  Use when: you want to re-stage selectively.

  ── UNDO LAST COMMIT AND DISCARD CHANGES ──────────────────

    git reset --hard HEAD~1       # GONE. No undo. No recycle bin.

  Use when: you're absolutely certain you don't want those changes.

  ── AMEND LAST COMMIT ─────────────────────────────────────

    git add forgotten-file.ts
    git commit --amend            # opens editor to fix message too
    git commit --amend --no-edit  # keep message, just add staged files

  Use when: last commit isn't pushed yet and you want to fix it.
  NEVER amend a commit that's been pushed to a shared branch.

  ── RECOVER A DELETED BRANCH ──────────────────────────────

    git reflog                    # shows recent HEAD positions with SHAs
    # Find the SHA of the last commit on the deleted branch
    git checkout -b rescued-branch abc1234

  Reflog is your safety net. Git keeps 90 days of reflog by default.
  Deleted branches, reset commits — they're all in reflog until GC runs.

  ── STASH WORK IN PROGRESS ────────────────────────────────

    git stash push -m "half-done login form"   # stash with label
    git stash list                             # see all stashes
    git stash pop                              # apply and remove top stash
    git stash apply stash@{2}                  # apply specific stash, keep it
    git stash drop stash@{0}                   # delete specific stash
    git stash clear                            # delete ALL stashes

  Use when: you need to switch branches without committing unfinished work.

  ── STASH UNTRACKED FILES TOO ─────────────────────────────

    git stash push -u -m "new files included"  # -u includes untracked

  By default, stash ignores new files that have never been added.

  ── CHERRY-PICK A COMMIT ──────────────────────────────────

    git cherry-pick abc1234       # apply that commit's changes here

  Use when: a bug fix lives on another branch and you need it now.
  Creates a NEW commit with a new SHA — doesn't move the original.

  Cherry-pick conflicts are resolved the same as merge conflicts.
  After resolving: git cherry-pick --continue

  ── FIND WHO BROKE IT (BISECT) ────────────────────────────

  Binary search through commit history to find the bad commit:

    git bisect start
    git bisect bad                          # current commit is broken
    git bisect good v2.3.0                  # this tag was known-good

  Git checks out the midpoint. You test it:
    git bisect good    # if it works
    git bisect bad     # if it's broken

  Repeat until Git says:
    "abc1234 is the first bad commit"

  Run automatically with a test script:
    git bisect run npm test                 # runs test on each midpoint

    git bisect reset                        # return to original HEAD when done

  ── REVERT (undo a pushed commit safely) ──────────────────

    git revert abc1234             # creates a new commit that undoes abc1234

  Unlike reset, revert doesn't rewrite history. It's safe on shared branches.
  Use revert for pushed commits. Use reset for local commits.

  ⚠️  GOTCHA: `git reset --hard` discards uncommitted changes
  permanently. There is no undo. No trash folder. No ctrl-Z.
  The only recovery path if you haven't committed is if your
  editor made a backup (VS Code's local history). Before any
  `--hard` operation, run `git diff` and `git status` to confirm
  you're not throwing away work you need. Develop the reflex:
  hard reset = irreversible.
*/

// ─────────────────────────────────────────────────────────
// SECTION 7: GIT WORKFLOWS AT A REAL JOB
// ─────────────────────────────────────────────────────────
/*
  ── DAILY WORKFLOW ────────────────────────────────────────

  Morning:
    git fetch origin              # see what's new without merging
    git pull origin main          # or rebase: git pull --rebase origin main

  Starting work:
    git checkout -b feat/user-avatar    # descriptive branch name
    # Branch naming conventions:
    #   feat/short-description
    #   fix/what-it-fixes
    #   chore/update-deps
    #   hotfix/critical-prod-bug

  During work (commit often):
    git add -p                    # interactive staging: review every chunk
    git commit -m "feat(user): add avatar upload"

  Before pushing:
    git fetch origin
    git rebase origin/main        # linear history, conflicts caught early

  Pushing:
    git push origin feat/user-avatar
    # First push of a new branch:
    git push -u origin feat/user-avatar   # -u sets upstream tracking

  ── RESOLVING MERGE CONFLICTS ─────────────────────────────

  A conflict looks like this in a file:

    <<<<<<< HEAD
    const timeout = 5000;
    =======
    const timeout = 3000;
    >>>>>>> feature/faster-auth

  Three sections:
    <<<<<<< HEAD           — your current branch's version
    =======                — divider
    >>>>>>> feature/...    — incoming branch's version

  VS Code merge editor (recommended):
    Open the conflicted file → "Open Merge Editor" button
    See Current / Incoming / Result side-by-side
    Click "Accept Current", "Accept Incoming", or edit Result directly

  Command line:
    # Open each file, manually edit to the desired result
    git add resolved-file.ts
    git rebase --continue   # or git merge --continue

  After all conflicts resolved:
    git status              # confirm no remaining conflicts
    git log --oneline -5    # confirm history looks right

  ── .GITIGNORE BEST PRACTICES ─────────────────────────────

  Never commit:
    node_modules/          # always, no exceptions
    .env                   # secrets die in .env
    dist/ build/ out/      # generated files
    .DS_Store              # macOS metadata
    *.log                  # log files
    coverage/              # test coverage reports
    .idea/ .vscode/        # (optional: team-specific, sometimes committed)

  Use gitignore.io to generate for your stack:
    https://www.toptal.com/developers/gitignore

  If you accidentally committed node_modules:
    echo "node_modules/" >> .gitignore
    git rm -r --cached node_modules/
    git commit -m "chore: untrack node_modules"

  ── GIT HOOKS ─────────────────────────────────────────────

  Hooks are scripts that run automatically at certain Git events.
  Stored in .git/hooks/ (not committed) or managed by Husky (committed).

  Common hooks:
    pre-commit   — run linting/formatting before commit is created
    commit-msg   — validate commit message format
    pre-push     — run tests before push

  Problem: .git/hooks/ is not committed to the repo.
  Solution: Husky — manages hooks in a committed .husky/ directory.

  Setup Husky + lint-staged:
    npm install --save-dev husky lint-staged
    npx husky init

  .husky/pre-commit:
    npx lint-staged

  package.json:
    "lint-staged": {
      "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
      "*.{js,json,md}": ["prettier --write"]
    }

  .husky/commit-msg:
    npx commitlint --edit $1

  commitlint with conventional commits:
    npm install --save-dev @commitlint/cli @commitlint/config-conventional
    echo "export default { extends: ['@commitlint/config-conventional'] };" > commitlint.config.js

  Now `git commit -m "asdf"` will be rejected automatically.

  ⚠️  GOTCHA: The most common Husky failure is after cloning a
  fresh repo — hooks aren't executable. Add `"prepare": "husky"`
  to package.json scripts so `npm install` sets up hooks
  automatically. Every new team member will thank you.
  Also: `git commit --no-verify` bypasses ALL hooks. Any engineer
  doing this habitually is accumulating debt silently.
*/

// ─────────────────────────────────────────────────────────
// SECTION 8: ADVANCED OPERATIONS
// ─────────────────────────────────────────────────────────
/*
  ── GIT WORKTREE ──────────────────────────────────────────

  Work on multiple branches simultaneously WITHOUT stashing or
  switching. Each worktree is a separate directory.

    git worktree add ../hotfix-login hotfix/login-crash

  Now you have:
    /project/          — your current branch (main)
    /hotfix-login/     — hotfix/login-crash branch

  Both are live. Edit files in either directory independently.
  No stashing, no context-switching.

  Remove when done:
    git worktree remove ../hotfix-login

  Use when: you need to context-switch urgently (production hotfix)
  while keeping your current WIP untouched.

  ── GIT SPARSE-CHECKOUT ───────────────────────────────────

  For monorepos: only checkout the subset of files you care about.

    git clone --filter=blob:none --sparse git@github.com:company/monorepo.git
    git sparse-checkout set packages/user-service packages/shared

  Now you only have those directories locally. Git tracks the rest
  remotely. Drastically reduces clone size for large monorepos.

  ── GIT SUBMODULE ─────────────────────────────────────────

  Embed another Git repository inside yours at a fixed commit.

    git submodule add git@github.com:company/design-system.git
    git submodule update --init --recursive   # after cloning

  When to use:
    - Shared libraries that version independently from the parent
    - Vendor dependencies you want to pin at a specific commit

  When NOT to use:
    - If you can use npm/yarn instead — always prefer the package manager
    - If the submodule changes frequently — updates are manual and painful
    - If team members forget to run `git submodule update` (they will)

  Reality check: submodules are notoriously confusing. Many teams
  migrate away from them toward npm workspaces or monorepo tools
  (Nx, Turborepo) when they get the chance.

  ── TAGGING RELEASES ──────────────────────────────────────

  Lightweight tag (just a pointer):
    git tag v1.0.0                      # no message, no metadata

  Annotated tag (recommended for releases):
    git tag -a v1.0.0 -m "First stable release"
    git push origin v1.0.0              # push specific tag
    git push origin --tags              # push all tags

  List tags:
    git tag -l "v1.*"                   # filter by pattern

  Delete a tag:
    git tag -d v1.0.0                   # local
    git push origin --delete v1.0.0     # remote

  ── CHANGELOG GENERATION ──────────────────────────────────

  If you've used conventional commits, generate a changelog automatically:

    git shortlog -sn                    # contributor commit count summary
    git shortlog HEAD...v1.0.0          # commits since last tag

  Tools:
    conventional-changelog-cli    — generate CHANGELOG.md from commits
    semantic-release              — full automation: version bump + changelog + publish

    npx conventional-changelog -p conventional -i CHANGELOG.md -s

  ── SIGNING COMMITS (GPG) ─────────────────────────────────

  Signing proves that commits are actually from you, not spoofed.
  Required by some enterprise and government projects.

    gpg --gen-key
    gpg --list-secret-keys --keyid-format LONG
    git config --global user.signingkey YOUR_KEY_ID
    git config --global commit.gpgsign true
    git commit -S -m "signed commit"

  GitHub shows a "Verified" badge on signed commits.

  ── USEFUL POWER COMMANDS ─────────────────────────────────

    git log --author="Sadik" --since="2 weeks ago" --oneline
    git log --grep="feat(auth)" --oneline       # search commit messages
    git diff main...feature/login               # diff from branch point
    git blame -L 42,60 src/auth.ts              # who wrote lines 42-60
    git log --follow -p src/auth.ts             # full history of a file (follows renames)
    git show HEAD:src/auth.ts                   # see file at a specific commit
    git stash branch feature/recovered stash@{0}  # turn stash into a branch

  ⚠️  GOTCHA: `git push --tags` will push ALL local tags including
  accidental test tags like "asdf" or "delete-me". Use
  `git push origin v1.2.3` to push one tag at a time, or audit
  with `git tag -l` first. Deleting a published tag from GitHub
  is possible but it breaks anyone who has already fetched it —
  their tooling may still reference the old commit.
*/

// ─────────────────────────────────────────────────────────
// PRACTICE CHALLENGES
// ─────────────────────────────────────────────────────────
/*
  Q1: You committed a .env file. It's already pushed.
      How do you remove it from history?

  A1: This is a two-step process — remove from history AND
      rotate your secrets (assume them compromised).

      Step 1: Remove from history using git-filter-repo (preferred):
        pip install git-filter-repo
        git filter-repo --path .env --invert-paths --force

      Or with BFG (simpler):
        java -jar bfg.jar --delete-files .env
        git reflog expire --expire=now --all
        git gc --prune=now --aggressive
        git push --force

      Step 2: Force-push all branches:
        git push origin --force --all
        git push origin --force --tags

      Step 3: Add to .gitignore IMMEDIATELY:
        echo ".env" >> .gitignore
        git add .gitignore && git commit -m "chore: ignore .env"

      Step 4: Rotate ALL secrets in that file. Every API key,
      every DB password, every JWT secret. The file was public
      the moment it was pushed, even briefly. GitHub scans for
      known secret formats and notifies you, but attackers move fast.

      NOTE: Anyone who cloned the repo before the force-push
      still has the secrets in their local history. The force-push
      only removes it from the remote going forward.

  ──────────────────────────────────────────────────────────

  Q2: Write conventional commit messages for:
      - Adding user login functionality
      - Fixing a crash when cart is empty
      - Updating authentication docs

  A2:
      feat(auth): add email/password login

      Users can now log in with their email and password.
      Session is maintained via JWT stored in httpOnly cookie.

      Closes #45

      ──

      fix(cart): prevent crash when cart has no items

      CartSummary component threw a TypeError when accessing
      items[0] on an empty cart. Added a null check and empty
      state UI.

      Fixes #89

      ──

      docs(auth): update JWT token lifetime documentation

      Clarify that access tokens expire in 15 minutes and
      refresh tokens in 7 days. Add example of refresh flow.

  ──────────────────────────────────────────────────────────

  Q3: You're on feature/checkout and main moved ahead by 8 commits.
      How do you get the latest changes without a merge commit?

  A3: Use rebase — it replays your commits on top of the latest main,
      producing a linear history without a merge commit.

        git fetch origin                      # download latest main
        git rebase origin/main               # replay your commits on top

      If conflicts occur:
        # resolve each conflict in the file
        git add conflicted-file.ts
        git rebase --continue                # move to next commit

      If it goes badly wrong and you want to abort:
        git rebase --abort                   # back to where you started

      After rebasing, your local branch has diverged from the remote
      (because SHAs changed), so push with:
        git push --force-with-lease origin feature/checkout

      --force-with-lease is safer than --force: it fails if someone
      else pushed to the branch while you were rebasing.

  ──────────────────────────────────────────────────────────

  Q4: Your last 5 commits are all "WIP". Clean them up into
      2 atomic commits before opening a PR.

  A4: Use interactive rebase to squash and reword:

        git rebase -i HEAD~5

      The editor opens with:
        pick abc1111 WIP
        pick abc2222 WIP more stuff
        pick abc3333 WIP auth done
        pick abc4444 WIP validation
        pick abc5555 WIP cleanup

      Edit to:
        pick abc1111 WIP
        squash abc2222 WIP more stuff
        squash abc3333 WIP auth done
        pick abc4444 WIP validation
        squash abc5555 WIP cleanup

      Save. Git will open two message editors — one for each "pick".
      Rewrite the messages:
        feat(auth): add login form and session management
        feat(auth): add input validation and error handling

      Result: your 5 WIP commits become 2 clean, atomic commits.
      Now open the PR.

  ──────────────────────────────────────────────────────────

  Q5: You accidentally ran `git reset --hard HEAD~3` and lost
      3 commits. How do you recover them?

  A5: Reflog to the rescue. Git keeps a log of every position
      HEAD has been at, including before the reset.

        git reflog

      Output:
        abc1234 HEAD@{0}: reset: moving to HEAD~3
        def5678 HEAD@{1}: commit: feat(auth): add validation
        ghi9012 HEAD@{2}: commit: feat(auth): add login form
        jkl3456 HEAD@{3}: commit: feat(auth): setup auth module

      The commit right before your reset (HEAD@{1}) is def5678.
      That's the latest of your "lost" commits.

      Recover by creating a branch at that point:
        git checkout -b recovery-branch def5678

      Or reset your current branch to it:
        git reset --hard def5678

      Your 3 commits are back. Reflog saves you as long as you
      act within 90 days (Git's default reflog expiry).
*/

// ─────────────────────────────────────────────────────────
// SELF-ASSESSMENT (10 questions)
// ─────────────────────────────────────────────────────────
/*
  Answer before reading the answers below.

  1. What does `git reset --mixed HEAD~1` do differently than
     `git reset --soft HEAD~1`?

  2. You've done `git rebase -i HEAD~4` and squashed 4 commits
     into 1. Now `git push` fails. Why, and what's the fix?

  3. What is a "detached HEAD" state and what should you do
     immediately when you find yourself in it?

  4. You need to apply a single bug-fix commit from the
     `hotfix/payment` branch into your `feature/checkout` branch
     without merging the whole branch. What command do you use?

  5. What's the difference between `git fetch` and `git pull`?

  6. A colleague asks you to review their PR. The description says
     "various fixes". What's the first thing you do?

  7. You committed changes to the wrong branch. You haven't pushed.
     How do you move those commits to the correct branch?

  8. What does `--force-with-lease` do and why is it safer than
     `--force` when pushing a rebased branch?

  9. Why should you NOT commit `node_modules/` to Git?

  10. Your CI pipeline failed because a commit message didn't follow
      conventional commits format. What tool enforces this and at
      what git hook point?

  ──────────────────────────────────────────────────────────
  ANSWERS

  1. --soft: moves HEAD back, leaves changes staged (in index).
     --mixed: moves HEAD back, unstages changes (back to working tree).
     Both keep your files unchanged. --hard deletes changes.

  2. Rebase rewrites commit SHAs. Your local branch now has
     different SHAs than the remote tracking branch. Git rejects
     the push because it would overwrite remote history.
     Fix: `git push --force-with-lease origin your-branch`
     This is safe because the branch is yours and nobody else
     should have it checked out.

  3. Detached HEAD means HEAD points directly to a commit SHA
     instead of a branch. Any new commits you make here will
     be orphaned when you switch branches. Immediately create
     a branch to preserve your work:
       git checkout -b new-branch-name

  4. `git cherry-pick <commit-sha>`
     This applies that commit's changes as a new commit on
     your current branch without bringing in any other history.

  5. `git fetch` downloads remote changes but doesn't apply them
     to your working branch. Safe — nothing changes locally.
     `git pull` is `git fetch` + `git merge` (or `git rebase`
     with `--rebase` flag). It changes your working branch.
     Prefer fetch + explicit rebase/merge for control.

  6. Request a better description before reviewing. A PR titled
     "various fixes" gives reviewers nothing to go on. Ask: what
     was broken? what does this fix? how was it tested? Code review
     quality depends entirely on understanding intent.

  7. On the wrong branch, note the commit SHAs:
       git log --oneline -3
     Switch to the correct branch:
       git checkout correct-branch
     Cherry-pick the commits:
       git cherry-pick sha1 sha2 sha3
     Go back and remove from the wrong branch:
       git checkout wrong-branch
       git reset --hard HEAD~3   (if those were the last 3 commits)

  8. --force-with-lease checks that the remote branch hasn't
     changed since you last fetched. If someone else pushed while
     you were rebasing, --force-with-lease FAILS instead of
     silently overwriting their work. --force ignores this check
     and overwrites whatever is there. Always use --force-with-lease
     when you have to force push.

  9. node_modules/ is generated from package.json. It can contain
     tens of thousands of files and hundreds of megabytes. Committing
     it bloats the repo permanently (Git history is forever),
     makes clones slow, causes OS-specific binary conflicts between
     team members, and provides zero value — anyone can regenerate
     it with `npm install`. Add it to .gitignore and never look back.

  10. commitlint enforces conventional commit format.
      It runs at the commit-msg hook — after you write your commit
      message but before the commit is finalized. Setup:
        npm install --save-dev @commitlint/cli @commitlint/config-conventional
        npx husky add .husky/commit-msg 'npx commitlint --edit $1'
      Now any commit message that doesn't match the format is
      rejected before it's created.

  Scoring:
    0–4   Re-study sections 3, 4, and 6
    5–7   Solid foundation, practice the rescue operations
    8–9   You're working like a professional
    10    Teach this to someone else
*/

// ─────────────────────────────────────────────────────────
// REFERENCE CARD
// ─────────────────────────────────────────────────────────

function runDemo(): void {
  const separator = "─".repeat(56);

  const card = `
╔════════════════════════════════════════════════════════╗
║           GIT PROFESSIONAL REFERENCE CARD              ║
╚════════════════════════════════════════════════════════╝

${separator}
 DAILY WORKFLOW
${separator}
  git fetch origin                   # see what changed
  git pull --rebase origin main      # update, linear history
  git checkout -b feat/my-feature    # new branch
  git add -p                         # stage interactively
  git commit -m "feat(scope): msg"   # conventional commit
  git push -u origin feat/my-feature # push + set upstream

${separator}
 COMMIT TYPES (conventional commits)
${separator}
  feat:      new feature
  fix:       bug fix
  docs:      documentation
  refactor:  no behavior change
  test:      tests only
  chore:     build/tooling/deps
  perf:      performance
  ci:        CI/CD changes
  feat!:     breaking change

${separator}
 RESCUE OPERATIONS
${separator}
  git reset HEAD~1               # undo commit, keep staged
  git reset --soft HEAD~1        # undo commit, keep staged
  git reset --mixed HEAD~1       # undo commit, unstage
  git reset --hard HEAD~1        # undo commit, DISCARD changes
  git commit --amend --no-edit   # add to last commit
  git revert <sha>               # safe undo (adds new commit)
  git cherry-pick <sha>          # bring one commit here
  git stash push -m "label"      # stash work in progress
  git stash pop                  # restore stash
  git reflog                     # full local history
  git bisect start/good/bad      # binary search for bug

${separator}
 HISTORY CLEANUP (before PR)
${separator}
  git rebase -i HEAD~N           # interactive: squash/reword
  git rebase origin/main         # update branch, linear history
  git push --force-with-lease    # safe force push after rebase

${separator}
 INVESTIGATION
${separator}
  git log --oneline --graph --all         # visual history
  git log --author="Name" --oneline       # filter by author
  git log --grep="feat(auth)" --oneline   # search messages
  git blame -L 42,60 file.ts              # who wrote which line
  git diff main...feature/branch          # diff from branch point
  git show HEAD:path/to/file.ts           # file at a commit
  git log --follow -p path/to/file.ts     # full file history

${separator}
 BRANCH NAMING
${separator}
  feat/short-description
  fix/what-it-fixes
  chore/update-deps
  hotfix/critical-bug
  docs/update-readme

${separator}
 MERGE STRATEGIES
${separator}
  Merge commit    — full history preserved, merge commit created
  Squash merge    — all PR commits → one commit on main
  Rebase merge    — each commit replayed on main, linear history

${separator}
 GOLDEN RULES
${separator}
  1. Never rebase commits on shared branches
  2. Never force-push to main
  3. Always --force-with-lease, never --force
  4. Commit early, commit small, commit often
  5. Pull before you push
  6. Every .env belongs in .gitignore
  7. Reflog can save you if you act within 90 days

${separator}
`;

  console.log(card);
}

runDemo();
