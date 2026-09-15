import 'dotenv/config';
import process from 'node:process';
import { definePrismaConfig } from '@prisma/cli-engine';
import { defineConfig as ormConfig } from '@prisma/orm-postgres/config';

const config = {
  orm: ormConfig({
    contract: './src/prisma/schema.prisma',
    db: {
      connection: process.env['DATABASE_URL']!,
    },
  }),
} satisfies Record<string, unknown>;

export default definePrismaConfig(config);