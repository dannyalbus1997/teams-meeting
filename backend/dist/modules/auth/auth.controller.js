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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const meetings_sync_service_1 = require("../meetings/meetings-sync.service");
let AuthController = AuthController_1 = class AuthController {
    constructor(authService, meetingSyncService) {
        this.authService = authService;
        this.meetingSyncService = meetingSyncService;
        this.logger = new common_1.Logger(AuthController_1.name);
    }
    async login(res, state) {
        const authUrl = await this.authService.getAuthUrl(state);
        return res.redirect(authUrl);
    }
    async handleCallback(res, code, error, errorDescription) {
        if (error) {
            throw new common_1.BadRequestException(`OAuth error: ${error} - ${errorDescription || ''}`);
        }
        if (!code) {
            throw new common_1.BadRequestException('Missing authorization code');
        }
        try {
            const tokens = await this.authService.handleCallback(code);
            this.meetingSyncService.setAccessToken(tokens.accessToken, tokens.expiresOn);
            this.logger.log('User authenticated — meeting auto-sync activated');
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            return res.redirect(`${frontendUrl}?authenticated=true`);
        }
        catch (err) {
            throw new common_1.BadRequestException(`Failed to handle callback: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }
    async refreshToken(refreshToken) {
        if (!refreshToken) {
            throw new common_1.BadRequestException('Missing refreshToken in request body');
        }
        const tokens = await this.authService.refreshToken(refreshToken);
        this.meetingSyncService.setAccessToken(tokens.accessToken, tokens.expiresOn);
        return tokens;
    }
    async getAuthStatus() {
        return {
            authenticated: this.meetingSyncService.getIsAuthenticated(),
            syncActive: this.meetingSyncService.getIsAuthenticated(),
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Get)('login'),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Query)('state')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('callback'),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Query)('code')),
    __param(2, (0, common_1.Query)('error')),
    __param(3, (0, common_1.Query)('error_description')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "handleCallback", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)('refreshToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getAuthStatus", null);
exports.AuthController = AuthController = AuthController_1 = __decorate([
    (0, common_1.Controller)('auth'),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => meetings_sync_service_1.MeetingSyncService))),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        meetings_sync_service_1.MeetingSyncService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map