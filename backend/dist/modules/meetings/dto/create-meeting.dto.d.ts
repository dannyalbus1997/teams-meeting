export declare class CreateMeetingDto {
    teamsEventId: string;
    subject: string;
    organizer?: string;
    participants?: string[];
    startTime: Date;
    endTime?: Date;
    joinUrl?: string;
}
