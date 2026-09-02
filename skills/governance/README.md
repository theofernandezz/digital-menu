# Skill Freshness Governance

This module prevents skill drift by enforcing a repeatable update system.

## What It Includes

- Registry of monitored skills: `skills/governance/skill-release-registry.json`
- Freshness checker script: `skills/governance/check-skills-freshness.mjs`
- Golden prompt suite registry: `skills/governance/prompt-suite-registry.json`
- Golden prompt checker script: `skills/governance/check-golden-prompts.mjs`
- Weekly CI automation: `.github/workflows/skills-freshness.yml`

## Operating Model

1. Registry is the source of truth.
2. Checker validates metadata freshness, file assertions, and optional live source markers.
3. Golden prompt checker validates prompt-suite quality, review recency, and best-practice markers.
4. CI runs on pull requests and weekly schedule.
5. Maintainers review and merge updates.

## Required Registry Fields

Per skill entry:

- `id`: stable skill identifier
- `file`: path to `SKILL.md`
- `owner`: team or maintainer alias
- `cadenceDays`: max days between verifications
- `lastVerified`: `YYYY-MM-DD`

Optional fields:

- `fileAssertions`: strings that must exist in the skill file
- `sources`: list of source URLs and marker checks

## Commands

Run full checks (metadata + live source checks):

```bash
node skills/governance/check-skills-freshness.mjs --strict
```

Run golden prompt suite checks:

```bash
node skills/governance/check-golden-prompts.mjs --strict
```

Run without network fetches:

```bash
node skills/governance/check-skills-freshness.mjs --strict --no-fetch
```

Run only changed skill files (CI optimization):

```bash
CHANGED_FILES="skills/generic/react-native/SKILL.md" \
node skills/governance/check-skills-freshness.mjs --strict --changed-only
```

Run golden prompt suite checks only for changed suites:

```bash
CHANGED_FILES="skills/generic/ui-engineering/SKILL.md
skills/generic/ui-engineering/references/golden-prompts.json" \
node skills/governance/check-golden-prompts.mjs --strict --changed-only
```

## Update Playbook

When a source release changes:

1. Update the affected skill file.
2. Update `lastVerified` for that skill in `skill-release-registry.json`.
3. Add or refine `fileAssertions` and `sources.mustContainAny` if needed.
4. Run checker locally.
5. Open PR with evidence links to official release pages.

When prompt quality expectations change:

1. Update the skill guidance file and prompt suite JSON cases.
2. Update `lastReviewed` for the suite in `prompt-suite-registry.json`.
3. Keep at least 5 canonical prompts per suite (more for high-risk skills).
4. Include `mustAvoid` anti-pattern checks in every prompt case.
5. Run checker locally and attach a brief summary in the PR.

## Suggested Cadence

- Weekly: volatile ecosystems (`react-native`, `nextjs-core`, `prisma`)
- Monthly: stable pattern skills
- Quarterly: full sweep and deprecation cleanup

For golden prompt suites:

- Every 2 weeks: `ui-engineering`, `ux`, `security`, `api-design`
- Monthly: all other suites
