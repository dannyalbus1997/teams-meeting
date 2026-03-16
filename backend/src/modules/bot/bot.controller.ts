import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { BotService } from './bot.service';
import { MeetingSyncService } from '../meetings/meetings-sync.service';

@ApiTags('bot')
@Controller('bot')
export class BotController {
  private readonly logger = new Logger(BotController.name);

  constructor(
    private readonly botService: BotService,
    private readonly meetingSyncService: MeetingSyncService,
  ) {}

  /**
   * POST /bot/join/:meetingId
   * Bot joins a Teams meeting and starts recording.
   */
  @Post('join/:meetingId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bot joins a Teams meeting and starts recording' })
  @ApiParam({ name: 'meetingId', description: 'Database meeting ID' })
  async joinMeeting(@Param('meetingId') meetingId: string) {
    // Pass user access token to bot for post-meeting processing
    const userToken = this.meetingSyncService.getAccessToken();
    if (userToken) {
      this.botService.setUserAccessToken(userToken);
    }

    const callInfo = await this.botService.joinMeeting(meetingId);
    return {
      message: `Bot is joining the meeting`,
      callId: callInfo.callId,
      status: callInfo.status,
      meetingId: callInfo.meetingId,
    };
  }

  /**
   * POST /bot/record/:callId
   * Start recording an active call.
   */
  @Post('record/:callId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start recording an active call' })
  @ApiParam({ name: 'callId', description: 'Graph API call ID' })
  async startRecording(@Param('callId') callId: string) {
    await this.botService.startRecording(callId);
    return { message: 'Recording started', callId };
  }

  /**
   * DELETE /bot/leave/:callId
   * Bot leaves the meeting and triggers processing.
   */
  @Delete('leave/:callId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bot leaves the meeting and triggers post-processing' })
  @ApiParam({ name: 'callId', description: 'Graph API call ID' })
  async leaveMeeting(@Param('callId') callId: string) {
    await this.botService.leaveMeeting(callId);
    return {
      message: 'Bot is leaving the meeting. Recording will be processed shortly.',
      callId,
    };
  }

  /**
   * GET /bot/status
   * Get all active bot calls.
   */
  @Get('status')
  @ApiOperation({ summary: 'Get status of all active bot calls' })
  async getStatus() {
    const activeCalls = this.botService.getActiveCalls();
    return {
      activeCalls: activeCalls.length,
      calls: activeCalls,
    };
  }

  /**
   * GET /bot/status/:meetingId
   * Get bot status for a specific meeting.
   */
  @Get('status/:meetingId')
  @ApiOperation({ summary: 'Get bot status for a specific meeting' })
  @ApiParam({ name: 'meetingId', description: 'Database meeting ID' })
  async getMeetingBotStatus(@Param('meetingId') meetingId: string) {
    const callInfo = this.botService.getCallByMeetingId(meetingId);
    if (!callInfo) {
      return { active: false, message: 'Bot is not in this meeting' };
    }
    return {
      active: true,
      ...callInfo,
    };
  }

  /**
   * POST /bot/callback
   * Webhook callback for Microsoft Graph Communications API.
   * Graph sends call state change notifications here.
   */
  @Post('callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook callback for Graph Communications API' })
  async handleCallback(@Req() req: Request, @Res() res: Response) {
    // Handle validation token (webhook subscription validation)
    const validationToken = req.query.validationToken as string;
    if (validationToken) {
      this.logger.log('Bot callback validation request received');
      res.set('Content-Type', 'text/plain');
      return res.status(200).send(validationToken);
    }

    // Handle notifications
    const body = req.body;

    if (body?.value && Array.isArray(body.value)) {
      for (const notification of body.value) {
        try {
          await this.botService.handleCallNotification(notification);
        } catch (err: any) {
          this.logger.error(`Error handling call notification: ${err.message}`);
        }
      }
    } else if (body?.resourceData) {
      // Single notification
      try {
        await this.botService.handleCallNotification(body);
      } catch (err: any) {
        this.logger.error(`Error handling call notification: ${err.message}`);
      }
    }

    return res.status(200).json({ status: 'ok' });
  }

  /**
   * GET /bot/setup
   * Guide for setting up the bot in Azure.
   */
  @Get('setup')
  @ApiOperation({ summary: 'Setup guide for configuring the bot in Azure' })
  async getSetupGuide() {
    return {
      title: 'Teams Meeting Bot Setup Guide',
      steps: [
        {
          step: 1,
          title: 'Register a Bot in Azure',
          details: [
            'Go to Azure Portal > Create a resource > Search "Azure Bot"',
            'Create a new Azure Bot resource',
            'Choose "Multi Tenant" for bot type',
            'Note the Microsoft App ID (this is your BOT_APP_ID)',
          ],
        },
        {
          step: 2,
          title: 'Configure Application Permissions',
          details: [
            'Go to Azure Portal > App Registrations > Your Bot App',
            'Click "API permissions" > "Add a permission" > "Microsoft Graph"',
            'Choose "Application permissions" (NOT Delegated)',
            'Add: Calls.JoinGroupCall.All',
            'Add: Calls.AccessMedia.All',
            'Add: Calls.Initiate.All',
            'Add: Calls.InitiateGroupCall.All',
            'Click "Grant admin consent for [your org]"',
          ],
        },
        {
          step: 3,
          title: 'Create a Client Secret',
          details: [
            'In the same App Registration, go to "Certificates & secrets"',
            'Create a new client secret',
            'Copy the VALUE (not the ID!) — this is your BOT_APP_SECRET',
          ],
        },
        {
          step: 4,
          title: 'Set Up Public Callback URL',
          details: [
            'The bot needs a publicly accessible URL for Graph API callbacks',
            'For local development: install ngrok (https://ngrok.com)',
            'Run: ngrok http 3001',
            'Copy the https URL (e.g., https://abc123.ngrok-free.app)',
            'Set BOT_CALLBACK_URL=https://abc123.ngrok-free.app/api in .env',
          ],
        },
        {
          step: 5,
          title: 'Update .env File',
          details: [
            'BOT_APP_ID=<your bot app ID>',
            'BOT_APP_SECRET=<your bot app secret value>',
            'BOT_TENANT_ID=<your Azure tenant ID>',
            'BOT_CALLBACK_URL=<your ngrok or public URL>/api',
          ],
        },
        {
          step: 6,
          title: 'Configure Bot Messaging Endpoint',
          details: [
            'Go back to your Azure Bot resource',
            'Under "Configuration", set the Messaging endpoint to:',
            '<your-callback-url>/bot/callback',
            'e.g., https://abc123.ngrok-free.app/api/bot/callback',
          ],
        },
        {
          step: 7,
          title: 'Add Bot to Teams (Optional)',
          details: [
            'In the Azure Bot resource, go to "Channels"',
            'Add "Microsoft Teams" channel',
            'This allows the bot to be added to Teams directly',
          ],
        },
      ],
      requiredPermissions: [
        { name: 'Calls.JoinGroupCall.All', type: 'Application', purpose: 'Join group calls/meetings as a bot' },
        { name: 'Calls.AccessMedia.All', type: 'Application', purpose: 'Access media streams in calls' },
        { name: 'Calls.Initiate.All', type: 'Application', purpose: 'Initiate outgoing calls' },
        { name: 'Calls.InitiateGroupCall.All', type: 'Application', purpose: 'Initiate group calls' },
      ],
      envExample: {
        BOT_APP_ID: '(your bot app registration client ID)',
        BOT_APP_SECRET: '(your bot app secret VALUE)',
        BOT_TENANT_ID: '(your Azure AD tenant ID)',
        BOT_CALLBACK_URL: 'https://your-ngrok-url.ngrok-free.app/api',
      },
    };
  }
}
