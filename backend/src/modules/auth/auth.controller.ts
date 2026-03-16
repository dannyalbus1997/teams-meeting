import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  /**
   * GET /auth/status
   * Check if app-level authentication is configured and working.
   */
  @Get('status')
  @HttpCode(HttpStatus.OK)
  async getAuthStatus() {
    const configured = this.authService.isConfigured();
    let tokenValid = false;

    if (configured) {
      try {
        await this.authService.getAppAccessToken();
        tokenValid = true;
      } catch (error) {
        this.logger.warn(`Token acquisition failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      authenticated: configured && tokenValid,
      syncActive: configured && tokenValid,
      mode: 'app-level (client credentials)',
      configured,
      tokenValid,
      targetUserId: this.authService.getTargetUserId() || '(not set)',
    };
  }

  /**
   * GET /auth/test
   * Test the app-level authentication by acquiring a token.
   * Useful for verifying Azure AD app registration is correct.
   */
  @Get('test')
  @HttpCode(HttpStatus.OK)
  async testAuth() {
    try {
      const tokens = await this.authService.getAppAccessToken();
      return {
        success: true,
        message: 'App-level token acquired successfully',
        expiresOn: tokens.expiresOn,
        targetUserId: this.authService.getTargetUserId(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to acquire app token: ${error instanceof Error ? error.message : 'Unknown error'}`,
        hint: 'Verify AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, and AZURE_TENANT_ID in your .env file. ' +
          'Also ensure Application permissions (not Delegated) are granted in Azure AD and admin consent is given.',
      };
    }
  }
}
