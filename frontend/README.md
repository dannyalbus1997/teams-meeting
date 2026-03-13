# Teams Meeting Summarizer - Frontend

A modern Next.js frontend for the Teams Meeting Summarizer application, built with React 18, Material-UI, and React Query.

## Features

- Dashboard with meeting statistics
- Meetings list with filtering and pagination
- Meeting detail page with tabs for overview, transcript, and summary
- Real-time meeting processing status
- Action items tracking with completion toggle
- Transcript viewer with search and segment view
- Responsive design for mobile and desktop
- Type-safe with full TypeScript support

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI Library**: Material-UI (MUI) v5
- **State Management**: React Query (TanStack Query)
- **HTTP Client**: Axios
- **Date Utilities**: date-fns
- **Language**: TypeScript
- **Styling**: Emotion (MUI's styling engine)

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

1. Clone the repository and navigate to the frontend directory:

```bash
cd teams-meeting-summarizer/frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file based on `.env.example`:

```bash
cp .env.example .env.local
```

4. Update the API URL in `.env.local` if needed (default is `http://localhost:3001/api`):

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Build

Build for production:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Dashboard page
│   ├── providers.tsx      # React Query and MUI providers
│   └── meetings/          # Meetings routes
│       ├── page.tsx       # Meetings list
│       └── [id]/          # Meeting detail
│           └── page.tsx
├── components/            # Reusable components
│   ├── layout/           # Layout components (Sidebar, Header)
│   ├── meetings/         # Meeting-related components
│   ├── summaries/        # Summary display components
│   ├── transcripts/      # Transcript viewer component
│   ├── dashboard/        # Dashboard components
│   └── common/           # Common utility components
├── hooks/                # Custom React hooks
│   └── useMeetings.ts   # Meeting-related hooks
├── lib/                  # Utilities and configurations
│   ├── api.ts           # Axios API client
│   └── theme.ts         # MUI theme configuration
└── types/               # TypeScript type definitions
    └── index.ts
```

## Key Components

### Pages

- **Dashboard** (`/`): Overview with statistics and recent meetings
- **Meetings** (`/meetings`): List of all meetings with filters
- **Meeting Detail** (`/meetings/[id]`): Detailed view with transcript and summary

### Features

1. **Statistics Dashboard**: Shows total, completed, pending, and failed meetings
2. **Meeting Filters**: Filter by status and date range
3. **Meeting Status Tracking**: Visual indicators for processing status
4. **Transcript Viewer**: Search and view transcripts with speaker labels
5. **Summary Display**: Key points, decisions, action items, and topics
6. **Action Item Tracking**: Mark action items as complete

## API Integration

The frontend communicates with the backend API through the `src/lib/api.ts` module. All API calls are made through React Query hooks defined in `src/hooks/useMeetings.ts`.

### Available Endpoints

- `GET /api/meetings` - List meetings (paginated)
- `GET /api/meetings/:id` - Get meeting details
- `GET /api/meetings/:id/transcript` - Get meeting transcript
- `GET /api/meetings/:id/summary` - Get meeting summary
- `POST /api/meetings/:id/process` - Trigger meeting processing
- `PATCH /api/summaries/:id/action-items/:index` - Toggle action item

## Styling

The application uses Material-UI with a custom theme defined in `src/lib/theme.ts`. The primary color scheme uses indigo and sky blue for a modern look.

### Theme Configuration

- **Primary Color**: Indigo (#4F46E5)
- **Secondary Color**: Sky Blue (#0EA5E9)
- **Border Radius**: 8px
- **Font Family**: System fonts with fallback to sans-serif

## State Management

React Query is used for server state management with the following features:

- Automatic caching and invalidation
- Optimistic updates for mutations
- Stale time: 5 minutes for queries
- Cache time: 10 minutes
- Automatic retry on failure

## TypeScript

All components and utilities are fully typed with TypeScript. Type definitions are centralized in `src/types/index.ts` to match the backend schemas.

## Error Handling

The application includes comprehensive error handling:

- API error display with retry buttons
- Loading states with skeleton screens
- Graceful fallbacks for missing data
- User-friendly error messages

## Responsive Design

The UI is fully responsive and works seamlessly on:

- Mobile phones (320px+)
- Tablets (600px+)
- Desktop screens (1200px+)

The sidebar navigation collapses on mobile devices.

## Performance Optimizations

- Code splitting with Next.js
- Image optimization
- CSS-in-JS bundling with Emotion
- React Query caching and deduplication
- Lazy loading of components

## Environment Variables

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Note: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## Development Workflows

### Adding a New Feature

1. Create types in `src/types/index.ts`
2. Add API functions in `src/lib/api.ts`
3. Create React Query hooks in `src/hooks/useMeetings.ts`
4. Build components in `src/components/`
5. Create/update pages in `src/app/`

### Styling Components

Use MUI components with the `sx` prop for styling. Material-UI theming automatically applies across all components.

```tsx
<Box sx={{
  display: 'flex',
  gap: 2,
  p: 2,
  backgroundColor: 'background.default'
}}>
  {/* Content */}
</Box>
```

## Troubleshooting

### API Connection Issues

- Ensure the backend is running on the configured URL
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Review browser console for network errors

### Styling Issues

- Clear Next.js cache: `rm -rf .next`
- Restart the development server
- Check browser DevTools for CSS conflicts

### TypeScript Errors

- Run `npm run type-check` to validate types
- Check that API response types match `src/types/index.ts`

## License

MIT
