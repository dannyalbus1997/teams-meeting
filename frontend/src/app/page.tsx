'use client';

import { useState } from 'react';
import {
  Container,
  Stack,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  TablePagination,
} from '@mui/material';
import Link from 'next/link';
import { format } from 'date-fns';
import { Header } from '@/components/layout/Header';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { MeetingStatusChip } from '@/components/meetings/MeetingStatusChip';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { useMeetings, useMeetingStats } from '@/hooks/useMeetings';

const ITEMS_PER_PAGE = 10;

export default function DashboardPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(ITEMS_PER_PAGE);

  const { data, isLoading, error, refetch } = useMeetings({
    page: page + 1,
    limit: rowsPerPage,
  });

  const { data: stats } = useMeetingStats();

  return (
    <>
      <Header title="Dashboard" onRefresh={() => refetch()} />

      <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
        <Stack spacing={4}>
          <div>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              Overview
            </Typography>
            <StatsCards
              total={stats?.total || 0}
              synced={stats?.synced || 0}
              transcriptFetched={stats?.transcriptFetched || 0}
              summarized={stats?.summarized || 0}
              failed={stats?.failed || 0}
            />
          </div>

          <div>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              Recent Meetings
            </Typography>

            <Card>
              {error && (
                <CardContent>
                  <ErrorAlert message="Failed to load meetings" error={error} onRetry={() => refetch()} />
                </CardContent>
              )}

              {isLoading ? (
                <CardContent>
                  <Stack spacing={1}>
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} height={60} />
                    ))}
                  </Stack>
                </CardContent>
              ) : (
                <>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#F3F4F6' }}>
                          <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Organizer</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Attendees</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(data?.data || []).map((meeting) => (
                          <TableRow
                            key={meeting._id || meeting.id}
                            hover
                            sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#F9FAFB' } }}
                            component={Link}
                            href={`/meetings/${meeting._id || meeting.id}`}
                          >
                            <TableCell sx={{ fontWeight: 500 }}>{meeting.subject}</TableCell>
                            <TableCell>{meeting.organizerName || meeting.organizerEmail}</TableCell>
                            <TableCell>
                              {format(new Date(meeting.startTime), 'MMM d, yyyy h:mm a')}
                            </TableCell>
                            <TableCell>{meeting.attendees?.length || 0}</TableCell>
                            <TableCell>
                              <MeetingStatusChip status={meeting.status} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={data?.total || 0}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(_, p) => setPage(p)}
                    onRowsPerPageChange={(e) => {
                      setRowsPerPage(parseInt(e.target.value, 10));
                      setPage(0);
                    }}
                  />
                </>
              )}
            </Card>
          </div>
        </Stack>
      </Container>
    </>
  );
}
