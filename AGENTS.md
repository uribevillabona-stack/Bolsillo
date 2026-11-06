This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building (zero cost, local only)

BOLSILLO has a hard zero-budget constraint: no cloud builds, no servers, no paid services.
Build locally only: `npx expo run:android` (dev build) and `npx expo run:android --variant release`
(signed APK), or `eas build --local`. Do NOT use cloud `eas build`, `eas submit` or `eas update`.
Toolchain setup: `scripts/setup-android.ps1` (JDK 17 + Android SDK, no admin rights).

## Project rules (BOLSILLO)

- 100 % local-first: data lives in SQLite on the phone. Never add a backend, cloud DB or paid API.
- Money is always an integer number of COP pesos. Format only via `src/lib/money.ts`.
- UI is built only from `src/components` (design system). Colors only via theme tokens (`useTheme`).
- Icons: Phosphor, imported per-icon in `src/components/icons.ts` (never the package barrel).
- Reanimated shared values: use `.get()` / `.set()` (React Compiler is enabled).
- Gesture Handler is v3: hooks API (`usePanGesture`, `GestureDetector`), `scheduleOnRN` from `react-native-worklets`.
- Bottom tabs: `import { Tabs } from 'expo-router/js-tabs'` (the root export is deprecated).
- Never read SMS (READ_SMS/RECEIVE_SMS are blocked in app.json). User-facing copy is Spanish (Colombia).
- Run `npm run check` (typecheck + lint + tests) before declaring any task done.

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:android` locally (never a cloud build).
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
