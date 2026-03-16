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

  /**
   * Extract the organizer's Azure AD Object ID (Oid) from a Teams join URL.
   * The join URL always contains a `context` query param with the Tid and Oid.
   * e.g. ...?context={"Tid":"...","Oid":"bf0d2b43-..."}
   */
  extractOidFromJoinUrl(joinUrl: string): string | null {
    try {
      // The context param may be URL-encoded multiple times
      let contextStr = '';
      const contextMatch = joinUrl.match(/context=([^&]+)/i);
      if (contextMatch) {
        contextStr = decodeURIComponent(contextMatch[1]);
        // May need a second decode if double-encoded
        if (contextStr.includes('%7b') || contextStr.includes('%22')) {
          contextStr = decodeURIComponent(contextStr);
        }
      }
      if (!contextStr) return null;

      const context = JSON.parse(contextStr);
      return context.Oid || context.oid || null;
    } catch {
      return null;
    }
  }

  // ──────────────────────────────────────────────
  //  Calendar Events (App-level: /users/{userId}/calendarview)
  // ──────────────────────────────────────────────

  async getCalendarEvents(
    accessToken: string,
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CalendarEvent[]> {
    try {
      const response = await this.axiosClient.get(`/users/${userId}/calendarview`, {
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
        // Always decode the URL so it matches what the onlineMeetings API stores
        const rawJoinUrl =
          event.onlineMeetingUrl ||
          event.onlineMeeting?.joinUrl ||
          event.onlineMeeting?.joinWebUrl ||
          '';
        const joinUrl = rawJoinUrl ? decodeURIComponent(rawJoinUrl) : '';

        if (!joinUrl) {
          this.logger.warn(
            `Meeting "${event.subject}" has no join URL. Available fields: ` +
            `onlineMeetingUrl=${event.onlineMeetingUrl}, ` +
            `onlineMeeting=${JSON.stringify(event.onlineMeeting || {})}`,
          );
        }

        // Log the raw onlineMeeting object for diagnostics
        if (event.onlineMeeting) {
          this.logger.log(
            `Calendar event "${event.subject}" onlineMeeting: ${JSON.stringify(event.onlineMeeting)}`,
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
          // Raw onlineMeeting object — contains conferenceId, joinUrl, etc.
          rawOnlineMeeting: event.onlineMeeting || null,
        };
      });
    } catch (error) {
      this.handleGraphError(error, 'Failed to fetch calendar events');
    }
  }

  // ──────────────────────────────────────────────
  //  Resolve UPN/email → Object ID (GUID)
  //  The onlineMeetings endpoint REQUIRES Object IDs — UPNs return 404.
  // ──────────────────────────────────────────────

  private userOidCache: Map<string, string> = new Map();

  async resolveUserObjectId(accessToken: string, userIdOrUpn: string): Promise<string> {
    // Already a GUID — return as-is
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userIdOrUpn)) {
      return userIdOrUpn;
    }

    // Check cache
    if (this.userOidCache.has(userIdOrUpn)) {
      return this.userOidCache.get(userIdOrUpn)!;
    }

    // Resolve via Graph API
    try {
      const response = await this.axiosClient.get(`/users/${userIdOrUpn}`, {
        headers: this.getAuthHeaders(accessToken),
        params: { $select: 'id' },
      });
      const oid = response.data.id;
      this.logger.log(`Resolved ${userIdOrUpn} → Object ID ${oid}`);
      this.userOidCache.set(userIdOrUpn, oid);
      return oid;
    } catch (error: any) {
      this.logger.warn(`Could not resolve user "${userIdOrUpn}" to Object ID: ${error.response?.status} ${error.message}`);
      return userIdOrUpn; // Return as-is, will likely fail downstream
    }
  }

  // ──────────────────────────────────────────────
  //  Online Meeting details (by joinWebUrl)
  //  App-level: /users/{userId}/onlineMeetings
  // ──────────────────────────────────────────────

  /**
   * Resolve an online meeting by its join URL.
   *
   * IMPORTANT: The onlineMeetings endpoint REQUIRES the user's Object ID (GUID).
   * UPN/email gives 404. All candidates are resolved to OIDs first.
   *
   * The userId MUST be the **organizer** of the meeting.
   */
  async getOnlineMeetingByJoinUrl(
    accessToken: string,
    userId: string,
    joinWebUrl: string,
    organizerUserId?: string,
  ): Promise<{ meetingId: string; subject: string; resolvedViaUserId: string } | null> {
    // Build list of userIds to try, in priority order:
    const oidFromUrl = this.extractOidFromJoinUrl(joinWebUrl);
    const rawCandidates = new Set<string>();
    if (oidFromUrl) rawCandidates.add(oidFromUrl);
    if (organizerUserId) rawCandidates.add(organizerUserId);
    rawCandidates.add(userId);

    // CRITICAL: Resolve all candidates to Object IDs (GUIDs).
    // The onlineMeetings endpoint returns 404 for UPN/email.
    const resolvedOids = new Set<string>();
    for (const candidate of rawCandidates) {
      const oid = await this.resolveUserObjectId(accessToken, candidate);
      resolvedOids.add(oid);
    }
    const userIdsToTry = Array.from(resolvedOids);

    this.logger.log(`Resolving online meeting — trying OIDs: [${userIdsToTry.join(', ')}]`);

    // Build URL variants to try
    const decodedUrl = decodeURIComponent(joinWebUrl);
    const baseUrl = joinWebUrl.split('?')[0];
    const decodedBaseUrl = decodedUrl.split('?')[0];

    const urlVariants = new Set<string>();
    urlVariants.add(joinWebUrl);
    if (decodedUrl !== joinWebUrl) urlVariants.add(decodedUrl);
    urlVariants.add(baseUrl);
    if (decodedBaseUrl !== baseUrl) urlVariants.add(decodedBaseUrl);

    const urlList = Array.from(urlVariants);
    this.logger.log(`URL variants to try (${urlList.length}): ${urlList.map(u => u.substring(0, 60)).join(' | ')}`);

    for (const uid of userIdsToTry) {
      for (const url of urlList) {
        for (const client of [this.betaClient, this.axiosClient]) {
          try {
            const response = await client.get(
              `/users/${uid}/onlineMeetings`,
              {
                headers: this.getAuthHeaders(accessToken),
                params: {
                  $filter: `JoinWebUrl eq '${url}'`,
                },
              },
            );
            const meeting = response.data.value?.[0];
            if (meeting) {
              this.logger.log(`Resolved online meeting via ${client.defaults.baseURL} /users/${uid}`);
              return { meetingId: meeting.id, subject: meeting.subject, resolvedViaUserId: uid };
            }
          } catch (error: any) {
            this.logger.debug?.(
              `${client.defaults.baseURL} /users/${uid}: ${error.response?.status} ${error.response?.data?.error?.code || error.message}`,
            );
          }
        }
      }
    }

    this.logger.error(
      `Failed to resolve online meeting. ` +
      `OIDs tried: [${userIdsToTry.join(', ')}], ` +
      `URL variants: [${urlList.map(u => u.substring(0, 80)).join(' | ')}]`,
    );
    return null;
  }

  // ──────────────────────────────────────────────
  //  List ALL online meetings (no filter) — for diagnostics
  // ──────────────────────────────────────────────

  async listAllOnlineMeetings(
    accessToken: string,
    userId: string,
  ): Promise<any[]> {
    // IMPORTANT: $top is NOT allowed on onlineMeetings without $filter — causes 400.
    // Also: userId MUST be an Object ID (GUID), not UPN/email — causes 404.
    const resolvedUid = await this.resolveUserObjectId(accessToken, userId);

    for (const client of [this.axiosClient, this.betaClient]) {
      try {
        const response = await client.get(`/users/${resolvedUid}/onlineMeetings`, {
          headers: this.getAuthHeaders(accessToken),
        });
        const meetings = response.data.value || [];
        this.logger.log(
          `listAllOnlineMeetings for ${userId}: found ${meetings.length} meeting(s) via ${client.defaults.baseURL}`,
        );
        return meetings;
      } catch (error: any) {
        const status = error.response?.status;
        const errMsg = error.response?.data?.error?.message || error.message;
        const errCode = error.response?.data?.error?.code || '';
        this.logger.error(
          `listAllOnlineMeetings FAILED for userId=${userId} via ${client.defaults.baseURL}: HTTP ${status} [${errCode}] ${errMsg}`,
        );
      }
    }
    return [];
  }

  /**
   * Raw Graph API call — for diagnostics. Returns the raw JSON response.
   */
  async rawGraphGet(
    accessToken: string,
    path: string,
    apiVersion: 'v1.0' | 'beta' = 'v1.0',
  ): Promise<{ status: number; data?: any; error?: any }> {
    const client = apiVersion === 'beta' ? this.betaClient : this.axiosClient;
    try {
      const response = await client.get(path, {
        headers: this.getAuthHeaders(accessToken),
      });
      return { status: response.status, data: response.data };
    } catch (error: any) {
      return {
        status: error.response?.status || 0,
        error: error.response?.data || { message: error.message },
      };
    }
  }

  // ──────────────────────────────────────────────
  //  Transcripts  (App-level: /users/{userId}/onlineMeetings/{id}/transcripts)
  //  Requires OnlineMeetingTranscript.Read.All application permission
  // ──────────────────────────────────────────────

  async listMeetingTranscripts(
    accessToken: string,
    userId: string,
    onlineMeetingId: string,
  ): Promise<{ id: string; createdDateTime: string }[]> {
    try {
      const response = await this.betaClient.get(
        `/users/${userId}/onlineMeetings/${onlineMeetingId}/transcripts`,
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
    userId: string,
    onlineMeetingId: string,
    transcriptId: string,
    format: 'text/vtt' | 'text/plain' = 'text/vtt',
  ): Promise<string> {
    try {
      const response = await this.betaClient.get(
        `/users/${userId}/onlineMeetings/${onlineMeetingId}/transcripts/${transcriptId}/content`,
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
  //  Recordings  (App-level: /users/{userId}/onlineMeetings/{id}/recordings)
  //  Requires OnlineMeetingRecording.Read.All application permission
  // ──────────────────────────────────────────────

  async listMeetingRecordings(
    accessToken: string,
    userId: string,
    onlineMeetingId: string,
  ): Promise<{ id: string; createdDateTime: string }[]> {
    try {
      const response = await this.betaClient.get(
        `/users/${userId}/onlineMeetings/${onlineMeetingId}/recordings`,
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
    userId: string,
    onlineMeetingId: string,
    recordingId: string,
  ): Promise<Buffer> {
    try {
      const response = await this.betaClient.get(
        `/users/${userId}/onlineMeetings/${onlineMeetingId}/recordings/${recordingId}/content`,
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
  //  Call Records  (App-level: requires CallRecords.Read.All)
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
  //  User Profile (App-level: /users/{userId})
  // ──────────────────────────────────────────────

  async getUserProfile(accessToken: string, userId: string): Promise<GraphUserProfile> {
    try {
      const response = await this.axiosClient.get(`/users/${userId}`, {
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
