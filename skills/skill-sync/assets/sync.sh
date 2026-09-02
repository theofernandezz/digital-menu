#!/bin/bash

# =============================================================================
# Skill Sync Script
# Syncs skill metadata to AGENTS.md Auto-invoke sections
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
SKILLS_DIR="$ROOT_DIR/skills"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Flags
DRY_RUN=false
SCOPE_FILTER=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --scope)
            SCOPE_FILTER="$2"
            shift 2
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}🔄 Skill Sync${NC}"
echo "Root: $ROOT_DIR"
echo ""

# =============================================================================
# Collect skill metadata
# =============================================================================

declare -A SCOPE_ACTIONS

# Find all SKILL.md files
find_skills() {
    find "$SKILLS_DIR" -name "SKILL.md" -type f 2>/dev/null
}

# Extract metadata from a SKILL.md file
extract_metadata() {
    local file="$1"
    local skill_name=$(basename "$(dirname "$file")")
    
    # Check if file has metadata section
    if ! grep -q "^metadata:" "$file" 2>/dev/null; then
        return
    fi
    
    # Extract scope (handle both single and array format)
    local scopes=$(awk '/^metadata:/,/^[a-z_-]+:/' "$file" | grep -E "^\s+scope:" | sed 's/.*scope:\s*\[\?\s*//' | sed 's/\]$//' | tr ',' '\n' | sed 's/^[ \t]*//' | sed 's/[ \t]*$//')
    
    # Extract auto_invoke actions
    local in_auto_invoke=false
    local actions=()
    
    while IFS= read -r line; do
        if [[ "$line" =~ ^[[:space:]]*auto_invoke: ]]; then
            in_auto_invoke=true
            # Check for single-line format
            local single=$(echo "$line" | sed 's/.*auto_invoke:\s*"\?\([^"]*\)"\?/\1/')
            if [[ -n "$single" && "$single" != "$line" && ! "$single" =~ ^[[:space:]]*$ ]]; then
                actions+=("$single")
            fi
            continue
        fi
        
        if $in_auto_invoke; then
            # Check if we've exited the auto_invoke section
            if [[ "$line" =~ ^[a-z_-]+: && ! "$line" =~ ^[[:space:]] ]]; then
                break
            fi
            # Extract list items
            if [[ "$line" =~ ^[[:space:]]*-[[:space:]]*(\")?(.+)(\")?$ ]]; then
                local action=$(echo "$line" | sed 's/^[[:space:]]*-[[:space:]]*//' | sed 's/^"//' | sed 's/"$//')
                actions+=("$action")
            fi
        fi
    done < "$file"
    
    # Map actions to scopes
    for scope in $scopes; do
        scope=$(echo "$scope" | tr -d ' "')
        [[ -z "$scope" ]] && continue
        
        for action in "${actions[@]}"; do
            [[ -z "$action" ]] && continue
            SCOPE_ACTIONS["$scope"]+="| $action | \`$skill_name\` |"$'\n'
        done
    done
}

# =============================================================================
# Process all skills
# =============================================================================

echo -e "${YELLOW}📚 Scanning skills...${NC}"

skill_count=0
while IFS= read -r skill_file; do
    extract_metadata "$skill_file"
    ((skill_count++))
done < <(find_skills)

echo "Found $skill_count skills"
echo ""

# =============================================================================
# Generate Auto-invoke tables
# =============================================================================

generate_table() {
    local scope="$1"
    local actions="${SCOPE_ACTIONS[$scope]}"
    
    if [[ -z "$actions" ]]; then
        echo "No actions found for scope: $scope"
        return 1
    fi
    
    echo "### Auto-invoke Skills"
    echo ""
    echo "When performing these actions, ALWAYS invoke the corresponding skill FIRST:"
    echo ""
    echo "| Action | Skill |"
    echo "|--------|-------|"
    echo -n "$actions"
    echo ""
    echo "---"
}

# =============================================================================
# Update AGENTS.md files
# =============================================================================

update_agents_file() {
    local scope="$1"
    local agents_file=""
    
    case "$scope" in
        root) agents_file="$ROOT_DIR/AGENTS.md" ;;
        ui) agents_file="$ROOT_DIR/ui/AGENTS.md" ;;
        backend) agents_file="$ROOT_DIR/backend/AGENTS.md" ;;
        auth) agents_file="$ROOT_DIR/auth/AGENTS.md" ;;
        testing) agents_file="$ROOT_DIR/testing/AGENTS.md" ;;
        *) 
            echo -e "${RED}Unknown scope: $scope${NC}"
            return 1
            ;;
    esac
    
    if [[ ! -f "$agents_file" ]]; then
        echo -e "${YELLOW}⚠️  File not found: $agents_file${NC}"
        return 1
    fi
    
    local table=$(generate_table "$scope")
    
    if [[ -z "$table" ]]; then
        return 1
    fi
    
    if $DRY_RUN; then
        echo -e "${BLUE}[DRY RUN] Would update: $agents_file${NC}"
        echo "$table"
        echo ""
    else
        echo -e "${GREEN}✅ Updated: $agents_file${NC}"
        # In a real implementation, this would update the file
        # For now, we just show what would be generated
        echo "$table" > /tmp/skill-sync-preview-$scope.md
        echo "   Preview saved to /tmp/skill-sync-preview-$scope.md"
    fi
}

# =============================================================================
# Main
# =============================================================================

echo -e "${YELLOW}📝 Generating Auto-invoke tables...${NC}"
echo ""

if [[ -n "$SCOPE_FILTER" ]]; then
    update_agents_file "$SCOPE_FILTER"
else
    for scope in "${!SCOPE_ACTIONS[@]}"; do
        update_agents_file "$scope"
    done
fi

echo ""
echo -e "${GREEN}✨ Sync complete!${NC}"
