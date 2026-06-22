import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateVisitorDto {
  @IsString()
  fullName!: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  projectLocation?: string;

  @IsOptional()
  @IsString()
  leadSource?: string;

  @IsOptional()
  @IsString()
  referrerName?: string;

  @IsOptional()
  @IsString()
  referrerMobile?: string;

  @IsOptional()
  @IsString()
  referrerCategory?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interestedCategories?: string[];

  @IsOptional()
  @IsString()
  propertyType?: string;

  @IsOptional()
  @IsString()
  projectStage?: string;

  @IsOptional()
  @IsString()
  budgetRange?: string;

  @IsOptional()
  @IsString()
  designStyle?: string;

  @IsOptional()
  @IsString()
  heardAboutUs?: string;

  @IsOptional()
  @IsString()
  lookingFor?: string;

  @IsOptional()
  @IsNumber()
  tourProgress?: number;

  @IsOptional()
  @IsString()
  stage?: string;

  @IsOptional()
  @IsString()
  assignedPartnerId?: string;
}
