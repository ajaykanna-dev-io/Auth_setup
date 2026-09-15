import { IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from '../enums/role.enum.js';

export class UpdateRoleDto {
  @IsNotEmpty({ message: 'Role is required' })
  @IsEnum(Role, {
    message: `Role must be one of: ${Object.values(Role).join(', ')}`,
  })
  role!: Role;
}
