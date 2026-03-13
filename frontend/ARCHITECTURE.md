# Teams Meeting Summarizer Frontend - Architecture

## Overview

A modern, type-safe Next.js 14 frontend for the Teams Meeting Summarizer application. Built with React 18, Material-UI, and React Query for optimal performance and developer experience.

## Design Principles

1. **Type Safety**: Full TypeScript with strict mode
2. **Separation of Concerns**: Components, hooks, and API logic separated
3. **Reusability**: Modular components with single responsibility
4. **Performance**: React Query caching, code splitting, lazy loading
5. **Accessibility**: MUI components with ARIA labels
6. **Responsive**: Mobile-first design with breakpoints

## Architecture Layers

### 1. Pages Layer (`src/app/`)

Entry points for each route. Uses Next.js App Router for file-based routing.

- **Layout**: Defines app shell with sidebar and header
- **Pages**: Route handlers (Dashboard, Meetings list, Meeting detail)
- **Providers**: Wraps entire app with React Query and MUI theme

### 2. Components Layer (`src/components/`)

Reusable, presentational components organized by feature.

- **Layout**: App structure (Sidebar, Header)
- **Meetings**: Meeting-specific components
- **Summaries**: Summary display components
- **Transcripts**: Transcript viewer
- **Dashboard**: Statistics and overview
- **Common**: Utility components (loading, errors)

**Component Pattern**:
```tsx
'use client'; // When using hooks/state

import { FC } from 'react';
import { Box, Typography } from '@mui/material';
import { useHook } from '@/hooks';

interface Props {
  prop1: string;
  prop2?: number;
}

export const ComponentName: FC<Props> = ({ prop1, prop2 }) => {
  // Component logic
  return (
    <Box>
      {/* JSX */}
    </Box>
  );
};
```

### 3. Hooks Layer (`src/hooks/`)

Custom React hooks for data fetching and state management.

All hooks use React Query for:
- Caching
- Automatic refetching
- Deduplication
- Optimistic updates

**Hook Pattern**:
```tsx
'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFunction } from '@/lib/api';

export const useCustomHook = () => {
  return useQuery({
    queryKey: ['unique', 'key'],
    queryFn: apiFunction,
    staleTime: 5 * 60 * 1000,
  });
};
```

### 4. API Layer (`src/lib/api.ts`)

Axios client with typed API functions.

Features:
- Centralized API configuration
- Request/response interceptors
- Error handling
- Base URL from environment

**API Pattern**:
```tsx
export const getResource = async (
  params?: QueryParams
): Promise<ResponseType> => {
  const response = await apiClient.get<ResponseType>(
    '/endpoint',
    { params }
  );
  return response.data;
};
```

### 5. Types Layer (`src/types/`)

TypeScript interfaces and types matching backend schemas.

Includes:
- Domain models (Meeting, Transcript, Summary)
- API request/response types
- Enums (MeetingStatus)
- Generic types (PaginatedResponse)

**Type Pattern**:
```tsx
export interface EntityName {
  id: string;
  createdAt: string;
  updatedAt: string;
  // ... other fields
}

export enum EntityStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}
```

### 6. Theme Layer (`src/lib/theme.ts`)

Material-UI theme configuration with custom colors and typography.

Customizations:
- Color palette (primary, secondary, semantic colors)
- Typography (font family, sizes, weights)
- Component overrides (buttons, cards, tables)
- Spacing and border radius

## Data Flow

### Read Path (Fetching Data)

```
Page Component
  ↓
useHook() [React Query]
  ↓
apiClient.get() [Axios]
  ↓
Backend API
  ↓
Response with cached data [React Query]
  ↓
Component renders
```

### Write Path (Mutations)

```
User Action (e.g., click)
  ↓
useMutation() [React Query]
  ↓
apiClient.post/patch() [Axios]
  ↓
Backend API
  ↓
Response
  ↓
invalidateQueries() [React Query]
  ↓
Automatic refetch
  ↓
Component updates
```

## State Management

### Server State (Data from API)
- **Tool**: React Query
- **Purpose**: Caching, synchronization, deduplication
- **Location**: Hooks in `src/hooks/`
- **Scope**: Global, automatic invalidation

### Client State (UI State)
- **Tool**: React hooks (useState, useCallback)
- **Purpose**: Form inputs, UI toggles, local UI state
- **Location**: Components
- **Scope**: Component level

