#!/bin/bash

# =============================================================================
# AI Skills Setup Script
# Configures skills for multiple AI coding assistants via symlinks.
#
# ⚠️  WHEN TO USE THIS vs deploy.sh
#
#   setup.sh  → Use when working INSIDE the ai-library repo itself.
#               Creates symlinks so tools (Claude, Cursor, etc.) can find the skills.
#               Symlinks always reflect the latest skills — no re-run needed.
#
#   deploy.sh → Use when installing the library INTO another project repo.
#               Copies skills as standalone files. Run again to update.
#               This is the standard installation method for external projects.
#
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Selection flags
CLAUDE=false
CLAUDE_CODE=false
CODEX=false
GITHUB=false
GEMINI=false
CURSOR=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --claude)
            CLAUDE=true
            shift
            ;;
        --claude-code)
            CLAUDE_CODE=true
            shift
            ;;
        --codex)
            CODEX=true
            shift
            ;;
        --github)
            GITHUB=true
            shift
            ;;
        --gemini)
            GEMINI=true
            shift
            ;;
        --cursor)
            CURSOR=true
            shift
            ;;
        --all)
            CLAUDE=true
            CLAUDE_CODE=true
            CODEX=true
            GITHUB=true
            GEMINI=true
            CURSOR=true
            shift
            ;;
        --help)
            echo "Usage: ./setup.sh [options]"
            echo ""
            echo "Options:"
            echo "  --claude       Configure for Claude (generic)"
            echo "  --claude-code  Configure for Claude Code CLI"
            echo "  --codex        Configure for OpenAI Codex"
            echo "  --github    Configure for GitHub Copilot"
            echo "  --gemini    Configure for Google Gemini"
            echo "  --cursor    Configure for Cursor IDE"
            echo "  --all       Configure for all assistants"
            echo "  --help      Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# =============================================================================
# Count skills
# =============================================================================

count_skills() {
    find "$SCRIPT_DIR" -name "SKILL.md" -type f | wc -l | tr -d ' '
}

SKILL_COUNT=$(count_skills)

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}           ${CYAN}AI Skills Setup for ai-library${NC}                ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Found ${GREEN}$SKILL_COUNT${NC} skills in ./skills/"
echo ""

# =============================================================================
# Interactive mode if no flags provided
# =============================================================================

if ! $CLAUDE && ! $CLAUDE_CODE && ! $CODEX && ! $GITHUB && ! $GEMINI && ! $CURSOR; then
    echo -e "${YELLOW}No assistant specified. Running in interactive mode...${NC}"
    echo ""
    echo "Select AI assistants to configure (space to toggle, enter to confirm):"
    echo ""
    
    PS3="Enter your choice (1-8): "
    options=("Claude (generic)" "Claude Code (CLI)" "Codex" "GitHub Copilot" "Gemini" "Cursor" "All" "Done")

    selected=()

    while true; do
        select opt in "${options[@]}"; do
            case $opt in
                "Claude (generic)") CLAUDE=true; echo -e "${GREEN}✓ Claude selected${NC}" ;;
                "Claude Code (CLI)") CLAUDE_CODE=true; echo -e "${GREEN}✓ Claude Code selected${NC}" ;;
                "Codex") CODEX=true; echo -e "${GREEN}✓ Codex selected${NC}" ;;
                "GitHub Copilot") GITHUB=true; echo -e "${GREEN}✓ GitHub Copilot selected${NC}" ;;
                "Gemini") GEMINI=true; echo -e "${GREEN}✓ Gemini selected${NC}" ;;
                "Cursor") CURSOR=true; echo -e "${GREEN}✓ Cursor selected${NC}" ;;
                "All")
                    CLAUDE=true
                    CLAUDE_CODE=true
                    CODEX=true
                    GITHUB=true
                    GEMINI=true
                    CURSOR=true
                    echo -e "${GREEN}✓ All selected${NC}"
                    ;;
                "Done") break 2 ;;
                *) echo -e "${RED}Invalid option${NC}" ;;
            esac
            break
        done
    done
fi

# Check if at least one selected
if ! $CLAUDE && ! $CLAUDE_CODE && ! $CODEX && ! $GITHUB && ! $GEMINI && ! $CURSOR; then
    echo -e "${RED}No assistants selected. Exiting.${NC}"
    exit 1
fi

# =============================================================================
# Setup functions
# =============================================================================

setup_claude() {
    echo -e "${CYAN}Setting up Claude...${NC}"
    mkdir -p .claude
    
    # Create symlink to skills
    if [ ! -L ".claude/skills" ]; then
        ln -sf ../skills .claude/skills
    fi
    
    # Create CLAUDE.md if not exists
    if [ ! -f ".claude/CLAUDE.md" ]; then
        cat > .claude/CLAUDE.md << 'EOF'
# Claude Configuration

For AI skill guidelines, see [AGENTS.md](../AGENTS.md).

## Skills

All skills are available in `./skills/` directory.
Run `./skills/skill-sync/assets/sync.sh` after modifying skills.
EOF
    fi
    
    echo -e "${GREEN}✓ Claude configured${NC}"
}

