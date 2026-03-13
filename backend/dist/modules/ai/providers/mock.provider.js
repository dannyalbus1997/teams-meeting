"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockProvider = void 0;
const common_1 = require("@nestjs/common");
let MockProvider = class MockProvider {
    async analyzeTranscript(transcript, meetingTopic) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const hasQ4InTranscript = transcript.toLowerCase().includes('q4');
        const hasProjectInTranscript = transcript.toLowerCase().includes('project');
        const hasDeadlineInTranscript = transcript.toLowerCase().includes('deadline');
        return {
            summary: 'Team discussed quarterly objectives, project timeline, and resource allocation for the upcoming sprint. Key focus areas include feature development, bug fixes, and team capacity planning.',
            keyPoints: [
                'Q4 objectives aligned with company strategy',
                hasProjectInTranscript
                    ? 'Project scope and timeline clarified'
                    : 'Development roadmap reviewed',
                'Resource constraints identified and discussed',
                'Cross-team collaboration requirements outlined',
                'Risk mitigation strategies proposed',
            ],
            actionItems: [
                {
                    assignee: 'Project Manager',
                    task: 'Create detailed project plan with milestones',
                    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    priority: 'high',
                },
                {
                    assignee: 'Tech Lead',
                    task: hasDeadlineInTranscript
                        ? 'Communicate deadline to team'
                        : 'Review technical requirements and dependencies',
                    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                    priority: 'high',
                },
                {
                    assignee: 'Team Lead',
                    task: 'Allocate resources across projects',
                    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                    priority: 'medium',
                },
            ],
            decisions: [
                'Approved budget allocation for Q4 initiatives',
                'Decided to prioritize feature development over technical debt in next sprint',
                'Approved hiring of 2 contract developers for 3-month period',
                'Chose agile sprint approach with bi-weekly reviews',
            ],
        };
    }
    async summarize(text) {
        const maxLength = 240;
        const normalized = text.replace(/\s+/g, ' ').trim();
        if (normalized.length <= maxLength) {
            return normalized;
        }
        return `${normalized.slice(0, maxLength).trim()}...`;
    }
};
exports.MockProvider = MockProvider;
exports.MockProvider = MockProvider = __decorate([
    (0, common_1.Injectable)()
], MockProvider);
//# sourceMappingURL=mock.provider.js.map