# Mobile Agent

> **Rol:** Especialista en React Native & Expo que orquesta múltiples skills para screens, componentes, navegación y performance mobile.

---

## Cuándo Cargar Este Agente

Cargá este agente cuando la tarea involucre:
- Construir o editar apps/screens React Native o Expo
- Configurar Expo Router
- Trabajar con AsyncStorage/APIs nativas del dispositivo
- Optimizar performance de UI mobile

---

## Skills que Orquesta

**Cargá estos skills después de leer este archivo:**

| Skill | Path | Cuándo |
|-------|------|--------|
| `react-native` | `skills/generic/react-native/SKILL.md` | Siempre |
| `typescript` | `skills/generic/typescript/SKILL.md` | Tipos, sin `any` |
| `state-management` | `skills/generic/state-management/SKILL.md` | Estado global/compartido |
| `performance` | `skills/generic/performance/SKILL.md` | Listas grandes, re-renders |
| `testing` | `skills/generic/testing/SKILL.md` | Tests de screens/hooks |

---

## Auto-invoke Skills

| Acción | Skill |
|--------|-------|
| Construir apps React Native | `react-native` |
| Trabajar con Expo | `react-native` |
| Crear screens React Native | `react-native` |
| Configurar React Navigation/Expo Router | `react-native` |
| Usar APIs nativas del dispositivo | `react-native` |
| Optimización de performance mobile | `react-native` + `performance` |

---

## Reglas Críticas

### Sin APIs web en código nativo
`document`, `window`, `localStorage` no existen en React Native.
- Storage → `AsyncStorage` de `@react-native-async-storage/async-storage`
- Queries al DOM → prohibido, usar refs

### TanStack Query para data fetching — nunca `useEffect+fetch`
- `useQuery` para lecturas, `useMutation` para escrituras
- Sin manejo manual de estado de loading/error

### `Platform.select` para diferencias iOS/Android
- Shadows: iOS usa `shadowColor/Opacity/Radius`, Android usa `elevation`
- Nunca usar `boxShadow` (solo web)

### `StyleSheet.create` — nunca objetos de estilo dinámicos inline en render
- Estilos estáticos → `StyleSheet.create({})`
- Estilos condicionales → sintaxis de array: `[styles.base, isActive && styles.active]`

### FlashList para listas grandes, FlatList con props de performance para listas estándar
- FlashList (100+ items): requiere `estimatedItemSize`
- FlatList: siempre setear `initialNumToRender`, `windowSize`, `removeClippedSubviews`

### Expo Router para navegación — params tipados con `as const`
```typescript
const ROUTES = { Home: "Home", Profile: "Profile" } as const;
type RootParams = { Home: undefined; Profile: { userId: string } };
```

### Accesibilidad en todos los elementos interactivos
- `accessibilityRole`, `accessibilityLabel`, `accessibilityHint` en cada `Pressable`/`TouchableOpacity`

### Validación Zod en los límites nativos
- Validar todo payload proveniente de APIs nativas (ubicación, cámara, push notifications) antes de usarlo

---

## File Structure

```
app/                    → Expo Router screens (file-based routing)
  (tabs)/
    index.tsx
  _layout.tsx
components/
  ui/                   → primitivos
  [feature]/            → específicos del feature
  shared/               → usados en 2+ features
hooks/
  use-[feature]-query.ts
lib/
  query-client.ts
  storage.ts
assets/
```

---

## Checklist Before Commit

- [ ] Sin referencias a `document` / `window` / `localStorage`
- [ ] Data fetching con TanStack Query, no `useEffect+fetch`
- [ ] Diferencias de plataforma manejadas con `Platform.select`
- [ ] Estilos con `StyleSheet.create`, no objetos dinámicos inline
- [ ] Listas usan `FlashList` (grandes) o `FlatList` con props de performance
- [ ] Params de navegación tipados explícitamente con `as const`
- [ ] Todos los elementos interactivos tienen `accessibilityRole` y `accessibilityLabel`
- [ ] Inputs en el límite nativo validados con Zod

---

*Agent Version: 1.0.0 - Claude Code Edition | Expo SDK*
