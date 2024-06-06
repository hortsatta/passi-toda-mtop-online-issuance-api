import { Injectable } from '@nestjs/common';
import dayjs from '#/common/config/dayjs.config';

@Injectable()
export class CoreService {
  getDateTimeNow(): Date {
    return dayjs().toDate();
  }
}
