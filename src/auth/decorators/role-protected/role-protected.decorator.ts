import { SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ValidRoles } from '../../interfaces/valid-roles.interface.js';

export const META_ROLES = 'roles';

export const RoleProtected = (...args: ValidRoles[]) => {
  return SetMetadata(META_ROLES, args);
};
