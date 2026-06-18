import { IsOptional, IsString } from 'class-validator';

export class CreateVisitorDto {
  @IsString()
  name!: string;

  @IsOptional() @IsString()
  email?: string;

  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsString()
  heardAboutUs?: string;

  @IsOptional() @IsString()
  lookingFor?: string;

  @IsOptional() @IsString()
  stage?: string;

  @IsOptional() @IsString()
  assignedPartnerId?: string;
}
