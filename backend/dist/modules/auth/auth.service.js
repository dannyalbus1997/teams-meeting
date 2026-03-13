"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const msal_node_1 = require("@azure/msal-node");
let AuthService = class AuthService {
    constructor(configService) {
        this.configService = configService;
        this.cca = null;
        this.clientId = this.configService.get('azure.clientId') || '';
        this.clientSecret = this.configService.get('azure.clientSecret') || '';
        this.tenantId = this.configService.get('azure.tenantId') || 'common';
        this.redirectUri = this.configService.get('azure.redirectUri') || 'http://localhost:3001/api/auth/callback';
        this.scopes = [
            'User.Read',
            'Calendars.Read',
            'OnlineMeetings.Read',
            'OnlineMeetingTranscript.Read.All',
            'OnlineMeetingRecording.Read.All',
            'offline_access',
        ];
        if (!this.clientId || !this.clientSecret) {
            console.warn('Microsoft OAuth is not configured. ' +
                'Set AZURE_CLIENT_ID and AZURE_CLIENT_SECRET in .env to enable Teams integration.');
            return;
        }
        this.cca = new msal_node_1.ConfidentialClientApplication({
            auth: {
                clientId: this.clientId,
                authority: `https://login.microsoftonline.com/${this.tenantId}`,
                clientSecret: this.clientSecret,
            },
        });
    }
    async getAuthUrl(state) {
        if (!this.cca) {
            throw new common_1.UnauthorizedException('Microsoft OAuth is not configured');
        }
        const authUrl = await this.cca.getAuthCodeUrl({
            scopes: this.scopes,
            redirectUri: this.redirectUri,
            state: state || this.generateRandomState(),
        });
        return authUrl;
    }
    async handleCallback(code) {
        if (!this.cca) {
            throw new common_1.UnauthorizedException('Microsoft OAuth is not configured');
        }
        try {
            const tokenRequest = {
                code,
                scopes: this.scopes,
                redirectUri: this.redirectUri,
            };
            const response = await this.cca.acquireTokenByCode(tokenRequest);
            if (!response || !response.accessToken) {
                throw new common_1.UnauthorizedException('Failed to acquire access token');
            }
            return {
                accessToken: response.accessToken,
                idToken: response.idToken,
                expiresOn: response.expiresOn || new Date(Date.now() + 3600 * 1000),
            };
        }
        catch (error) {
            throw new common_1.UnauthorizedException(`OAuth callback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async refreshToken(refreshToken) {
        if (!this.cca) {
            throw new common_1.UnauthorizedException('Microsoft OAuth is not configured');
        }
        try {
            const response = await this.cca.acquireTokenByRefreshToken({
                refreshToken,
                scopes: this.scopes,
            });
            if (!response || !response.accessToken) {
                throw new common_1.UnauthorizedException('Failed to refresh access token');
            }
            return {
                accessToken: response.accessToken,
                idToken: response.idToken,
                expiresOn: response.expiresOn || new Date(Date.now() + 3600 * 1000),
            };
        }
        catch (error) {
            throw new common_1.UnauthorizedException(`Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    isTokenExpired(expiresOn) {
        const buffer = 5 * 60 * 1000;
        return new Date(expiresOn.getTime() - buffer) < new Date();
    }
    async getUserProfile(accessToken) {
        try {
            const tokenParts = accessToken.split('.');
            if (tokenParts.length !== 3) {
                throw new Error('Invalid token format');
            }
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString('utf-8'));
            return {
                id: payload.oid || payload.sub,
                displayName: payload.name || 'Unknown',
                mail: payload.email || payload.upn || '',
                jobTitle: payload.jobTitle,
            };
        }
        catch (error) {
            throw new common_1.UnauthorizedException(`Failed to get user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    generateRandomState() {
        return Buffer.from(Math.random().toString()).toString('base64').substring(0, 32);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map