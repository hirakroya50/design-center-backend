import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTimelineDto {
  @IsString()
  @MaxLength(120)
  label!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  detail?: string;
}
