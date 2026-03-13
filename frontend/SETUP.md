# Teams Meeting Summarizer Frontend - Setup Guide

## Quick Start

### 1. Installation

```bash
cd teams-meeting-summarizer/frontend
npm install
```

### 2. Environment Setup

Create `.env.local`:

```bash
cp .env.example .env.local
```

Update the API URL if your backend runs on a different port:

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
npm start
```

## File Structure Summary

```
frontend/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx               # Root layout
│   │   ├── page.tsx                 # Dashboard
│   │   ├── providers.tsx            # React Query & MUI providers
│   │   └── meetings/
│   │       ├── page.tsx             # Meetings list
│   │       └── [id]/page.tsx        # Meeting detail
│   │
│   ├── components/                   # Reusable UI components
│   │   ├── layout/                  # Layout (Sidebar, Header)
│   │   ├── meetings/                # Meeting cards & status chips
│   │   ├── summaries/               # Action items & key points
│   │   ├── transcripts/             # Transcript viewer
│   │   ├── dashboard/               # Stats cards
│   │   ├── common/                  # Loading, error alerts
│   │   └── index.ts                 # Component exports
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── useMeetings.ts           # Meeting-related queries/mutations
│   │   └── index.ts                 # Hook exports
│   │
│   ├── lib/                          # Utilities & config
│   │   ├── api.ts                   # Axios API client
│   │   ├── theme.ts                 # MUI theme config
│   │   └── index.ts                 # Library exports
│   │
│   └── types/                        # TypeScript types
│       └── index.ts                 # All app types
│
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
├── next.config.js                    # Next.js config
├── .eslintrc.json                    # ESLint config
├── .gitignore                        # Git ignore rules
├── .env.example                      # Environment template
├── README.md                         # Full documentation
└── SETUP.md                          # This file
```

## Key Components Overview

### Pages

- **Dashboard** (`src/app/page.tsx`)
  - Statistics cards (total, completed, pending, failed)
  - Recent meetings table with pagination

- **Meetings List** (`src/app/meetings/page.tsx`)
  - Grid view of all meetings
  - Filters by status and date range
  - Pagination

- **Meeting Detail** (`src/app/meetings/[id]/page.tsx`)
  - Three tabs: Overview, Transcript, Summary
  - Meeting metadata
  - Process meeting action
  - Action items with checkboxes

### Components

- **Sidebar**: Navigation with responsive drawer
- **Header**: App header with refresh button
- **MeetingStatusChip**: Status indicator with color coding
- **MeetingCard**: Meeting summary card
- **TranscriptViewer**: Searchable transcript with segments
- **ActionItemList**: Checklist with priorities and deadlines
- **KeyPointsList**: Bulleted list of key points
- **StatsCards**: Dashboard statistics
- **LoadingSpinner**: Centered loading indicator
- **ErrorAlert**: Error messages with retry

### Hooks

- **useMeetings**: Paginated meetings list
- **useMeeting**: Single meeting details
- **useMeetingTranscript**: Meeting transcript
- **useMeetingSummary**: Meeting summary
- **useProcessMeeting**: Process meeting mutation
- **useToggleActionItem**: Toggle action item completion

## API Integration

All API calls go through `src/lib/api.ts` using Axios. React Query handles caching and state management.

### Endpoints Used

```
GET    /api/meetings                  - List meetings
GET    /api/meetings/:id              - Get meeting
GET    /api/meetings/:id/transcript   - Get transcript
GET    /api/meetings/:id/summary      - Get summary
POST   /api/meetings/:id/process      - Process meeting
PATCH  /api/summaries/:id/action-items/:index - Toggle action item
```

## TypeScript

All components and functions are fully typed. Core types in `src/types/index.ts`:

- `MeetingStatus` enum
- `Meeting` interface
- `Transcript` & `TranscriptSegment`
- `Summary` & `ActionItem`
- `PaginatedResponse<T>` generic

## Material-UI Theme

Custom theme in `src/lib/theme.ts`:

- **Primary**: Indigo (#4F46E5)
- **Secondary**: Sky Blue (#0EA5E9)
- **Border Radius**: 8px
- **Font**: System fonts

## React Query Configuration

Default settings in `src/app/providers.tsx`:

- Stale time: 5 minutes
- Cache time: 10 minutes
- Retry: 1 attempt
- Focus refetch: Disabled

## Development Tips

### Adding a New Page

1. Create file in `src/app/[route]/page.tsx`
2. Mark with `'use client'` if using hooks
3. Import components and hooks
4. Use `Header` component for consistency

### Adding a New Component

1. Create in `src/components/[category]/ComponentName.tsx`
2. Mark with `'use client'` if using hooks/state
3. Export from `src/components/index.ts`
4. Use MUI components for styling

### Adding API Calls

1. Add function to `src/lib/api.ts`
2. Create React Query hook in `src/hooks/useMeetings.ts`
3. Export from `src/hooks/index.ts`
4. Use in components

### Styling with MUI

Use the `sx` prop for responsive styling:

```tsx
<Box sx={{
  display: { xs: 'block', md: 'flex' },
  gap: 2,
  p: 2,
  backgroundColor: 'background.default'
}}>
  Content
</Box>
```

## Troubleshooting

### Port 3000 Already in Use

```bash
npm run dev -- -p 3001
```

### API Connection Errors

- Check backend is running on `NEXT_PUBLIC_API_URL`
- Check network tab in DevTools
- Verify CORS settings on backend

### TypeScript Errors

```bash
npm run type-check
```

### Clear Cache

```bash
rm -rf .next
npm run dev
```

## Commands Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Check TypeScript |

## Performance Considerations

- Next.js App Router handles code splitting
- React Query caches results automatically
- MUI components use CSS-in-JS for styling
- Images should be optimized with `next/image`
- Use lazy loading for heavy components

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers supported

## Next Steps

1. Install dependencies: `npm install`
2. Set up `.env.local`
3. Start dev server: `npm run dev`
4. Open `http://localhost:3000`
5. Verify backend API is running
6. Test meeting list and detail pages

For full documentation, see `README.md`.
