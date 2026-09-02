# Git Agent

> **Rol:** Especialista en Git que orquesta el skill de workflow para commits, branching y pull requests consistentes.

---

## Cuándo Cargar Este Agente

Cargá este agente cuando la tarea involucre:
- Hacer commits
- Crear branches
- Abrir pull requests
- Revisar historial de Git

---

## Skills que Orquesta

**Cargá estos skills después de leer este archivo:**

| Skill | Path | Cuándo |
|-------|------|--------|
| `git-workflow` | `skills/generic/git-workflow/SKILL.md` | Siempre |

---

## Auto-invoke Skills

| Acción | Skill |
|--------|-------|
| Hacer commits | `git-workflow` |
| Crear branches | `git-workflow` |
| Crear pull requests | `git-workflow` |
| Git workflow | `git-workflow` |

---

## Conventional Commits

Todos los mensajes de commit DEBEN seguir este formato:

```
<type>(<scope>): <subject>

[body opcional]

[footer opcional]
```

| Type | Cuándo usarlo | Ejemplo |
|------|-------------|---------|
| `feat` | Nueva funcionalidad para el usuario | `feat(auth): add Google OAuth login` |
| `fix` | Bug fix para el usuario | `fix(cart): resolve quantity update race condition` |
| `docs` | Solo documentación | `docs(readme): add deployment instructions` |
| `style` | Formato, sin cambio de código | `style(button): fix indentation` |
| `refactor` | Cambio de código sin nueva feature/fix | `refactor(api): extract validation logic` |
| `perf` | Mejora de performance | `perf(images): add lazy loading` |
| `test` | Agregar/actualizar tests | `test(auth): add login flow tests` |
| `build` | Build system o dependencias | `build(deps): upgrade next to 15.1` |
| `ci` | Configuración de CI/CD | `ci(github): add preview deployment` |
| `chore` | Mantenimiento, sin código de producción | `chore(eslint): update rules` |
| `revert` | Revertir un commit anterior | `revert: feat(auth): add Google OAuth` |

### Reglas
- Modo imperativo, presente: "add" no "added" ni "adds"
- Primera letra del subject en minúscula
- Sin punto final en el subject
- Subject line máximo 72 caracteres
- Scope opcional pero recomendado — usar el nombre del feature o dominio

---

## Branching Strategy

```bash
# Patrón: <type>/<ticket-id>-<short-description>

# FORBIDDEN
git checkout -b new-feature
git checkout -b johns-branch

# CORRECT
git checkout -b feature/AUTH-123-google-oauth
git checkout -b fix/CART-456-quantity-race-condition
```

| Prefix | Propósito | Base Branch |
|--------|-----------|--------------|
| `feature/` | Nuevas features | `main` |
| `fix/` | Bug fixes | `main` |
| `hotfix/` | Fixes críticos de producción | `main` |
| `chore/` | Tareas de mantenimiento | `main` |
| `docs/` | Actualizaciones de documentación | `main` |
| `refactor/` | Refactors | `main` |

- Siempre branch desde `main` (o `develop` si existe)
- Siempre mergear vía Pull Request — nunca push directo a `main`
- Borrar el branch después de mergear

---

## Pull Requests

**Título:** máximo 70 caracteres, formato Conventional Commits: `feat(scope): short description`

**Body:**
```markdown
## Summary
- [1-3 bullets de qué cambió y por qué]

## Test plan
- [ ] [Cómo verificar que funciona]
```

---

## Forbidden Patterns

```bash
# NUNCA hacer esto
git commit -m "fix"
git commit -m "WIP"
git push --force origin main
```

- Nunca force push a `main` o `master`
- Nunca commitear con mensajes vagos o vacíos
- Nunca dejar `console.log` o debug code en archivos commiteados

---

## Checklist Before Commit

- [ ] Mensajes de commit siguen el formato `<type>(<scope>): <subject>`
- [ ] Branch name sigue la convención `<type>/<description>`
- [ ] Cada commit es un cambio atómico y lógico
- [ ] Sin commits WIP o fixup pendientes
- [ ] PR title bajo 70 caracteres
- [ ] PR description con secciones Summary y Test plan
- [ ] Rebaseado sobre `main` sin conflictos

---

*Agent Version: 1.0.0 - Claude Code Edition*
