import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface CalendarEvent {
  id: string;
  subject: string;
  start: Date;
  end: Date;
  organizer?: {
    displayName: string;
    emailAddress: string;
  };
  attendees?: Array<{
    displayName: string;
    emailAddress: string;
  }>;
  isOnlineMeeting: boolean;
  onlineMeetingUrl?: string;
  onlineMeetingId?: string;
}

export interface GraphUserProfile {
  id: string;
  displayName: string;
  mail: string;
  mobilePhone?: string;
  jobTitle?: string;
}

export interface OnlineMeetingTranscript {
  id: string;
  content: string;
  contentType: string;
  createdDateTime: string;
}

export interface CallRecord {
  id: string;
  type: string;
  startDateTime: string;
  endDateTime: string;
  joinWebUrl: string;
  organizer?: { user?: { id: string; displayName: string } };
  participants?: Array<{ user?: { id: string; displayName: string } }>;
}

@Injectable()
export class GraphService {
  private readonly logger = new Logger(GraphService.name);
  private axiosClient: AxiosInstance;
  private betaClient: AxiosInstance;

  constructor(private configService: ConfigService) {
    this.axiosClient = axios.create({
      baseURL: 'https://graph.microsoft.com/v1.0',
      headers: { 'Content-Type': 'application/json' },
    });
    this.betaClient = axios.create({
      baseURL: 'https://graph.microsoft.com/beta',
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private getAuthHeaders(accessToken: string): Record<string, string> {
    return {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  // ──────────────────────────────────────────────
  //  Calendar Events
  // ──────────────────────────────────────────────

  async getCalendarEvents(
    accessToken: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CalendarEvent[]> {
    try {
      const response = await this.axiosClient.get('/me/calendarview', {
        headers: this.getAuthHeaders(accessToken),
        params: {
          startDateTime: startDate.toISOString(),
          endDateTime: endDate.toISOString(),
          $select:
            'id,subject,start,end,organizer,attendees,isOnlineMeeting,onlineMeetingUrl,onlineMeeting,body',
          $top: 100,
        },
      });

      // Filter for online meetings on client side (Graph API doesn't support filtering by isOnlineMeeting)
      const onlineMeetings = (response.data.value || []).filter(
        (event: any) => event.isOnlineMeeting === true,
      );

      return onlineMeetings.map((event: any) => {
        // Try multiple fields for the join URL — Graph API is inconsistent
        const joinUrl =
          event.onlineMeetingUrl ||
          event.onlineMeeting?.joinUrl ||
          event.onlineMeeting?.joinWebUrl ||
          '';

        if (!joinUrl) {
          this.logger.warn(
            `Meeting "${event.subject}" has no join URL. Available fields: ` +
            `onlineMeetingUrl=${event.onlineMeetingUrl}, ` +
            `onlineMeeting=${JSON.stringify(event.onlineMeeting || {})}`,
          );
        }

        return {
          id: event.id,
          subject: event.subject || '(No subject)',
          start: new Date(event.start.dateTime + 'Z'),
          end: new Date(event.end.dateTime + 'Z'),
          organizer: event.organizer?.emailAddress
            ? {
                displayName: event.organizer.emailAddress.name,
                emailAddress: event.organizer.emailAddress.address,
              }
            : undefined,
          attendees: (event.attendees || []).map((att: any) => ({
            displayName: att.emailAddress?.name,
            emailAddress: att.emailAddress?.address,
          })),
          isOnlineMeeting: true,
          onlineMeetingUrl: joinUrl,
          onlineMeetingId: event.onlineMeeting?.joinMeetingIdSettings?.joinMeetingId,
          // Pass the raw body field too so we can also extract the body for join links
          bodyContent: event.body?.content || '',
        };
      });
    } catch (error) {
      this.handleGraphError(error, 'Failed to fetch calendar events');
    }
  }

  // ──────────────────────────────────────────────
  //  Online Meeting details (by joinWebUrl)
  // ──────────────────────────────────────────────

  async getOnlineMeetingByJoinUrl(
    accessToken: string,
    joinWebUrl: string,
  ): Promise<{ meetingId: string; subject: string } | null> {
    try {
      const encodedUrl = encodeURIComponent(joinWebUrl);
      const response = await this.axiosClient.get(
        `/me/onlineMeetings?$filter=JoinWebUrl eq '${encodedUrl}'`,
        { headers: this.getAuthHeaders(accessToken) },
      );
      const meeting = response.data.value?.[0];
      if (!meeting) return null;
      return { meetingId: meeting.id, subject: meeting.subject };
    } catch (error) {
      this.logger.warn(`Could not resolve online meeting for URL: ${error.message}`);
      return null;
    }
  }

  // ──────────────────────────────────────────────
  //  Transcripts  (requires OnlineMeetingTranscript.Read.All)
  // ──────────────────────────────────────────────

  async listMeetingTranscripts(
    accessToken: string,
    onlineMeetingId: string,
  ): Promise<{ id: string; createdDateTime: string }[]> {
    try {
      const response = await this.betaClient.get(
        `/me/onlineMeetings/${onlineMeetingId}/transcripts`,
        { headers: this.getAuthHeaders(accessToken) },
      );
      return response.data.value || [];
    } catch (error) {
      this.logger.warn(`No transcripts found for meeting ${onlineMeetingId}: ${error.message}`);
      return [];
    }
  }

  async getTranscriptContent(
    accessToken: string,
    onlineMeetingId: string,
    transcriptId: string,
    format: 'text/vtt' | 'text/plain' = 'text/vtt',
  ): Promise<string> {
    try {
      const response = await this.betaClient.get(
        `/me/onlineMeetings/${onlineMeetingId}/transcripts/${transcriptId}/content`,
        {
          headers: {
            ...this.getAuthHeaders(accessToken),
            Accept: format,
          },
          responseType: 'text',
        },
      );
      return response.data;
    } catch (error) {
      this.handleGraphError(error, 'Failed to fetch transcript content');
    }
  }

  // ──────────────────────────────────────────────
  //  Recordings  (requires OnlineMeetingRecording.Read.All)
  // ──────────────────────────────────────────────

  async listMeetingRecordings(
    accessToken: string,
    onlineMeetingId: string,
  ): Promise<{ id: string; createdDateTime: string }[]> {
    try {
      const response = await this.betaClient.get(
        `/me/onlineMeetings/${onlineMeetingId}/recordings`,
        { headers: this.getAuthHeaders(accessToken) },
      );
      return response.data.value || [];
    } catch (error) {
      this.logger.warn(`No recordings for meeting ${onlineMeetingId}: ${error.message}`);
      return [];
    }
  }

  async getRecordingContent(
    accessToken: string,
    onlineMeetingId: string,
    recordingId: string,
  ): Promise<Buffer> {
    try {
      const response = await this.betaClient.get(
        `/me/onlineMeetings/${onlineMeetingId}/recordings/${recordingId}/content`,
        {
          headers: this.getAuthHeaders(accessToken),
          responseType: 'arraybuffer',
        },
      );
      return Buffer.from(response.data);
    } catch (error) {
      this.handleGraphError(error, 'Failed to download recording');
    }
  }

  // ──────────────────────────────────────────────
  //  Call Records  (requires CallRecords.Read.All)
  // ──────────────────────────────────────────────

  async getRecentCallRecords(
    accessToken: string,
    fromDate: Date,
  ): Promise<CallRecord[]> {
    try {
      const response = await this.axiosClient.get('/communications/callRecords', {
        headers: this.getAuthHeaders(accessToken),
        params: {
          $filter: `startDateTime ge ${fromDate.toISOString()}`,
          $top: 50,
          $orderby: 'startDateTime desc',
        },
      });
      return response.data.value || [];
    } catch (error) {
      this.logger.warn(`Could not fetch call records: ${error.message}`);
      return [];
    }
  }

  // ──────────────────────────────────────────────
  //  Webhook Subscriptions (for real-time events)
  // ──────────────────────────────────────────────

  async createSubscription(
    accessToken: string,
    resource: string,
    notificationUrl: string,
    changeType: string = 'created,updated',
    expirationMinutes: number = 4230, // ~3 days max for callRecords
  ): Promise<any> {
    try {
      const expirationDateTime = new Date(
        Date.now() + expirationMinutes * 60 * 1000,
      ).toISOString();

      const response = await this.axiosClient.post(
        '/subscriptions',
        {
          changeType,
          notificationUrl,
          resource,
          expirationDateTime,
          clientState: 'teams-meeting-summarizer-secret',
        },
        { headers: this.getAuthHeaders(accessToken) },
      );

      this.logger.log(`Webhook subscription created for resource: ${resource}`);
      return response.data;
    } catch (error) {
      this.handleGraphError(error, 'Failed to create webhook subscription');
    }
  }

  async renewSubscription(
    accessToken: string,
    subscriptionId: string,
    expirationMinutes: number = 4230,
  ): Promise<any> {
    try {
      const expirationDateTime = new Date(
        Date.now() + expirationMinutes * 60 * 1000,
      ).toISOString();

      const response = await this.axiosClient.patch(
        `/subscriptions/${subscriptionId}`,
        { expirationDateTime },
        { headers: this.getAuthHeaders(accessToken) },
      );
      return response.data;
    } catch (error) {
      this.handleGraphError(error, 'Failed to renew subscription');
    }
  }

  // ──────────────────────────────────────────────
  //  User Profile
  // ──────────────────────────────────────────────

  async getUserProfile(accessToken: string): Promise<GraphUserProfile> {
    try {
      const response = await this.axiosClient.get('/me', {
        headers: this.getAuthHeaders(accessToken),
        params: {
          $select: 'id,displayName,mail,mobilePhone,jobTitle',
        },
      });
      return response.data;
    } catch (error) {
      this.handleGraphError(error, 'Failed to fetch user profile');
    }
  }

  // ──────────────────────────────────────────────
  //  VTT Parser
  // ──────────────────────────────────────────────

  parseVttTranscript(vttContent: string): {
    fullText: string;
    segments: Array<{ start: number; end: number; text: string; speaker?: string }>;
  } {
    const lines = vttContent.split('\n');
    const segments: Array<{ start: number; end: number; text: string; speaker?: string }> = [];
    let fullText = '';
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();

      // Match timestamp lines like "00:00:01.000 --> 00:00:05.000"
      const timestampMatch = line.match(
        /(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/,
      );

      if (timestampMatch) {
        const start = this.vttTimeToSeconds(timestampMatch[1]);
        const end = this.vttTimeToSeconds(timestampMatch[2]);

        // Collect text lines until blank line
        i++;
        let text = '';
        let speaker: string | undefined;

        while (i < lines.length && lines[i].trim() !== '') {
          const textLine = lines[i].trim();
          // Check for speaker tag like <v Speaker Name>
          const speakerMatch = textLine.match(/<v\s+([^>]+)>/);
          if (speakerMatch) {
            speaker = speakerMatch[1];
            text += textLine.replace(/<v\s+[^>]+>/, '').replace(/<\/v>/, '') + ' ';
          } else {
            text += textLine + ' ';
          }
          i++;
        }

        text = text.trim();
        if (text) {
          segments.push({ start, end, text, speaker });
          fullText += (speaker ? `${speaker}: ` : '') + text + '\n';
        }
      }
      i++;
    }

    return { fullText: fullText.trim(), segments };
  }

  private vttTimeToSeconds(timeStr: string): number {
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseFloat(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  }

  private handleGraphError(error: any, defaultMessage: string): never {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const errorMessage = error.response?.data?.error?.message || error.message;
      this.logger.error(`${defaultMessage}: ${statusCode} - ${errorMessage}`);
      throw new HttpException(`${defaultMessage}: ${errorMessage}`, statusCode);
    }
    throw new HttpException(
      `${defaultMessage}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
