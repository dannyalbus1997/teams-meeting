'use client';

import { useState, useMemo } from 'react';
import {
  Container,
  Stack,
  Typography,
  Card,
  CardContent,
  Box,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Button,
  Skeleton,
} from '@mui/material';
import { Header } from '@/components/layout/Header';
import { MeetingCard } from '@/components/meetings/MeetingCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { useMeetings } from '@/hooks/useMeetings';
import { MeetingStatus, GetMeetingsParams } from '@/types';

/**
 * Meetings list page with filtering and grid view
 */
export default function MeetingsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [statusFilter, setStatusFilter] = useState<MeetingStatus | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const params: GetMeetingsParams = useMemo(
    () => ({
      page,
      limit,
      ...(statusFilter && { status: statusFilter as MeetingStatus }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    }),
    [page, limit, statusFilter, startDate, endDate]
  );

  const { data, isLoading, error, refetch } = useMeetings(params);

  const handleResetFilters = () => {
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <>
      <Header title="Meetings" onRefresh={() => refetch()} />

      <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
        <Stack spacing={3}>
          {/* Filters */}
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Filters
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={statusFilter}
                        label="Status"
                        onChange={(e) => {
                          setStatusFilter(e.target.value as MeetingStatus | '');
                          setPage(1);
                        }}
                      >
                        <MenuItem value="">All</MenuItem>
                        {Object.values(MeetingStatus).map((status) => (
                          <MenuItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() +
                              status.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      type="date"
                      label="Start Date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setPage(1);
                      }}
                      size="small"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      type="date"
                      label="End Date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setPage(1);
                      }}
                      size="small"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={handleResetFilters}
                      sx={{ height: '40px' }}
                    >
                      Reset Filters
                    </Button>
                  </Grid>
                </Grid>
              </Stack>
            </CardContent>
          </Card>

          {/* Error state */}
          {error && (
            <ErrorAlert
              message="Failed to load meetings"
              error={error}
              onRetry={() => refetch()}
            />
          )}

          {/* Meetings grid */}
          {isLoading ? (
            <Grid container spacing={2}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Skeleton
                    variant="rectangular"
                    height={250}
                    sx={{ borderRadius: 1 }}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (data?.data.length || 0) > 0 ? (
            <>
              <Grid container spacing={2}>
                {data!.data.map((meeting) => (
                  <Grid item xs={12} sm={6} md={4} key={meeting.id}>
                    <MeetingCard meeting={meeting} />
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 1,
                  mt: 3,
                }}
              >
                <Button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  variant="outlined"
                >
                  Previous
                </Button>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                  }}
                >
                  <Typography variant="body2">
                    Page {page} of {totalPages}
                  </Typography>
                </Box>

                <Button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  variant="outlined"
                >
                  Next
                </Button>
              </Box>
            </>
          ) : (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No meetings found
                </Typography>
              </CardContent>
            </Card>
          )}
        </Stack>
      </Container>
    </>
  );
}
