import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(private readonly dataSource: DataSource) {}

  getRoot() {
    return {
      name: 'world-heritage-app',
      status: 'ok',
    };
  }

  getHealth() {
    return {
      status: 'ok',
      database: this.dataSource.isInitialized ? 'connected' : 'disconnected',
    };
  }
}
