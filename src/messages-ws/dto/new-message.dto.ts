import { IsString, MinLength } from 'class-validator';

export class NewMessageDto {
  @IsString()
  id: string;
  @IsString()
  @MinLength(1)
  message: string;
}
