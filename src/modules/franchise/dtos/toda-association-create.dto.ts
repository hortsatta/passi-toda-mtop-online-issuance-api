import { IsOptional, IsString, MaxLength } from 'class-validator';

export class TodaAssociationCreateDto {
  @IsString()
  @MaxLength(225)
  name: string;

  @IsString()
  authorizedRoute: string;

  @IsString()
  @MaxLength(50)
  presidentFirstName: string;

  @IsString()
  @MaxLength(50)
  presidentLastName: string;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  presidentMiddleName: string;
}
