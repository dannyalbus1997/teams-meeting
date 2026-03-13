import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConfidentialClientApplication,
  AuthorizationCodeRequest,
} from '@azure/msal-node';

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
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
  private cca: ConfidentialClientApplication | null = null;
  private clientId: string;
  private clientSecret: string;
  private tenantId: string;
  private redirectUri: string;
  private scopes: string[];

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get<string>('azure.clientId') || '';
    this.clientSecret = this.configService.get<string>('azure.clientSecret') || '';
    this.tenantId = this.configService.get<string>('azure.tenantId') || 'common';
    this.redirectUri = this.configService.get<string>('azure.redirectUri') || 'http://localhost:3001/api/auth/callback';
    this.scopes = [
      'User.Read',
      'Calendars.Read',
      'OnlineMeetings.Read',
      'OnlineMeetingTranscript.Read.All',
      'OnlineMeetingRecording.Read.All',
      'offline_access',
    ];

    if (!this.clientId || !this.clientSecret) {
      console.warn(
        'Microsoft OAuth is not configured. ' +
        'Set AZURE_CLIENT_ID and AZURE_CLIENT_SECRET in .env to enable Teams integration.',
      );
      return;
    }

    this.cca = new ConfidentialClientApplication({
      auth: {
        clientId: this.clientId,
        authority: `https://login.microsoftonline.com/${this.tenantId}`,
        clientSecret: this.clientSecret,
      },
    });
  }

  async getAuthUrl(state?: string): Promise<string> {
    if (!this.cca) {
      throw new UnauthorizedException('Microsoft OAuth is not configured');
    }

    const authUrl = await this.cca.getAuthCodeUrl({
      scopes: this.scopes,
      redirectUri: this.redirectUri,
      state: state || this.generateRandomState(),
    });

    return authUrl;
  }

  async handleCallback(code: string): Promise<AuthTokens> {
    if (!this.cca) {
      throw new UnauthorizedException('Microsoft OAuth is not configured');
    }

    try {
      const tokenRequest: AuthorizationCodeRequest = {
        code,
        scopes: this.scopes,
        redirectUri: this.redirectUri,
      };

      const response = await this.cca.acquireTokenByCode(tokenRequest);

      if (!response || !response.accessToken) {
        throw new UnauthorizedException('Failed to acquire access token');
      }

      return {
        accessToken: response.accessToken,
        idToken: response.idToken,
        expiresOn: response.expiresOn || new Date(Date.now() + 3600 * 1000),
      };
    } catch (error) {
      throw new UnauthorizedException(
        `OAuth callback failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    if (!this.cca) {
      throw new UnauthorizedException('Microsoft OAuth is not configured');
    }

    try {
      const response = await this.cca.acquireTokenByRefreshToken({
        refreshToken,
        scopes: this.scopes,
      });

      if (!response || !response.accessToken) {
        throw new UnauthorizedException('Failed to refresh access token');
      }

      return {
        accessToken: response.accessToken,
        idToken: response.idToken,
        expiresOn: response.expiresOn || new Date(Date.now() + 3600 * 1000),
      };
    } catch (error) {
      throw new UnauthorizedException(
        `Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  isTokenExpired(expiresOn: Date): boolean {
    const buffer = 5 * 60 * 1000;
    return new Date(expiresOn.getTime() - buffer) < new Date();
  }

  async getUserProfile(accessToken: string): Promise<UserProfile> {
    try {
      const tokenParts = accessToken.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const payload = JSON.parse(
        Buffer.from(tokenParts[1], 'base64').toString('utf-8'),
      );

      return {
        id: payload.oid || payload.sub,
        displayName: payload.name || 'Unknown',
        mail: payload.email || payload.upn || '',
        jobTitle: payload.jobTitle,
      };
    } catch (error) {
      throw new UnauthorizedException(
        `Failed to get user profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private generateRandomState(): string {
    return Buffer.from(Math.random().toString()).toString('base64').substring(0, 32);
  }
}
