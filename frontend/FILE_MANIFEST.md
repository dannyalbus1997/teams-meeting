# Teams Meeting Summarizer Frontend - File Manifest

## Complete File Listing

### Configuration Files
- **package.json** - Project metadata and dependencies
- **tsconfig.json** - TypeScript compiler configuration
- **tsconfig.node.json** - TypeScript config for Node files
- **next.config.js** - Next.js configuration
- **.eslintrc.json** - ESLint configuration
- **.gitignore** - Git ignore rules
- **.env.example** - Environment variables template

### Documentation
- **README.md** - Comprehensive project documentation
- **SETUP.md** - Quick setup and development guide
- **FILE_MANIFEST.md** - This file

### Application Structure

#### App Routes (`src/app/`)
- **layout.tsx** - Root layout with sidebar and main content area
- **page.tsx** - Dashboard page (statistics and recent meetings)
- **providers.tsx** - React Query and MUI providers setup

#### Meetings Routes
- **meetings/page.tsx** - Meetings list with filtering and pagination
- **meetings/[id]/page.tsx** - Meeting detail page with tabs (Overview, Transcript, Summary)

### Components (`src/components/`)

#### Layout Components
- **layout/Sidebar.tsx** - Navigation sidebar with responsive drawer
- **layout/Header.tsx** - App header with refresh and user avatar

#### Meeting Components
- **meetings/MeetingStatusChip.tsx** - Status indicator chip with color coding
- **meetings/MeetingCard.tsx** - Meeting summary card for grid/list view

#### Summary Components
- **summaries/ActionItemList.tsx** - Checklist of action items with priorities
- **summaries/KeyPointsList.tsx** - Bulleted list of key points

#### Transcript Components
- **transcripts/TranscriptViewer.tsx** - Searchable transcript with speaker segments

#### Dashboard Components
- **dashboard/StatsCards.tsx** - Statistics cards (total, completed, pending, failed)

#### Common Components
- **common/LoadingSpinner.tsx** - Centered loading spinner
- **common/ErrorAlert.tsx** - Error display with retry button

#### Component Exports
- **components/index.ts** - Barrel export for all components

### Hooks (`src/hooks/`)
- **useMeetings.ts** - All React Query hooks for meeting operations
  - useMeetings() - Paginated meetings list
  - useMeeting() - Single meeting details
  - useMeetingTranscript() - Meeting transcript
  - useMeetingSummary() - Meeting summary
  - useProcessMeeting() - Process meeting mutation
  - useToggleActionItem() - Toggle action item completion

- **hooks/index.ts** - Barrel export for all hooks

### Libraries (`src/lib/`)
- **api.ts** - Axios API client with all endpoints
  - getMeetings()
  - getMeeting()
  - getMeetingTranscript()
  - getMeetingSummary()
  - processMeeting()
  - toggleActionItem()
  - createMeeting()

- **theme.ts** - Material-UI custom theme configuration
  - Primary: Indigo (#4F46E5)
  - Secondary: Sky Blue (#0EA5E9)
  - Border Radius: 8px
  - Typography and component styling

- **lib/index.ts** - Barrel exports for lib modules

### Types (`src/types/`)
- **index.ts** - All TypeScript type definitions
  - MeetingStatus (enum)
  - Meeting (interface)
  - Transcript & TranscriptSegment
  - Summary & ActionItem
  - PaginatedResponse<T> (generic)
  - MeetingWithDetails
  - GetMeetingsParams

## File Count Summary

- **Total Files**: 30
- **TypeScript/TSX Files**: 21
- **Configuration Files**: 7
- **Documentation Files**: 2

## Dependencies Tree

```
package.json
├── next@14
├── react@18
├── react-dom@18
├── @mui/material
├── @mui/icons-material
├── @emotion/react
├── @emotion/styled
├── @tanstack/react-query
├── axios
└── date-fns

devDependencies:
├── typescript
├── @types/react
├── @types/react-dom
├── @types/node
├── eslint
└── eslint-config-next
```

## Pages and Routes

| Route | File | Purpose |
|-------|------|---------|
| `/` | `src/app/page.tsx` | Dashboard with stats and recent meetings |
| `/meetings` | `src/app/meetings/page.tsx` | List all meetings with filters |
| `/meetings/[id]` | `src/app/meetings/[id]/page.tsx` | Meeting details with tabs |

## Component Hierarchy

```
RootLayout (src/app/layout.tsx)
├── Providers (src/app/providers.tsx)
│   ├── QueryClientProvider
│   └── ThemeProvider
├── Sidebar
└── Main Content
    ├── Header
    └── Page Content
        ├── DashboardPage
        │   ├── StatsCards
        │   └── RecentMeetingsTable
        ├── MeetingsPage
        │   ├── FilterControls
        │   └── MeetingCard[] (Grid)
        └── MeetingDetailPage
            ├── MeetingMetadata
            ├── ProcessButton
            └── Tabs
                ├── OverviewTab
                ├── TranscriptTab
                │   └── TranscriptViewer
                └── SummaryTab
                    ├── KeyPointsList
                    ├── ActionItemList
                    ├── DecisionsList
                    └── TopicsChips
```

## API Integration Points

All API calls are made through `src/lib/api.ts`:

1. **Meetings List** - `GET /api/meetings`
   - Used by: Dashboard, Meetings page
   - Paginated with filters

2. **Meeting Detail** - `GET /api/meetings/:id`
   - Used by: Meeting detail page
   - Fetches single meeting

3. **Transcript** - `GET /api/meetings/:id/transcript`
   - Used by: Meeting detail (Transcript tab)
   - Displayed in TranscriptViewer

4. **Summary** - `GET /api/meetings/:id/summary`
   - Used by: Meeting detail (Summary tab)
   - Contains key points, action items, decisions

5. **Process Meeting** - `POST /api/meetings/:id/process`
   - Used by: Meeting detail page
   - Triggers meeting processing

6. **Toggle Action Item** - `PATCH /api/summaries/:id/action-items/:index`
   - Used by: ActionItemList component
   - Marks items complete/incomplete

## Styling Strategy

- **Theme Source**: `src/lib/theme.ts`
- **Styling Method**: MUI `sx` prop (emotion-based)
- **Responsive Breakpoints**: xs (mobile), sm (600px), md (960px), lg (1280px)
- **Color Palette**: Custom theme with semantic colors

## Performance Features

- Code splitting via Next.js App Router
- React Query caching (5min stale, 10min cache)
- Lazy component loading
- Image optimization ready
- CSS-in-JS with Emotion for optimal bundling

## Browser Compatibility

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Development Tools

- **Linting**: ESLint with Next.js config
- **Type Checking**: TypeScript 5.3+
- **Code Format**: ESLint rules enforce consistency
- **Dev Server**: Next.js dev server with hot reload

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API base URL (default: http://localhost:3001/api)

## Build Output

- Production build: `npm run build`
- Output directory: `.next/`
- Start production: `npm start`
- Optimization: SWC minification enabled
