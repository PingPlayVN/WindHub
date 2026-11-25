# WindHub — Complete UI/UX Rebirth (`WindOS` Design System)

## 1. Executive Summary & Design Vision

**WindHub** has been re-architected visually and interactively from the ground up into **WindOS** — a cohesive, operating-system-grade cloud workspace inspired by **OPPO ColorOS** (aquamorphic surface hierarchy, tactile rounded geometry, calm visual rhythm), **Huawei HarmonyOS** (service widgets, spatial bento cards, super-device P2P radar, adaptive dock navigation), and **Apple Liquid Glass** (optional multi-layer optical translucency, specular rim lighting, context-aware depth).

### Core Principles
1. **OS-Grade Spatial Clarity**: Every screen behaves like a first-party system application inside a unified desktop/mobile shell rather than a disconnected web template.
2. **Dual Material Engine**:
   - **Default Mode — Modern OS UI (`Liquid Glass: OFF`)**: Crisp opaque/layered architectural surfaces, balanced shadows, zero unnecessary blur overhead, WCAG AA contrast across Light and Dark themes.
   - **Optional Mode — Liquid Glass (`Liquid Glass: ON`)**: Explicitly user-enabled optical material system with ambient mesh depth, multi-tier `backdrop-filter` blur + saturation, 1px specular top-edge highlights, luminous borders, and high-contrast foregrounds in both Light Glass and Dark Glass.
3. **Brand Continuity**: Retains WindHub's signature vibrant **Orange** accent family (`#F97316` / `#EA580C`), refined monochrome obsidian/alabaster neutrals, iconic WindHub dual-theme brand marks, and Vietnamese Heritage accents (`#D5B46B`, `#A87932`) for folk entertainment.
4. **100% Functional Preservation**: Every business rule, Firebase Firestore listener, Google OAuth flow, game wallet sync, file preview/sharing/clipboard hook, WebRTC P2P DataChannel engine, PWA manifest/service worker, and the full-screen `/entertainment/tai-xiu` module remain intact.

---

## 2. Acquired Agent Skills & How They Govern This Rebuild

All skills were inspected prior to installation and installed into `.agents/skills/` via `skills@1.9.0` for Antigravity:

| Skill | Source Repository | Role in WindHub Rebirth |
| :--- | :--- | :--- |
| `frontend-ui` | `SvaraNova/skills` | Semantic HTML landmarks, OKLCH/role-based 3-tier token architecture, WCAG AA 4.5:1 contrast pairs, focus-visible discipline, 375/768/1280px verification. |
| `web-motion` | `SvaraNova/skills` | GPU-composited `transform`/`opacity` choreography, enter vs. faster exit (~70%) timing, stagger caps (≤300ms), strict `prefers-reduced-motion` fallbacks. |
| `data-visualization` | `SvaraNova/skills` | Dashboard KPI hierarchy, storage distribution visualization, tabular figures (`tabular-nums`), loading/empty/error panel states. |
| `brief-to-interface` | `thanhaq/interface-compass-skills` | Interface Compass Card mapping primary user jobs, first-viewport promises, density, and trust signals per module. |
| `design-system-starter` | `thanhaq/interface-compass-skills` | Role-named tokens (`surface`, `text`, `border`, `action`, `state`, `focus`) and explicit component contracts. |
| `reference-to-implementation` | `thanhaq/interface-compass-skills` | Extracting transferable OS grammar (radii nesting, dock ergonomics, service widgets, specular glass rims) without copying proprietary assets. |
| `motion-and-interaction` | `thanhaq/interface-compass-skills` | Purpose-driven motion roles: Feedback (80–140ms), Orientation (160–240ms), Continuity (layoutId), and Progress. |
| `product-surface-copy` | `thanhaq/interface-compass-skills` | Concise, action-oriented Vietnamese OS microcopy, clear empty-state next steps, non-blaming recovery messages. |
| `interface-quality-audit` | `thanhaq/interface-compass-skills` | Static heuristic scanning (`static-ui-audit.mjs`) eliminating `outline: none` focus traps, `transition: all`, and unlabelled controls. |
| `shipshape-frontend` | `thanhaq/interface-compass-skills` | Release readiness preflight (`preflight-report.mjs`), keyboard flow verification, and build/lint/test sign-off. |
| `motion-ref` | `joepUI/motion-ref-skill` | Concrete overlay (`04-overlay`), navigation (`05-navigation`), and enter/exit (`13-enter-exit`) easing curves (`cubic-bezier(0.22, 1, 0.36, 1)` & sheet curve `cubic-bezier(0.32, 0.72, 0, 1)`). |

---

