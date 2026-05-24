# Porting guide

This project is a Chrome extension today, but its boundaries should stay ready
for future iOS or Android app shells.

## Keep `src/core` platform-free

- Put pure business rules and data shaping in `src/core/`.
- Do not import or reference `chrome.*`, DOM APIs, native mobile SDKs, storage
  APIs, network APIs, or UI framework APIs from `src/core/`.
- `npm run build` runs a core-only TypeScript check through
  `tsconfig.core.json`; keep that check free of browser and Chrome extension
  types.

## Persist through `src/storage`

- UI code should depend on the `BoardStorage` interface from
  `src/storage/types.ts`.
- `BoardStorage` is the domain-facing boundary: app code calls `load` and
  `save` with `ContactBoardState` and does not know raw storage keys.
- Platform implementations should adapt their own local storage API to
  `KeyValueStorageAdapter`, then pass it to `createBoardStorage`.
- `KeyValueStorageAdapter.get` must return `undefined` for missing keys so
  `createBoardStorage` can initialize the same default state on every
  platform.
- `KeyValueStorageAdapter.set` must persist the value passed by
  `createBoardStorage` without changing the storage key or object shape.
- Keep the storage key (`contactBoardState`) and sanitized
  `ContactBoardState` shape unchanged so existing local data continues to load.
- Chrome-specific code belongs in `src/storage/chromeStorageAdapter.ts`.
  Future iOS or Android adapters should live beside it instead of entering
  `src/core`.
- Native adapters for iOS or Android should only translate between the native
  local persistence API and `KeyValueStorageAdapter`; validation and defaulting
  should stay in `createBoardStorage`.
- Native adapters should store the same JSON-compatible value that
  `createBoardStorage` passes through. Do not split fields across multiple
  native keys unless the adapter reassembles the original object before
  returning it.

## Keep UI shell portable

- Keep platform setup at the application edge (`src/main.ts` for Chrome).
- Pass localization and storage dependencies into `createContactBoardApp`.
- Keep Chrome i18n, native localization, and platform bootstrapping outside
  `src/core`; inject localized strings through the existing message resolver.
- Avoid adding remote code, external CDNs, external fonts, or network calls; the
  app should remain fully offline.
- Do not add permissions or host permissions when porting the shared logic.
