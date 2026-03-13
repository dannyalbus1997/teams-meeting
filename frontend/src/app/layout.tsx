import type { Metadata } from 'next';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { Providers } from './providers';
import { Sidebar } from '@/components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'Teams Meeting Summarizer',
  description:
    'AI-powered meeting summarizer for Microsoft Teams with transcription and insights',
};

/**
 * Root layout component with app shell
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        <Providers>
          <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar navigation */}
            <Box
              sx={{
                display: { xs: 'none', sm: 'block' },
                width: 280,
              }}
            >
              <Sidebar />
            </Box>

            {/* Main content area */}
            <Box
              component="main"
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'background.default',
              }}
            >
              {children}
            </Box>
          </Box>
        </Providers>
      </body>
    </html>
  );
}
