import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfidentialClientApplication } from '@azure/msal-node';

export interface AuthTokens {
  accessToken: string;
  expiresOn: Date;
}

export interface UserProfile {
  id: string;
  displayName: string;
  mail: string;
  jobTitle?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private cca: ConfidentialClientApplication | null = null;
  private clientId: string;
  private clientSecret: string;
  private tenantId: string;
  private appScopes: string[];

  // Cached app token
  private cachedToken: AuthTokens | null = null;

  // The user whose calendar/meetings we will access via app permissions
  private targetUserId: string;

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get<string>('azure.clientId') || '';
    this.clientSecret = this.configService.get<string>('azure.clientSecret') || '';
    this.tenantId = this.configService.get<string>('azure.tenantId') || 'common';
    this.targetUserId = this.configService.get<string>('azure.targetUserId') || '';

    // App-only (client credential) permissions use the /.default scope.
    // This uses whatever **Application** permissions are granted to the app registration
    // in Azure AD (e.g. Calendars.Read, OnlineMeetings.Read.All, etc.).
    this.appScopes = ['https://graph.microsoft.com/.default'];

    if (!this.clientId || !this.clientSecret) {
      this.logger.warn(
        'Microsoft OAuth is not configured. ' +
        'Set AZURE_CLIENT_ID and AZURE_CLIENT_SECRET in .env to enable Teams integration.',
      );
      return;
    }

    if (!this.targetUserId) {
      this.logger.warn(
        'AZURE_TARGET_USER_ID is not set. ' +
        'Set it to the Object ID or UPN of the user whose meetings you want to sync.',
      );
    }

    this.cca = new ConfidentialClientApplication({
      auth: {
        clientId: this.clientId,
        authority: `https://login.microsoftonline.com/${this.tenantId}`,
        clientSecret: this.clientSecret,
      },
    });

    this.logger.log('Auth service initialized with app-level (client credentials) flow');
  }

  /**
   * Get the target user ID whose calendar/meetings we access.
   * This can be an Azure AD Object ID (GUID) or a UPN (user@domain.com).
   */
  getTargetUserId(): string {
    return this.targetUserId;
  }

  /**
   * Acquire an application-level access token using the client credentials flow.
   * This uses app-only permissions (no user/delegate context) based on the
   * **Application** permissions granted to your Azure AD app registration.
   *
   * Tokens are cached and automatically refreshed when expired.
   */
  async getAppAccessToken(): Promise<AuthTokens> {
    if (!this.cca) {
      throw new UnauthorizedException('Microsoft OAuth is not configured');
    }

    // Return cached token if still valid
    if (this.cachedToken && !this.isTokenExpired(this.cachedToken.expiresOn)) {
      return this.cachedToken;
    }

    try {
      const response = await this.cca.acquireTokenByClientCredential({
        scopes: this.appScopes,
      });

      if (!response || !response.accessToken) {
        throw new UnauthorizedException('Failed to acquire app access token');
      }

      this.cachedToken = {
        accessToken: response.accessToken,
        expiresOn: response.expiresOn || new Date(Date.now() + 3600 * 1000),
      };

      this.logger.log('App access token acquired/refreshed successfully');
      return this.cachedToken;
    } catch (error) {
      this.cachedToken = null;
      throw new UnauthorizedException(
        `Failed to acquire app access token: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Check if the service is properly configured and can obtain tokens.
   */
  isConfigured(): boolean {
    return !!this.cca && !!this.targetUserId;
  }

  isTokenExpired(expiresOn: Date): boolean {
    const buffer = 5 * 60 * 1000; // 5 minutes
    return new Date(expiresOn.getTime() - buffer) < new Date();
  }
}
