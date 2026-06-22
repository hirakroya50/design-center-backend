import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyOtpSmsDto {
  @IsString()
  @IsNotEmpty()
  mobile: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}
