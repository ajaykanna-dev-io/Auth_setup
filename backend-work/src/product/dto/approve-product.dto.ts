import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class ApproveProductDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['APPROVED', 'REJECTED'])
  status!: 'APPROVED' | 'REJECTED';
}
