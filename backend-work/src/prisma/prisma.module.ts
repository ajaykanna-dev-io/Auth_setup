import { Global, Module } from '@nestjs/common';
import { DatabaseInitService } from './database-init.service.js';

@Global()
@Module({
  providers: [DatabaseInitService],
  exports: [DatabaseInitService],
})
export class PrismaModule {}
