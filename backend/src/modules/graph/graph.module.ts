import { Module } from '@nestjs/common';
import { GraphService } from './graph.service';

/**
 * Microsoft Graph Module
 * Provides Microsoft Graph API integration for Teams and Calendar access
 */
@Module({
  providers: [GraphService],
  exports: [GraphService],
})
export class GraphModule {}
