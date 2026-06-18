import { IsIn, IsOptional, IsString, IsDateString } from 'class-validator';

export class FollowUpDto {
  @IsIn(['advance', 'won', 'lost', 'note'])
  outcome!: 'advance' | 'won' | 'lost' | 'note';

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDateString()
  nextFollowUpAt?: string;

  @IsOptional()
  @IsString()
  lostReason?: string;
}
