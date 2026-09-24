#!/usr/bin/env bash
# =============================================================================
# Skill registration check
# Fails if a skill in skills/generic/ is missing from a place where agents or
# people look for it. Portable: bash 3.2 (macOS default) + grep only.
#
# Usage: ./skills/skill-sync/assets/sync.sh
# =============================================================================

set -u

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

# Files that must list every generic skill by name, in backticks.
PLACES="skills/_index.md README.md AGENTS.md CLAUDE.md GEMINI.md"

status=0
count=0

for dir in "$ROOT_DIR"/skills/generic/*/; do
    [ -f "$dir/SKILL.md" ] || continue
    name=$(basename "$dir")
    count=$((count + 1))

    for place in $PLACES; do
        if ! grep -q "\`$name\`" "$ROOT_DIR/$place"; then
            echo "✗ \`$name\` is not registered in $place"
            status=1
        fi
    done
done

if [ "$status" -eq 0 ]; then
    echo "✓ $count skills registered in: $PLACES"
else
    echo ""
    echo "Register the skill in each file listed above (see skills/skill-sync/SKILL.md)."
fi

exit "$status"
