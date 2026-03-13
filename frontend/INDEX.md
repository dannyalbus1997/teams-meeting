# Teams Meeting Summarizer Frontend - Complete File Index

## Quick Navigation

### Getting Started
- **[SETUP.md](./SETUP.md)** - Quick start guide (recommended first read)
- **[README.md](./README.md)** - Complete documentation
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Design patterns and architecture
- **[FILE_MANIFEST.md](./FILE_MANIFEST.md)** - Detailed file structure

### Configuration
- **[package.json](./package.json)** - Dependencies and scripts
- **[tsconfig.json](./tsconfig.json)** - TypeScript configuration
- **[next.config.js](./next.config.js)** - Next.js configuration
- **[.eslintrc.json](./.eslintrc.json)** - Linting rules
- **[.env.example](./.env.example)** - Environment template
- **[.gitignore](./.gitignore)** - Git ignore rules

---

## Source Code Structure

### Pages (`src/app/`)
```
src/app/
├── layout.tsx              # Root layout with app shell
├── page.tsx                # Dashboard (statistics + recent meetings)
├── providers.tsx           # React Query & MUI theme providers
└── meetings/
    ├── page.tsx            # Meetings list (with filters)
    └── [id]/
        └── page.tsx        # Meeting detail (tabs: overview, transcript, summary)
```

### Components (`src/components/`)
```
src/components/
├── index.ts                # Barrel exports
├── layout/
│   ├── Sidebar.tsx        # Navigation drawer
│   └── Header.tsx         # App header
├── meetings/
│   ├── MeetingStatusChip.tsx   # Status indicator
│   └── MeetingCard.tsx         # Meeting summary card
├── summaries/
│   ├── ActionItemList.tsx      # Action items checklist
│   └── KeyPointsList.tsx       # Key points list
├── transcripts/
│   └── TranscriptViewer.tsx    # Transcript with search
├── dashboard/
│   └── StatsCards.tsx          # Statistics cards
└── common/
    ├── LoadingSpinner.tsx      # Loading indicator
    └── ErrorAlert.tsx          # Error messages
```

### Hooks (`src/hooks/`)
```
src/hooks/
├── index.ts                # Barrel exports
└── useMeetings.ts         # All React Query hooks
    ├── useMeetings()           # Paginated list
    ├── useMeeting()            # Single meeting
    ├── useMeetingTranscript()  # Transcript
    ├── useMeetingSummary()     # Summary
    ├── useProcessMeeting()     # Process mutation
    └── useToggleActionItem()   # Action item mutation
```

### Libraries (`src/lib/`)
```
src/lib/
├── index.ts               # Barrel exports
├── api.ts                # Axios client & endpoints
└── theme.ts              # MUI theme configuration
```

### Types (`src/types/`)
```
src/types/
└── index.ts              # All TypeScript definitions
    ├── MeetingStatus enum
    ├── Meeting interface
    ├── Transcript & TranscriptSegment
    ├── Summary & ActionItem
    ├── PaginatedResponse<T>
    └── GetMeetingsParams
```

---

## Features by Location

### Dashboard (`src/app/page.tsx`)
- Statistics cards (total, completed, pending, failed)
- Recent meetings table with pagination
- Refresh functionality

### Meetings List (`src/app/meetings/page.tsx`)
- Grid view of all meetings
- Filter by status (5 status types)
- Filter by date range
- Pagination (5, 10, 25 items per page)
- Meeting cards with metadata

### Meeting Detail (`src/app/meetings/[id]/page.tsx`)
- Three tabs: Overview, Transcript, Summary
- Meeting metadata and participants
- "Process Meeting" button for unprocessed meetings
- **Overview Tab**: Summary text and quick overview
- **Transcript Tab**: TranscriptViewer with search and segment view
- **Summary Tab**:
  - Key points list
  - Decisions list
  - Action items checklist (with toggles)
  - Topics discussed (chip display)
  - AI metadata (provider, model, processing time)

---

## Component Details

### Status Chip (MeetingStatusChip)
- detected → gray
- transcribing → blue (info)
- analyzing → orange (warning)
- completed → green (success)
- failed → red (error)

### Action Items (ActionItemList)
- Checkboxes for completion toggle
- Priority badges (high, medium, low)
- Deadline display
- Assignee information
- Mutation with loading state

### Transcript Viewer (TranscriptViewer)
- Full text view mode
- Segment view mode with speaker labels
- Search/filter within transcript
- Timestamp display (HH:MM:SS format)
- Confidence scores for low-confidence segments
- Metadata: language, word count, duration

### Stats Cards (StatsCards)
- Total meetings (indigo)
- Completed (green)
- Pending (orange)
- Failed (red)
- Responsive grid (1-4 columns based on screen)

---

## Hook Details

All hooks use React Query with:
- Automatic caching (5min stale time)
- Deduplication
- Error handling
- Optional refetching

### Query Keys
- `['meetings']` - All meetings queries
- `['meetings', 'list', params]` - Paginated list
- `['meetings', 'detail', id]` - Single meeting
- `['meetings', 'transcript', meetingId]` - Transcript
- `['meetings', 'summary', meetingId]` - Summary

---

## API Endpoints Used

All calls through `src/lib/api.ts`:

| Method | Endpoint | Hook | Purpose |
|--------|----------|------|---------|
| GET | /api/meetings | useMeetings() | List meetings |
| GET | /api/meetings/:id | useMeeting() | Get meeting |
| GET | /api/meetings/:id/transcript | useMeetingTranscript() | Get transcript |
| GET | /api/meetings/:id/summary | useMeetingSummary() | Get summary |
| POST | /api/meetings/:id/process | useProcessMeeting() | Process meeting |
| PATCH | /api/summaries/:id/action-items/:index | useToggleActionItem() | Toggle item |

---

## Theme Configuration

### Colors
- **Primary (Indigo)**: #4F46E5 (light: #818CF8, dark: #4338CA)
- **Secondary (Sky)**: #0EA5E9 (light: #38BDF8, dark: #0284C7)
- **Success**: #10B981
- **Warning**: #F59E0B
- **Error**: #EF4444
- **Info**: #3B82F6

### Breakpoints
- xs: 0px (mobile)
- sm: 600px (small devices)
- md: 960px (tablets)
- lg: 1280px (desktops)

---

## Development Commands

```bash
npm run dev          # Start development server (port 3000)
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run type-check   # Check TypeScript errors
```

---

## Environment Setup

1. Copy `.env.example` to `.env.local`
2. Set `NEXT_PUBLIC_API_URL` (default: http://localhost:3001/api)
3. Run `npm install`
4. Run `npm run dev`

---

## Key Points

✅ **Type-Safe**: Full TypeScript with strict mode
✅ **Responsive**: Mobile-first design with breakpoints
✅ **Performant**: Code splitting, caching, lazy loading
✅ **Documented**: Comprehensive comments in code
✅ **Maintainable**: Clear structure and separation of concerns
✅ **Production-Ready**: Error handling, loading states, validation

---

## File Count Summary

| Category | Count |
|----------|-------|
| Pages | 5 |
| Components | 12 |
| Hooks | 2 |
| Libraries | 3 |
| Types | 1 |
| Configuration | 7 |
| Documentation | 4 |
| **Total** | **34** |

---

For detailed documentation, see [README.md](./README.md)
For setup instructions, see [SETUP.md](./SETUP.md)
For architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md)
