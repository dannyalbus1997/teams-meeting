import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Res,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService, AuthTokens } from './auth.service';
import { MeetingSyncService } from '../meetings/meetings-sync.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    @Inject(forwardRef(() => MeetingSyncService))
    private meetingSyncService: MeetingSyncService,
  ) {}

  /**
   * GET /auth/login
   * Redirects user to Microsoft login page
   */
  @Get('login')
  async login(@Res() res: Response, @Query('state') state?: string) {
    const authUrl = await this.authService.getAuthUrl(state);
    return res.redirect(authUrl as any);
  }

  /**
   * GET /auth/callback
   * Microsoft redirects here after login.
   * Exchanges code for tokens and activates meeting sync.
   */
  @Get('callback')
  async handleCallback(
    @Res() res: Response,
    @Query('code') code?: string,
    @Query('error') error?: string,
    @Query('error_description') errorDescription?: string,
  ) {
    if (error) {
      throw new BadRequestException(`OAuth error: ${error} - ${errorDescription || ''}`);
    }

    if (!code) {
      throw new BadRequestException('Missing authorization code');
    }

    try {
      const tokens = await this.authService.handleCallback(code);

      // Activate automatic meeting sync with the new token
      this.meetingSyncService.setAccessToken(tokens.accessToken, tokens.expiresOn);

      this.logger.log('User authenticated — meeting auto-sync activated');

      // Redirect to frontend dashboard
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}?authenticated=true`);
    } catch (err) {
      throw new BadRequestException(
        `Failed to handle callback: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * POST /auth/refresh
   * Refresh expired access token and update sync service
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body('refreshToken') refreshToken?: string): Promise<AuthTokens> {
    if (!refreshToken) {
      throw new BadRequestException('Missing refreshToken in request body');
    }

    const tokens = await this.authService.refreshToken(refreshToken);

    // Update the sync service with new token
    this.meetingSyncService.setAccessToken(tokens.accessToken, tokens.expiresOn);

    return tokens;
  }

  @Get('status')
  @HttpCode(HttpStatus.OK)
  async getAuthStatus() {
    return {
      authenticated: this.meetingSyncService.getIsAuthenticated(),
      syncActive: this.meetingSyncService.getIsAuthenticated(),
    };
  }
}