setup_claude_code() {
    echo -e "${CYAN}Setting up Claude Code (CLI)...${NC}"

    # Get the root directory (parent of skills/)
    ROOT_DIR="$(dirname "$SCRIPT_DIR")"

    # Create CLAUDE.md if not exists
    if [ ! -f "$ROOT_DIR/CLAUDE.md" ]; then
        cat > "$ROOT_DIR/CLAUDE.md" << 'EOF'
# AI Development Library - Claude Code

> Este archivo configura cómo Claude Code debe usar la librería de skills para desarrollo.

---

## Sistema de Skills

Esta librería contiene **skills** (patrones de código) y **agentes especializados** (contexto por dominio) que DEBES usar ANTES de escribir código.

### Regla Crítica

**SIEMPRE cargá y leé los skills relevantes ANTES de escribir código.**

No importa cuán "simple" parezca la tarea. Sin excepciones.

---

## Detección Automática de Skills

| Si estás... | Skill | Path |
|-------------|-------|------|
| Creando archivos .ts/.tsx | `typescript` | `skills/generic/typescript/SKILL.md` |
| Trabajando en app/ | `nextjs-core` | `skills/generic/nextjs-core/SKILL.md` |
| Creando componentes React | `react-patterns` | `skills/generic/react-patterns/SKILL.md` |
| Usando Tailwind/shadcn | `ui-engineering` | `skills/generic/ui-engineering/SKILL.md` |
| Trabajando con Supabase | `database` | `skills/generic/database/SKILL.md` |
| Manejando autenticación | `security` | `skills/generic/security/SKILL.md` |
| Escribiendo tests | `testing` | `skills/generic/testing/SKILL.md` |
| Haciendo commits | `git-workflow` | `skills/generic/git-workflow/SKILL.md` |

---

## Delegación por Dominio

| Dominio | Agente | Cuándo usarlo |
|---------|--------|---------------|
| **UI/Frontend** | `agents/ui.md` | Componentes, estilos, accesibilidad |
| **Backend/Server** | `agents/backend.md` | Server Actions, APIs, database |
| **Auth** | `agents/auth.md` | Autenticación, autorización, RLS |
| **Testing** | `agents/testing.md` | Tests unitarios, integración, E2E |

---

## Referencia Completa

- Índice de skills: `skills/_index.md`
- Reglas detalladas: `AGENTS.md`

*Claude Code Configuration v1.0*
EOF
        echo -e "${GREEN}  Created CLAUDE.md${NC}"
    else
        echo -e "${YELLOW}  CLAUDE.md already exists${NC}"
    fi

    # Create agents directory if not exists
    mkdir -p "$ROOT_DIR/agents"

    # Copy agent files if they exist in old locations
    if [ -f "$ROOT_DIR/ui/AGENTS.md" ] && [ ! -f "$ROOT_DIR/agents/ui.md" ]; then
        cp "$ROOT_DIR/ui/AGENTS.md" "$ROOT_DIR/agents/ui.md"
        echo -e "${GREEN}  Created agents/ui.md${NC}"
    fi

    if [ -f "$ROOT_DIR/backend/AGENTS.md" ] && [ ! -f "$ROOT_DIR/agents/backend.md" ]; then
        cp "$ROOT_DIR/backend/AGENTS.md" "$ROOT_DIR/agents/backend.md"
        echo -e "${GREEN}  Created agents/backend.md${NC}"
    fi

    if [ -f "$ROOT_DIR/auth/AGENTS.md" ] && [ ! -f "$ROOT_DIR/agents/auth.md" ]; then
        cp "$ROOT_DIR/auth/AGENTS.md" "$ROOT_DIR/agents/auth.md"
        echo -e "${GREEN}  Created agents/auth.md${NC}"
    fi

    if [ -f "$ROOT_DIR/testing/AGENTS.md" ] && [ ! -f "$ROOT_DIR/agents/testing.md" ]; then
        cp "$ROOT_DIR/testing/AGENTS.md" "$ROOT_DIR/agents/testing.md"
        echo -e "${GREEN}  Created agents/testing.md${NC}"
    fi

    # Create skills index if not exists
    if [ ! -f "$SCRIPT_DIR/_index.md" ]; then
        cat > "$SCRIPT_DIR/_index.md" << 'EOF'
# Skills Index - Quick Reference

## Generic Skills

| Skill | Path | Patrones Clave |
|-------|------|----------------|
| `typescript` | `generic/typescript/SKILL.md` | as const, no any, no enum |
| `react-patterns` | `generic/react-patterns/SKILL.md` | Compound components, hooks |
| `nextjs-core` | `generic/nextjs-core/SKILL.md` | Server Components, Actions |
| `ui-engineering` | `generic/ui-engineering/SKILL.md` | Tailwind v4, shadcn, cn() |
| `database` | `generic/database/SKILL.md` | Supabase, RLS, Zod schemas |
| `security` | `generic/security/SKILL.md` | XSS/CSRF, validation, auth |
| `error-handling` | `generic/error-handling/SKILL.md` | Custom errors, boundaries |
| `testing` | `generic/testing/SKILL.md` | Vitest, Testing Library, MSW |
| `git-workflow` | `generic/git-workflow/SKILL.md` | Conventional commits |
| `api-design` | `generic/api-design/SKILL.md` | REST, webhooks |
| `i18n` | `generic/i18n/SKILL.md` | next-intl patterns |
| `accessibility` | `generic/accessibility/SKILL.md` | WCAG 2.1, ARIA |
| `performance` | `generic/performance/SKILL.md` | Core Web Vitals |
| `seo` | `generic/seo/SKILL.md` | Meta tags, structured data |

## Meta Skills

| Skill | Path | Propósito |
|-------|------|-----------|
| `skill-creator` | `skill-creator/SKILL.md` | Crear nuevos skills |
| `skill-sync` | `skill-sync/SKILL.md` | Sincronizar a AGENTS.md |
| `feedback-loop` | `feedback-loop/SKILL.md` | Capturar mejoras |

*Skills Index v1.0*
EOF
        echo -e "${GREEN}  Created skills/_index.md${NC}"
    fi

    echo -e "${GREEN}✓ Claude Code configured${NC}"
    echo -e "${YELLOW}  Note: Claude Code reads CLAUDE.md automatically when starting${NC}"
}

