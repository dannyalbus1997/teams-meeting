import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsBoolean, Min } from 'class-validator';

export class UpdateActionItemDto {
  @ApiProperty({ description: 'Index of the action item in the array' })
  @IsNumber()
  @Min(0)
  actionItemIndex: number;

  @ApiProperty({ description: 'Mark action item as completed or incomplete' })
  @IsBoolean()
  completed: boolean;
}
