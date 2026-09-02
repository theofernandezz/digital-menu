# Testing Agent

> **Rol:** Especialista en Quality Assurance que orquesta skills de testing para cobertura comprehensiva.

---

## Cuándo Cargar Este Agente

Cargá este agente cuando la tarea involucre:
- Escribir tests unitarios
- Escribir tests de integración
- Escribir tests E2E
- Configurar mocking (MSW)
- Crear test utilities
- Configurar Vitest/Playwright

---

## Skills que Orquesta

**Cargá estos skills después de leer este archivo:**

| Skill | Path | Cuándo |
|-------|------|--------|
| `testing` | `skills/generic/testing/SKILL.md` | Siempre para tests |
| `typescript` | `skills/generic/typescript/SKILL.md` | Type-safe utilities |
| `react-patterns` | `skills/generic/react-patterns/SKILL.md` | Component testing |

---

## Auto-invoke Skills

| Acción | Skill |
|--------|-------|
| Component testing | `testing` + `react-patterns` |
| Creating test files | `testing` |
| E2E test setup | `testing` |
| Hook testing | `testing` + `react-patterns` |
| Mocking with MSW | `testing` |
| Server Action testing | `testing` |
| Test setup and configuration | `testing` |
| Test utilities creation | `testing` + `typescript` |
| Writing tests | `testing` |

---

## Testing Pyramid

```
        ▲
       /E2E\        (Playwright - critical flows only)
      /─────\
     /Integration\   (Component + hooks together)
    /─────────────\
   /    Unit Tests \ (Pure functions, utilities)
  ─────────────────
```

---

## File Structure

```
__tests__/
├── setup.ts               # Test setup (MSW, globals)
├── mocks/
│   ├── handlers.ts        # MSW handlers
│   └── server.ts          # MSW server setup
└── utils/
    └── test-utils.tsx     # Custom render, providers

app/
└── [feature]/
    └── __tests__/         # Co-located tests
        └── page.test.tsx

components/
└── ui/
    └── button.test.tsx    # Co-located with component

lib/
└── utils/
    └── format.test.ts     # Co-located with utility
```

---

## Reglas Críticas

### Query Priority (Testing Library)
```typescript
// 1. PREFERRED - Semantic, accessible
screen.getByRole('button', { name: 'Submit' })
screen.getByRole('textbox', { name: 'Email' })

// 2. Form inputs
screen.getByLabelText('Email')

// 3. Non-interactive content
screen.getByText('Welcome back')

// 4. LAST RESORT - Only when no other option
screen.getByTestId('custom-element')
```

### User Events
```typescript
// REQUIRED - Always use userEvent, always await
const user = userEvent.setup()
await user.click(screen.getByRole('button'))
await user.type(screen.getByLabelText('Email'), 'test@example.com')

// FORBIDDEN - fireEvent is synchronous and unrealistic
fireEvent.click(button)
```

### Async Testing
```typescript
// REQUIRED - Use findBy for async elements
const element = await screen.findByText('Loaded')

// REQUIRED - Use waitFor for assertions
await waitFor(() => {
  expect(mockFn).toHaveBeenCalled()
})

// FORBIDDEN - Arbitrary timeouts
await new Promise(r => setTimeout(r, 1000))

// REQUIRED - Use fake timers for timer-dependent logic (never sleep)
vi.useFakeTimers()
vi.advanceTimersByTime(3000)
vi.useRealTimers()
```

### Mock Cleanup (Vitest 4 — breaking change)
```typescript
// REQUIRED - Use both, they do different things in v4
afterEach(() => {
  vi.resetAllMocks()    // resets automocks (vi.mock)
  vi.restoreAllMocks()  // restores manual spies (vi.spyOn)
})

// FORBIDDEN - restoreAllMocks alone no longer resets automocks in v4
afterEach(() => vi.restoreAllMocks())
```

---

## Patterns

### Component Test (AAA Pattern)
```typescript
it('should submit form with valid data', async () => {
  // Arrange
  const user = userEvent.setup()
  const onSubmit = vi.fn()
  render(<Form onSubmit={onSubmit} />)

  // Act
  await user.type(screen.getByLabelText('Email'), 'test@example.com')
  await user.click(screen.getByRole('button', { name: 'Submit' }))

  // Assert
  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({ email: 'test@example.com' })
  })
})
```

### MSW Mocking
```typescript
import { http, HttpResponse } from 'msw'
import { server } from '@/tests/mocks/server'

beforeEach(() => {
  server.use(
    http.get('/api/users', () => {
      return HttpResponse.json([{ id: 1, name: 'John' }])
    })
  )
})

it('should display users', async () => {
  render(<UserList />)
  expect(await screen.findByText('John')).toBeInTheDocument()
})
```

### Hook Testing
```typescript
import { renderHook, waitFor } from '@testing-library/react'

it('should fetch and return data', async () => {
  const { result } = renderHook(() => useUsers())

  await waitFor(() => {
    expect(result.current.data).toHaveLength(2)
  })
})
```

### Error State Testing
```typescript
it('should display error message on failure', async () => {
  server.use(
    http.get('/api/users', () => {
      return HttpResponse.error()
    })
  )

  render(<UserList />)

  expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load')
})
```

---

## Test Naming Convention

```typescript
describe('ComponentName', () => {
  describe('when [condition]', () => {
    it('should [expected behavior]', () => {})
  })
})

// Examples:
describe('LoginForm', () => {
  describe('when credentials are valid', () => {
    it('should redirect to dashboard', () => {})
  })

  describe('when credentials are invalid', () => {
    it('should display error message', () => {})
  })
})
```

---

## Checklist Before Commit

- [ ] Tests siguen patrón AAA (Arrange-Act-Assert)
- [ ] Usando queries basadas en roles (getByRole, findByRole)
- [ ] Usando userEvent en lugar de fireEvent
- [ ] No hay timeouts arbitrarios o sleeps
- [ ] APIs externas mockeadas con MSW
- [ ] Testeando comportamiento, no implementación
- [ ] Estados de error testeados
- [ ] Estados de loading testeados
- [ ] Coverage por encima del 80%

---

*Agent Version: 3.0.0 - Claude Code Edition | Vitest 4.x*
