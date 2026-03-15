'use client';

import { useMemo } from 'react';
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
  Box,
  Skeleton,
  TablePagination,
} from '@mui/material';
import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Header } from '@/components/layout/Header';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { MeetingStatusChip } from '@/components/meetings/MeetingStatusChip';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { useMeetings } from '@/hooks/useMeetings';
import { MeetingStatus } from '@/types';

const ITEMS_PER_PAGE = 10;

/**
 * Dashboard page showing statistics and recent meetings
 */
export default function DashboardPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(ITEMS_PER_PAGE);

  const { data, isLoading, error, refetch } = useMeetings({
    page: page + 1,
    limit: rowsPerPage,
  });

  const stats = useMemo(() => {
    if (!data?.data) {
      return {
        total: 0,
        completed: 0,
        pending: 0,
        failed: 0,
      };
    }

    return {
      total: data.total,
      completed: data.data.filter((m) => m.status === MeetingStatus.COMPLETED)
        .length,
      pending: data.data.filter(
        (m) =>
          m.status === MeetingStatus.DETECTED ||
          m.status === MeetingStatus.TRANSCRIBING ||
          m.status === MeetingStatus.ANALYZING
      ).length,
      failed: data.data.filter((m) => m.status === MeetingStatus.FAILED)
        .length,
    };
  }, [data]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <>
      <Header title="Dashboard" onRefresh={() => refetch()} />

      <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
        <Stack spacing={4}>
          {/* Statistics Cards */}
          <div>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              Overview
            </Typography>
            <StatsCards
              totalMeetings={stats.total}
              completedMeetings={stats.completed}
              pendingMeetings={stats.pending}
              failedMeetings={stats.failed}
            />
          </div>

          {/* Recent Meetings Table */}
          <div>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              Recent Meetings
            </Typography>

            <Card>
              {error && (
                <CardContent>
                  <ErrorAlert
                    message="Failed to load meetings"
                    error={error}
                    onRetry={() => refetch()}
                  />
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
                          <TableCell sx={{ fontWeight: 600 }}>
                            Participants
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(data?.data || []).map((meeting) => (
                          <TableRow
                            key={meeting._id || meeting.id}
                            hover
                            sx={{
                              cursor: 'pointer',
                              '&:hover': { backgroundColor: '#F9FAFB' },
                            }}
                            component={Link}
                            href={`/meetings/${meeting._id || meeting.id}`}
                          >
                            <TableCell sx={{ fontWeight: 500 }}>
                              {meeting.subject}
                            </TableCell>
                            <TableCell>{meeting.organizer}</TableCell>
                            <TableCell>
                              {format(
                                new Date(meeting.startTime),
                                'MMM d, yyyy h:mm a'
                              )}
                            </TableCell>
                            <TableCell>{meeting.participants.length}</TableCell>
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
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
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
