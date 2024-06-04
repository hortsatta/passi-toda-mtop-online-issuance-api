import { IsOptional, IsString, MaxLength } from 'class-validator';

export class TodaAssociationUpdateDto {
  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  authorizedRoute: string;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  presidentFirstName: string;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  presidentLastName: string;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  presidentMiddleName: string;
}
