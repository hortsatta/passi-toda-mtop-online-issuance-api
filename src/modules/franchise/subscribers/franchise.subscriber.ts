import {
  EventSubscriber,
  EntitySubscriberInterface,
  DataSource,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';

import dayjs from '#/common/config/dayjs.config';
import { EXPIRY_AFTER_APPROVAL_DAYS } from '../config/franchise.config';
import { FranchiseApprovalStatus } from '../enums/franchise.enum';
import { Franchise } from '../entities/franchise.entity';

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
      if (event.entity.approvalStatus !== FranchiseApprovalStatus.Revoked) {
        const currentDate = dayjs();
        event.entity.approvalDate = dayjs().toDate();
        // Set expiry date by 1year when status is approved
        if (event.entity.approvalStatus === FranchiseApprovalStatus.Approved) {
          event.entity.expiryDate = currentDate
            .add(EXPIRY_AFTER_APPROVAL_DAYS, 'd')
            .toDate();
        }
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
        if (event.entity.approvalStatus !== FranchiseApprovalStatus.Revoked) {
          const currentDate = dayjs();
          event.entity.approvalDate = dayjs().toDate();
          // Set expiry date by 1year when status is approved
          if (
            event.entity.approvalStatus === FranchiseApprovalStatus.Approved
          ) {
            event.entity.expiryDate = currentDate
              .add(EXPIRY_AFTER_APPROVAL_DAYS, 'd')
              .toDate();
          }
        }
      }
    }
  }
}
