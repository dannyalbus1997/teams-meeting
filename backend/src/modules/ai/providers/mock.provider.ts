import { Injectable } from '@nestjs/common';
import { AiProvider, MeetingAnalysis } from '../../../common/interfaces';

/**
 * Mock AI provider for development and testing.
 * Simulates realistic meeting analysis with a 500ms delay.
 */
@Injectable()
export class MockProvider implements AiProvider {
  async analyzeTranscript(transcript: string, meetingTopic?: string): Promise<MeetingAnalysis> {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate mock data based on transcript length and content hints
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

  async summarize(text: string): Promise<string> {
    const maxLength = 240;
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (normalized.length <= maxLength) {
      return normalized;
    }
    return `${normalized.slice(0, maxLength).trim()}...`;
  }
}
