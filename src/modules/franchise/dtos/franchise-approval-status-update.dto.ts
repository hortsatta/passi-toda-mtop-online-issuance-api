import { IsArray, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { FranchiseApprovalStatus } from '../enums/franchise.enum';
import { FranchiseStatusRemarkCreateDto } from './franchise-status-remark-create.dto';

export class FranchiseApprovalStatusUpdateDto {
  @IsEnum(FranchiseApprovalStatus)
  @IsOptional()
  approvalStatus: FranchiseApprovalStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => FranchiseStatusRemarkCreateDto)
  statusRemarks: FranchiseStatusRemarkCreateDto[];
}