## 3. Repository Audit & Business-Logic Preservation Map

### 3.1 Preserved Core Engines & Stores (Untouched Contracts)
- **Routing (`src/App.jsx`)**:
  - `/` (Dashboard), `/files` (File Manager + `?share=` deep links), `/tools` (Tools Hub + `?toolId=` deep links), `/extensions` (OSINT & Anime Trace utilities), `/p2p` (WebRTC Direct Share), `/entertainment` (Folk Games Hub), `/entertainment/tai-xiu` (Full-screen game — **untouched**), plus `/settings` (Centralized OS Settings).
- **State Stores (`src/store/`)**:
  - `useAuthStore.js`: Firebase Google OAuth + Cloudflare Worker/Firestore player wallet & daily reward sync (`user`, `player`, `isAdmin`, `betBalance`, `loginWithGoogle`, `logout`).
  - `useThemeStore.js`: Upgraded into the **Global Appearance Engine** while preserving backward-compatible `{ theme, toggleTheme }` selectors used by legacy/game components.
  - `useUIStore.js`: Expanded with `isSidebarCollapsed`, `isCommandOpen`, `isSettingsOpen` alongside existing `isSidebarOpen` and `isLoginOpen`.
- **File Manager Logic (`src/modules/FileManager/hooks/` & `services/`)**:
  - `useFileData`, `useFileNavigation`, `useFileCreation`, `useFileClipboard`, `useFilePreview`, `useFileOrganization`, `useFileSelection`, `useFileKeyboardShortcuts`, `useTouchGestures`, `useFileSharing`, `useSharedItemLink`, `fileService.js`. All Firestore `windhub_files` CRUD, drag-drop move, lock/unlock, keyboard shortcuts (`Ctrl+A/C/X/V`, `F2`, `Delete`), and multi-engine document/PDF/video preview (`PreviewContent.jsx`) preserved 100%.
- **P2P Engine (`src/modules/P2P/core/`, `pairing/`, `transfers/`)**:
  - `WebRTCCore.js`, `SignalingClient.js`, `ManualPairingAdapter.js`, `PairingState.js`, `FileTransfer.js`, `TextTransfer.js`, `protocol.js`. All DTLS DataChannel chunking, ICE candidate queuing, and signaling state machines preserved 100%.
- **Tools & Extensions (`src/modules/Tools/*`, `src/modules/Extension/*`)**:
  - `CasioSpell` (fx-580VN X hex/overflow engine), `ImageArtStudio` (Web Worker ASCII/Braille/Dither renderer), `VocabularyPractice` (board & quiz engine), `AnimeTraceTool` (`trace.moe` lookup), `FacebookProfileTool` (v4.1 client-side URL/Worker analyzer).
- **Entertainment (`src/modules/Entertainment/TaiXiu/**`)**:
  - Strictly untouched per specification.

---

## 4. Token Architecture (`src/styles/tokens.css`)

WindOS uses a three-tier CSS Custom Property architecture integrated with Tailwind CSS v4:

1. **Color Roles**:
   - Canvas & Surfaces: `--os-bg`, `--os-surface-1`, `--os-surface-2`, `--os-surface-3`, `--os-surface-sunken`, `--os-surface-floating`
   - Typography: `--os-text-primary`, `--os-text-secondary`, `--os-text-muted`, `--os-text-inverse`
   - Borders & Dividers: `--os-border-subtle`, `--os-border-default`, `--os-border-strong`
   - Brand Accent (WindHub Orange): `--os-accent`, `--os-accent-hover`, `--os-accent-active`, `--os-accent-soft`, `--os-accent-fg`
   - Semantic States: `--os-success`, `--os-warning`, `--os-danger`, `--os-info` (+ `-soft` surface tints)
   - Focus Ring: `--os-focus-ring` (≥ 3:1 contrast against all surfaces)
2. **Liquid Glass Material Tokens (`[data-glass="true"]`)**:
   - `--glass-bg-1`, `--glass-bg-2`, `--glass-bg-floating`, `--glass-border`, `--glass-border-strong`, `--glass-specular-top`, `--glass-blur-surface` (`18px`), `--glass-blur-floating` (`28px`), `--glass-saturate` (`170%`).
   - Non-glass fallback (`[data-glass="false"]`): Solid/layered opaque OS surfaces with zero `backdrop-filter` cost on standard cards.
3. **Typography Scale**:
   - `--font-sans`: `'Be Vietnam Pro', 'Plus Jakarta Sans', system-ui, sans-serif` (complete Vietnamese diacritic support + geometric clarity).
   - `--font-display`: `'Space Grotesk', 'Be Vietnam Pro', sans-serif` (numeric KPIs, brand headers).
   - `--font-mono`: `'JetBrains Mono', ui-monospace, monospace` (`tabular-nums` for metrics, UIDs, byte counters).
