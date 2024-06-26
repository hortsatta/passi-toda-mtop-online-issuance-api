import {
  EventSubscriber,
  EntitySubscriberInterface,
  DataSource,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';

import dayjs from '#/common/config/dayjs.config';
import { Franchise } from '../entities/franchise.entity';
import { FranchiseApprovalStatus } from '../enums/franchise.enum';

const EXPIRY_YEAR = 1;

@EventSubscriber()
export class FranchiseSubscriber
  implements EntitySubscriberInterface<Franchise>
{
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Franchise;
  }

  beforeInsert(event: InsertEvent<Franchise>) {
    if (
      !event.entity.approvalStatus ||
      event.entity.approvalStatus === FranchiseApprovalStatus.PendingValidation
    ) {
      event.entity.approvalDate = null;
    } else {
      const currentDate = dayjs();
      event.entity.approvalDate = dayjs().toDate();
      // Set expiry date by 1year when status is approved
      if (event.entity.approvalStatus === FranchiseApprovalStatus.Approved) {
        event.entity.expiryDate = currentDate.add(EXPIRY_YEAR, 'y').toDate();
      }
    }
  }

  async beforeUpdate(event: UpdateEvent<Franchise>) {
    const prevUser = await event.connection
      .getRepository(Franchise)
      .findOne({ where: { id: event.entity.id } });

    // Check previous data and automatically set approval date
    // if status is not pending, else set date to null
    if (prevUser.approvalStatus !== event.entity.approvalStatus) {
      if (
        !event.entity.approvalStatus ||
        event.entity.approvalStatus ===
          FranchiseApprovalStatus.PendingValidation
      ) {
        event.entity.approvalDate = null;
      } else {
        const currentDate = dayjs();
        event.entity.approvalDate = dayjs().toDate();
        // Set expiry date by 1year when status is approved
        if (event.entity.approvalStatus === FranchiseApprovalStatus.Approved) {
          event.entity.expiryDate = currentDate.add(EXPIRY_YEAR, 'y').toDate();
        }
      }
    }
  }
}