### Theme State
- **Tool**: Material-UI ThemeProvider
- **Purpose**: Global styling configuration
- **Location**: `src/lib/theme.ts`
- **Scope**: Entire application

## Component Patterns

### Page Component
```tsx
'use client';

export default function PageName() {
  const { data, isLoading, error } = useHook();
  
  return (
    <>
      <Header title="Page Title" />
      <Container>
        {/* Page content */}
      </Container>
    </>
  );
}
```

### Feature Component
```tsx
'use client';

import { FC } from 'react';
import { useHook } from '@/hooks';

interface FeatureProps {
  id: string;
}

export const FeatureComponent: FC<FeatureProps> = ({ id }) => {
  const { data, mutate } = useHook();
  
  return (
    <Box>
      {/* Feature UI */}
    </Box>
  );
};
```

### Presentational Component
```tsx
'use client';

import { FC } from 'react';

interface Props {
  data: DataType;
  onAction?: (value: string) => void;
}

export const PresentationalComponent: FC<Props> = ({ data, onAction }) => {
  return (
    <Box>
      {/* Pure presentation */}
    </Box>
  );
};
```

## Styling Architecture

### Theme Customization
```tsx
// src/lib/theme.ts
const theme = createTheme({
  palette: {
    primary: { main: '#4F46E5' },
    secondary: { main: '#0EA5E9' },
  },
  typography: { /* ... */ },
  components: { /* ... */ },
});
```

### Component Styling
```tsx
// Using sx prop for component-level styles
<Box sx={{
  display: 'flex',
  gap: 2,
  p: { xs: 1, md: 2 },  // Responsive
  backgroundColor: 'background.default',  // Semantic color
  '&:hover': { /* ... */ },
}}>
```

## Performance Optimizations

### 1. Code Splitting
- Next.js App Router automatically splits code by route
- Components loaded only when needed

### 2. Caching Strategy
```
Fresh    → Stale              → Background Refetch
(0min)   (5 min)              (triggers fetch)
         User sees cached     User sees fresh data
         data from cache      after refetch
```

### 3. Image Optimization
- Use `next/image` for all images
- Automatic optimization and serving

### 4. Bundle Size
- Tree-shaking removes unused code
- Emotion CSS-in-JS for optimal styling
- React Query abstracts complex state

## Error Handling

### API Errors
- Caught at hook level
- Passed to component via hook return
- Display ErrorAlert with retry option

### Component Errors
- Handled in catch blocks
- User-friendly error messages
- Retry functionality

### TypeScript Errors
- Strict mode catches type mismatches at compile time
- Run `npm run type-check` before deployment

## Testing Strategy (Future)

### Unit Tests
- Components: Render with props, test interactions
- Hooks: Test query/mutation behavior
- Utils: Test function outputs

### Integration Tests
- Page flows (e.g., list → detail → edit)
- Form submissions
- API integration

### E2E Tests
- Critical user paths
- Cross-browser compatibility
- Responsive design

## Deployment

### Build Process
```bash
npm run build      # Create production bundle
npm start          # Start production server
```

### Environment
- `NEXT_PUBLIC_API_URL`: Backend API URL
- Must be set before build for static generation

### Optimization
- SWC minification enabled
- Image optimization
- CSS/JS minification
- Code splitting by route

## Directory Structure Rationale

```
src/
├── app/           # Pages and routing (Next.js specific)
├── components/    # UI components by feature
├── hooks/         # React Query hooks (data layer)
├── lib/           # Utilities (api, theme, helpers)
└── types/         # TypeScript definitions
```

This structure enables:
- Clear separation of concerns
- Easy to locate related files
- Scalable organization as app grows
- Consistent patterns across features

## Future Enhancements

### Short Term
- Add tests (unit, integration, E2E)
- Implement error boundaries
- Add analytics tracking
- Form validation library

### Medium Term
- Add authentication/authorization
- Implement real-time updates (WebSocket)
- Add dark mode toggle
- Performance monitoring

### Long Term
- Internationalization (i18n)
- Offline support (Service Workers)
- Advanced caching strategies
- Plugin system for extensibility

## Debugging

### Browser DevTools
- React DevTools: Inspect components, props, hooks
- Network tab: Monitor API calls
- Console: Check for errors and logs

### Development Tools
```bash
npm run type-check    # Check TypeScript errors
npm run lint         # Check code quality
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query)
- [Material-UI Documentation](https://mui.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
