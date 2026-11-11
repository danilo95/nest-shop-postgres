import { Controller, Get } from '@nestjs/common';
import { SeedService } from './seed.service.js';
import { Auth } from '../auth/auth.decorator.js';
import { ValidRoles } from '../auth/interfaces/valid-roles.interface.js';

@Controller('executeseed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Get()
  @Auth(ValidRoles.admin)
  executeSeed() {
    return this.seedService.executeSeed();
  }
}