4. **Shape & Radius Scale (Nested Squircle Harmony)**:
   - `--radius-xs: 8px`, `--radius-sm: 12px`, `--radius-md: 16px`, `--radius-lg: 22px`, `--radius-xl: 28px`, `--radius-2xl: 32px`, `--radius-full: 9999px`.
   - Rule: `inner_radius = max(8px, outer_radius - container_padding)`.
5. **Motion & Z-Index Scales**:
   - Durations: `--dur-micro: 120ms`, `--dur-ui: 220ms`, `--dur-ui-exit: 155ms`, `--dur-large: 360ms`, `--dur-large-exit: 250ms`.
   - Easings: `--ease-os-out: cubic-bezier(0.22, 1, 0.36, 1)`, `--ease-os-in: cubic-bezier(0.55, 0, 1, 0.45)`, `--ease-os-sheet: cubic-bezier(0.32, 0.72, 0, 1)`, `--ease-os-spring: cubic-bezier(0.34, 1.56, 0.64, 1)`.
   - Reduced Motion (`[data-motion="reduced"]` or `@media (prefers-reduced-motion: reduce)`): Collapses spatial shifts (`--shift-* → 0px`), disables ambient drift, converts entrances/exits into fast opacity crossfades.

---

## 5. Reusable OS Component System (`src/components/os/`)

| Component | Responsibility & States |
| :--- | :--- |
| `Button` | Primary, secondary, subtle, ghost, danger, glass variants; `sm`/`md`/`lg` control heights (34/40/46px); width-preserving spinner + `aria-busy`. |
| `IconButton` | Accessible icon control (`aria-label` required), sizes `sm`/`md`/`lg`, active badge support, tactile press feedback. |
| `Card` / `GlassCard` | Primary OS surface container & optical glass container with optional hover lift, header/action slots, and nested padding presets. |
| `Sidebar` | Desktop collapsible OS navigation dock (`260px` expanded ↔ `80px` rail), animated active pill (`layoutId`), quick Liquid Glass switch, user/admin dock card. |
| `BottomNavigation` | Mobile floating dock (`< 768px`) with 5 core destinations (Tổng quan, Tệp tin, Công cụ, P2P, Cài đặt) and safe-area padding. |
| `TopBar` | Contextual OS header with route title/subtitle, `Ctrl+K` Command Search pill, Liquid Glass quick toggle, Theme toggle, PWA install action, and Account chip. |
| `SearchBar` | Unified OS input with leading search icon, optional shortcut badge (`⌘K`), and instant clear button. |
| `CommandPalette` | Global `Ctrl+K` / `⌘K` launcher searching routes, tools, extensions, file spaces, and appearance toggles with full arrow-key + Enter navigation. |
| `Modal` | Accessible portal dialog (`role="dialog"`, `aria-modal="true"`, `Esc` close, backdrop click, controlled enter/exit motion). |
| `Drawer` | Side slide-over sheet (`cubic-bezier(0.32, 0.72, 0, 1)`) for quick inspectors and mobile navigation overflow. |
| `BottomSheet` | Mobile touch sheet with drag handle, header slot, and ≥48px action targets. |
| `Dropdown` | Anchored popover menu with keyboard Escape, outside-click dismissal, and checkmark selection state. |
| `Tooltip` | Delayed hover/focus helper label with instant hide on pointer leave. |
| `Toast` | Theme- and Glass-synchronized notification configuration for `sonner`. |
| `Skeleton` / `LoadingState` / `EmptyState` | Layout-stable shimmer placeholders, centered OS progress indicator, and actionable empty/error states. |
| `SettingsGroup` / `ThemeSelector` | OS Settings section container & interactive visual cards for Light/Dark/System, Liquid Glass ON/OFF, and Motion Intensity. |

---

## 6. Quality & Verification Standards

1. **Build & Regression**: `npm run build`, `npm test` (114+ unit/integration tests), `npm run lint` (`oxlint && eslint .`).
2. **Static UI Audit**: Zero P1 issues in `static-ui-audit.mjs` and full pass on `shipshape-frontend` preflight checks.
3. **Live Browser Matrix**: Verified across `375px` (Mobile), `768px` (Tablet), and `1280px+` (Desktop) in **Light Modern OS**, **Dark Modern OS**, **Light Liquid Glass**, and **Dark Liquid Glass**, plus keyboard navigation (`Tab`, `Esc`, `Ctrl+K`) and `prefers-reduced-motion`.
