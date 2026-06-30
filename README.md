# Expense Tracker Pro

Production-grade personal finance management application built with React 19, MUI v7, Redux Toolkit, RTK Query, and Dexie.js (IndexedDB). Works offline as a PWA on Android, Windows, and any modern web browser.

## Features

- **Income / Expense / Transfer Tracking** — Full CRUD with bulk operations, CSV/Excel/PDF export
- **Multi-Account Management** — Track balances across multiple accounts with auto-recalculation
- **Budget Management** — Period budgets with alert thresholds and real-time utilization
- **Goal Tracking** — Financial goals with contribution tracking and progress visualization
- **Loan Tracking** — Borrowed and lent money with repayment schedules and auto-settle
- **Asset Tracking** — Asset portfolio with valuation history and gain/loss calculation
- **Project Expense Tracking** — Track expenses per project with budget variance
- **Configurable Dashboard** — Add/remove/reorder widgets with live financial data
- **Reports & Analytics** — Monthly cash flow, category breakdown, PDF/Excel/CSV export
- **Administration** — Full master data management for all configurable entities
- **Offline-First PWA** — Installable, works without internet, IndexedDB storage
- **Localization** — English and Tamil (தமிழ்) support
- **Dark/Light Theme** — Configurable with system preference support

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 19 + TypeScript |
| Component Library | MUI (Material UI) v7 |
| State Management | Redux Toolkit + RTK Query |
| Database | Dexie.js v4 (IndexedDB ORM) |
| Routing | React Router v7 |
| Forms | React Hook Form + Zod validation |
| Charts | Recharts |
| Date Handling | Day.js |
| Export | jsPDF + xlsx |
| i18n | i18next + react-i18next |
| PWA | vite-plugin-pwa |
| Build Tool | Vite 6 |
| Testing | Vitest + Testing Library |

## Architecture

```
src/
├── app/                    # Redux store, RTK Query APIs
│   ├── api/               # Feature APIs (accounts, transactions, budgets, etc.)
│   ├── store.ts           # Redux store configuration
│   ├── settingsSlice.ts   # App settings state
│   └── uiSlice.ts         # UI state (sidebar, dialogs, notifications)
│
├── core/                   # Shared infrastructure
│   ├── components/        # Reusable UI components
│   │   ├── Layout/        # AppLayout, Navigation, TopBar
│   │   ├── DynamicForm/   # Metadata-driven form engine
│   │   ├── ErrorBoundary/ # Error handling
│   │   └── common/        # PageHeader, StatCard, EmptyState, etc.
│   ├── database/          # Dexie.js database layer
│   │   ├── db.ts          # Database definition (30+ tables)
│   │   ├── types.ts       # All TypeScript interfaces
│   │   ├── repositories/  # Repository pattern (BaseRepository, TransactionRepository)
│   │   └── seed/          # Sample data (250+ transactions, 12 months)
│   ├── hooks/             # useAppSettings, useDebounce, useLocalStorage
│   ├── theme/             # MUI theme (light/dark)
│   └── utils/             # currency, date, export utilities
│
├── features/               # Feature modules (vertical slice architecture)
│   ├── dashboard/         # Configurable dashboard with widgets
│   ├── transactions/      # Income/expense/transfer tracking
│   ├── accounts/          # Account management
│   ├── budgets/           # Budget management
│   ├── goals/             # Financial goals
│   ├── loans/             # Loan tracking
│   ├── assets/            # Asset portfolio
│   ├── projects/          # Project expense tracking
│   ├── reports/           # Analytics and exports
│   ├── settings/          # App configuration
│   └── administration/    # Master data management
│
└── localization/           # i18n translations (EN, Tamil)
```

### Key Design Decisions

**Dexie.js instead of SQLite** — SQLite doesn't run in browsers. Dexie.js provides a full-featured IndexedDB ORM with TypeScript support, transactions, and complex queries — equivalent to SQLite for browser/PWA apps.

**RTK Query with `fakeBaseQuery()`** — All endpoints use `queryFn` calling local Dexie services. This gives caching, loading states, and cache invalidation without any HTTP server.

**Repository Pattern** — `BaseRepository<T>` handles generic CRUD. `TransactionRepository` adds complex filtering, pagination, and account balance recalculation.

**Configuration-Driven** — No hardcoded categories, types, or entity names. Everything is stored in Dexie tables and managed via the Administration UI.

## Installation

### Prerequisites
- Node.js 20+ and npm
- Git

### Quick Start

```bash
# 1. Clone the repository
git clone <repo-url>
cd expense-tracker-react-web

# 2. Install dependencies
npm install --legacy-peer-deps
# Note: --legacy-peer-deps is required because react-i18next has a peer dep
# with TypeScript that conflicts with TypeScript 6

# 3. Start development server
npm run dev
# Opens at http://localhost:3000

# 4. Build for production
npm run build

# 5. Preview production build
npm run preview
```

### PWA Icons (Optional for production)

Generate PWA icons from the source SVG:

```bash
# Install canvas dependency
npm install --save-dev canvas

# Generate all icon sizes
node scripts/generate-icons.mjs

# Or use an online tool:
# 1. Go to https://maskable.app/editor
# 2. Upload public/favicon.svg  
# 3. Download all sizes to public/icons/
```

## Development

### Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint check
npm run type-check   # TypeScript type check
npm run test         # Run unit tests with Vitest
npm run test:ui      # Run tests with visual UI
npm run coverage     # Test coverage report
```

### Git Hooks

Pre-commit hooks are configured with Husky + lint-staged:
- ESLint auto-fix on staged TypeScript/TSX files
- Prettier formatting on all staged files

Initialize hooks after cloning:
```bash
git init  # if not already a git repo
npx husky init
```

### Path Aliases

| Alias | Resolves To |
|-------|-------------|
| `@/` | `src/` |
| `@features/` | `src/features/` |
| `@core/` | `src/core/` |
| `@app/` | `src/app/` |
| `@localization/` | `src/localization/` |

## Database Schema

The app uses Dexie.js (IndexedDB) with these main tables:

| Table | Purpose |
|-------|---------|
| `accounts` | Bank/cash accounts with balances |
| `accountTypes` | Configurable account type definitions |
| `transactions` | All financial transactions |
| `transactionTypes` | Income/Expense/Transfer type definitions |
| `categories` | Hierarchical category tree (parent + sub) |
| `tags` | Free-form transaction tags |
| `budgets` | Period budget definitions |
| `budgetTypes` | Budget category definitions |
| `goals` | Savings goals |
| `goalTypes` | Goal category definitions |
| `loans` | Borrowed/lent money tracking |
| `loanTypes` | Loan category definitions |
| `assets` | Asset portfolio |
| `assetTypes` | Asset category definitions |
| `assetValuations` | Historical valuations per asset |
| `projects` | Project definitions |
| `projectExpenses` | Expenses per project |
| `settings` | Key-value app settings |
| `auditLog` | Immutable change trail |
| `dynamicFields` | Custom field definitions |
| `recurringTransactions` | Scheduled recurring transactions |
| `dashboardWidgets` | Widget definitions |
| `userDashboardConfigs` | Per-user widget layout |
| `reportTemplates` | Saved report configurations |

### Account Balance Calculation

Account balances are recalculated from scratch on every transaction change:
- **Income**: Adds to account balance
- **Expense**: Subtracts from account balance  
- **Transfer**: Deducts from `fromAccount`, adds to `toAccount`

This prevents cumulative floating-point drift.

## Configuration

All settings are stored in the `settings` Dexie table and managed via the **Settings** page:

| Setting | Default | Description |
|---------|---------|-------------|
| `currency` | `INR` | 3-letter currency code |
| `currencySymbol` | `₹` | Symbol used in UI |
| `dateFormat` | `DD/MM/YYYY` | Date display format |
| `language` | `en` | UI language (en/ta) |
| `themeMode` | `light` | light/dark/system |
| `showCents` | `true` | Show decimal places |
| `weekStartDay` | `1` | 0=Sunday, 1=Monday |
| `enableBudgetAlerts` | `true` | Budget threshold notifications |

## Adding a New Feature

1. Create `src/features/<feature>/` with:
   - `pages/` — Main page components
   - `components/` — Feature-specific components
   - `validation/` — Zod schemas

2. Add Dexie table in `src/core/database/db.ts`

3. Add TypeScript types in `src/core/database/types.ts`

4. Create RTK Query API file in `src/app/api/<feature>Api.ts`

5. Register the API in `src/app/store.ts`

6. Add route in `src/App.tsx`

7. Add navigation link in `src/core/components/Layout/Navigation.tsx`

## Adding a New Entity Type (Configuration-Driven)

To add a new configurable entity (like "Goal Type" or "Asset Type"):

1. Add a new table in `db.ts` with indexes
2. Add TypeScript interface in `types.ts`
3. Add seed data in `seedData.ts`
4. Add CRUD endpoints in an API file
5. Add a tab in `AdministrationPage.tsx` using the `GenericAdmin` component

No changes needed in feature pages — they read from the database.

## Localization

Add translations to:
- `src/localization/locales/en/translation.json` (English)
- `src/localization/locales/ta/translation.json` (Tamil)

Use in components:
```tsx
const { t } = useTranslation();
<Typography>{t('dashboard.title')}</Typography>
```

Change language programmatically:
```ts
import { setLanguage } from '@localization/i18n';
await setLanguage('ta'); // Switch to Tamil
```

## PWA Support

The app is installable as a PWA on:
- **Android**: Chrome → "Add to Home Screen"
- **Windows**: Edge/Chrome → Address bar install icon
- **Desktop**: Chrome/Edge → Install prompt

Features:
- Offline support (all data stored locally in IndexedDB)
- Auto-update service worker
- App manifest with icons and theme color
- Standalone display mode (no browser chrome)

## Testing

```bash
# Run all tests
npm run test

# With coverage
npm run coverage

# Test specific file
npm run test src/test/utils/currency.test.ts
```

Tests use Vitest + @testing-library/react. IndexedDB is mocked in `src/test/setup.ts`.

## Troubleshooting

**`npm install` fails with peer dependency errors:**
```bash
npm install --legacy-peer-deps
```

**Husky hooks not running:**
```bash
git init
node_modules\.bin\husky init
```

**App shows blank screen after install:**
- Open DevTools → Application → IndexedDB → Delete `ExpenseTrackerDB` → Refresh

**TypeScript errors with path aliases:**
- Ensure `tsconfig.app.json` has the `paths` section configured
- Restart your TypeScript server in VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

## License

MIT
