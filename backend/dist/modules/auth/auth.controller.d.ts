import { Response } from 'express';
import { AuthService, AuthTokens } from './auth.service';
import { MeetingSyncService } from '../meetings/meetings-sync.service';
export declare class AuthController {
    private authService;
    private meetingSyncService;
    private readonly logger;
    constructor(authService: AuthService, meetingSyncService: MeetingSyncService);
    login(res: Response, state?: string): Promise<void>;
    handleCallback(res: Response, code?: string, error?: string, errorDescription?: string): Promise<void>;
    refreshToken(refreshToken?: string): Promise<AuthTokens>;
    getAuthStatus(): Promise<{
        authenticated: boolean;
        syncActive: boolean;
    }>;
}
