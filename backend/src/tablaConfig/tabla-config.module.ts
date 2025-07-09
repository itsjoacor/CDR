import { Module } from '@nestjs/common';
import { TablaConfigController } from './tabla-config.controller';
import { TablaConfigService } from './tabla-config.service';
import { TablaConfigRepository } from './tabla-config.repository';

@Module({
    controllers: [TablaConfigController],
    providers: [TablaConfigService, TablaConfigRepository],
})
export class TablaConfigModule { }