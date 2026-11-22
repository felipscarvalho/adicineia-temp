import { Module } from '@nestjs/common';
import { ConfiguracaoModule } from './config/configuracao.module';
import { DatabaseModule } from './database/database.module';
import { SaudeController } from './saude/saude.controller';

@Module({
  imports: [ConfiguracaoModule, DatabaseModule],
  controllers: [SaudeController],
})
export class AppModule {}
