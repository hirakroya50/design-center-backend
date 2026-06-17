import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Role } from '../../generated/prisma';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(Role)
  role: Role;
}
