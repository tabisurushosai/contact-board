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
  `src/storage/boardStorage.ts`.
- Platform implementations should adapt their own storage API to
  `KeyValueStorageAdapter`, then pass it to `createBoardStorage`.
- Keep the storage key (`contactBoardState`) and sanitized
  `ContactBoardState` shape unchanged so existing local data continues to load.
- Chrome-specific code belongs in `src/storage/chromeStorageAdapter.ts`.
  Future iOS or Android adapters should live beside it instead of entering
  `src/core`.

## Keep UI shell portable

- Keep platform setup at the application edge (`src/main.ts` for Chrome).
- Pass localization and storage dependencies into `createContactBoardApp`.
- Avoid adding remote code, external CDNs, external fonts, or network calls; the
  app should remain fully offline.
- Do not add permissions or host permissions when porting the shared logic.
