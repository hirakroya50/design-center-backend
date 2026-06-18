import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateVisitorDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsString()
  email?: string;

  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsString()
  stage?: string;

  @IsOptional() @IsString()
  heardAboutUs?: string;

  @IsOptional() @IsString()
  lookingFor?: string;

  @IsOptional() @IsString()
  assignedPartnerId?: string;

  @IsOptional() @IsDateString()
  nextFollowUpAt?: string;
}
