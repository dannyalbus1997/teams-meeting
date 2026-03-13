import { ConfigService } from '@nestjs/config';
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
export declare class AuthService {
    private configService;
    private cca;
    private clientId;
    private clientSecret;
    private tenantId;
    private redirectUri;
    private scopes;
    constructor(configService: ConfigService);
    getAuthUrl(state?: string): Promise<string>;
    handleCallback(code: string): Promise<AuthTokens>;
    refreshToken(refreshToken: string): Promise<AuthTokens>;
    isTokenExpired(expiresOn: Date): boolean;
    getUserProfile(accessToken: string): Promise<UserProfile>;
    private generateRandomState;
}