setup_codex() {
    echo -e "${CYAN}Setting up Codex...${NC}"
    mkdir -p .codex
    
    if [ ! -L ".codex/skills" ]; then
        ln -sf ../skills .codex/skills
    fi
    
    echo -e "${GREEN}✓ Codex configured${NC}"
}

setup_github() {
    echo -e "${CYAN}Setting up GitHub Copilot...${NC}"
    mkdir -p .github
    
    if [ ! -L ".github/skills" ]; then
        ln -sf ../skills .github/skills
    fi
    
    # Create copilot instructions if not exists
    if [ ! -f ".github/copilot-instructions.md" ]; then
        cat > .github/copilot-instructions.md << 'EOF'
# Copilot Instructions

For coding guidelines, see [AGENTS.md](../AGENTS.md).

## Key Rules

1. Always use TypeScript with strict types
2. Follow the patterns in ./skills/ directory
3. Use Server Components by default (Next.js)
4. Validate all inputs with Zod
EOF
    fi
    
    echo -e "${GREEN}✓ GitHub Copilot configured${NC}"
}

setup_gemini() {
    echo -e "${CYAN}Setting up Gemini...${NC}"
    mkdir -p .gemini
    
    if [ ! -L ".gemini/skills" ]; then
        ln -sf ../skills .gemini/skills
    fi
    
    # Note: Gemini requires experimental.skills in settings
    echo -e "${YELLOW}Note: Enable experimental.skills in Gemini settings${NC}"
    echo -e "${GREEN}✓ Gemini configured${NC}"
}

setup_cursor() {
    echo -e "${CYAN}Setting up Cursor...${NC}"
    mkdir -p .cursor
    
    if [ ! -L ".cursor/skills" ]; then
        ln -sf ../skills .cursor/skills
    fi
    
    # Create cursor rules if not exists
    if [ ! -f ".cursor/rules" ]; then
        cat > .cursor/rules << 'EOF'
For coding guidelines, see AGENTS.md in the root directory.
All skills are in ./skills/ - load relevant SKILL.md files for context.

Key patterns:
- TypeScript with strict types (no `any`)
- Server Components by default
- Zod for all validation
- RLS on all Supabase tables
EOF
    fi
    
    echo -e "${GREEN}✓ Cursor configured${NC}"
}

# =============================================================================
# Run selected setups
# =============================================================================

echo ""
echo -e "${BLUE}Configuring selected assistants...${NC}"
echo ""

$CLAUDE && setup_claude
$CLAUDE_CODE && setup_claude_code
$CODEX && setup_codex
$GITHUB && setup_github
$GEMINI && setup_gemini
$CURSOR && setup_cursor

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}                  ${CYAN}Setup Complete!${NC}                         ${GREEN}║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Skills are now linked for selected AI assistants."
echo -e "Restart your AI coding assistant to load the skills."
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Review AGENTS.md for routing rules"
echo -e "  2. Run ./skills/skill-sync/assets/sync.sh after modifying skills"
echo ""
