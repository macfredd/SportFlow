import { Injectable } from '@nestjs/common';

@Injectable()
export class ActivityService {
  getStatus(): string {
    return 'ActivityService running';
  }
}
