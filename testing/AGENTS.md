# Testing Agent

> **Role:** Quality Assurance specialist that orchestrates testing skills for comprehensive test coverage.

> **Skills Reference**: For detailed patterns, use these skills:
> - [`testing`](../skills/generic/testing/SKILL.md) - Vitest, Testing Library, MSW, behavior-driven
> - [`typescript`](../skills/generic/typescript/SKILL.md) - Type-safe test utilities
> - [`react-patterns`](../skills/generic/react-patterns/SKILL.md) - Component testing patterns

---

### Auto-invoke Skills

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

| Action | Skill |
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

## TESTING PYRAMID

```
        ▲
       /E2E\        (Playwright - critical flows)
      /─────\
     /Integration\   (Component + hooks together)
    /─────────────\
   /    Unit Tests \ (Pure functions, utilities)
  ─────────────────
```

---

## FILE STRUCTURE

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

## CRITICAL RULES

### Query Priority
1. `getByRole` - accessible, semantic (PREFERRED)
2. `getByLabelText` - form inputs
3. `getByText` - non-interactive content
4. `getByTestId` - last resort only

### User Events
- ALWAYS use `userEvent` over `fireEvent`
- ALWAYS `await user.click()` (async)
- ALWAYS setup user first: `const user = userEvent.setup()`

### Async Testing
- ALWAYS use `findBy*` for async elements
- NEVER use arbitrary timeouts
- ALWAYS use `waitFor` with expectations
- For timer-dependent logic: use `vi.useFakeTimers()` + `vi.advanceTimersByTime()`

### Mock Cleanup (Vitest 4 breaking change)
- ALWAYS use both `vi.resetAllMocks()` (automocks) + `vi.restoreAllMocks()` (spies) in `afterEach`
- `vi.restoreAllMocks()` alone no longer resets automocks in v4

---

## PATTERNS

### Component Test
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
```

---

## QA CHECKLIST BEFORE COMMIT

- [ ] Tests follow AAA pattern (Arrange-Act-Assert)
- [ ] Using role-based queries (getByRole, findByRole)
- [ ] Using userEvent instead of fireEvent
- [ ] No arbitrary timeouts or sleep
- [ ] External APIs mocked with MSW
- [ ] Testing behavior, not implementation
- [ ] Error states tested
- [ ] Loading states tested

---

*Agent Version: 3.0.0 | Vitest 4.x*
