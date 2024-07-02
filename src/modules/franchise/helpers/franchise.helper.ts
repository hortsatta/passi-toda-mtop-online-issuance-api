import dayjs from '#/common/config/dayjs.config';
import {
  ENABLE_RENEW_BEFORE_EXPIRY_DAYS,
  ENABLE_RENEW_AFTER_EXPIRY_DAYS,
} from '../config/franchise.config';
import { FranchiseApprovalStatus } from '../enums/franchise.enum';
import { Franchise } from '../entities/franchise.entity';
import { FranchiseRenewal } from '../entities/franchise-renewal.entity';
import { FranchiseResponse } from '../dtos/franchise-response.dto';

export function transformFranchises(
  franchises: Franchise | Franchise[],
  allRenewals = false,
): FranchiseResponse | FranchiseResponse[] {
  if (Array.isArray(franchises)) {
    return franchises.map((franchise) => {
      const targetFranchise = {
        ...franchise,
        franchiseRenewals: !franchise.franchiseRenewals.length
          ? []
          : sortFranchiseRenewals(franchise.franchiseRenewals, allRenewals),
      };

      const expiryStatus = getExpiryStatus(targetFranchise);
      return { ...franchise, ...expiryStatus };
    });
  }

  const targetFranchise = {
    ...franchises,
    franchiseRenewals: !franchises.franchiseRenewals.length
      ? []
      : sortFranchiseRenewals(franchises.franchiseRenewals, allRenewals),
  };

  const expiryStatus = getExpiryStatus(targetFranchise);
  return { ...franchises, ...expiryStatus };
}

export function getExpiryStatus(franchise: Franchise) {
  const currentDate = dayjs();

  if (!franchise.franchiseRenewals.length) {
    if (!franchise.expiryDate)
      return {
        isExpired: false,
        canRenew: false,
      };

    const isExpired = currentDate.isAfter(dayjs(franchise.expiryDate), 'd');
    const canRenew = currentDate.isBetween(
      dayjs(franchise.expiryDate).subtract(
        ENABLE_RENEW_BEFORE_EXPIRY_DAYS,
        'd',
      ),
      dayjs(franchise.expiryDate).add(ENABLE_RENEW_AFTER_EXPIRY_DAYS, 'd'),
      'day',
      '[]',
    );

    return { isExpired, canRenew };
  } else {
    let isExpired = false;
    let canRenew = false;

    const target = franchise.franchiseRenewals[0];

    if (
      target.approvalStatus === FranchiseApprovalStatus.Approved ||
      target.approvalStatus === FranchiseApprovalStatus.Rejected ||
      target.approvalStatus === FranchiseApprovalStatus.Canceled
    ) {
      let expiryDate = target.expiryDate;

      if (
        target.approvalStatus === FranchiseApprovalStatus.Rejected ||
        target.approvalStatus === FranchiseApprovalStatus.Canceled
      ) {
        expiryDate =
          franchise.franchiseRenewals.length > 1
            ? franchise.franchiseRenewals[1].expiryDate
            : franchise.expiryDate;
      }

      isExpired = currentDate.isAfter(dayjs(expiryDate), 'd');
      canRenew = currentDate.isBetween(
        dayjs(expiryDate).subtract(ENABLE_RENEW_BEFORE_EXPIRY_DAYS, 'd'),
        dayjs(expiryDate).add(ENABLE_RENEW_AFTER_EXPIRY_DAYS, 'd'),
        'day',
        '[]',
      );
    }

    return { isExpired, canRenew };
  }
}

function sortFranchiseRenewals(
  franchiseRenewals: FranchiseRenewal[],
  allRenewals: boolean,
) {
  const sortedFranchiseRenewals = franchiseRenewals.sort(
    (a, b) => b.createdAt.valueOf() - a.createdAt.valueOf(),
  );

  if (allRenewals) return sortedFranchiseRenewals;

  const latest = sortedFranchiseRenewals[0];
  const lastApproved = sortedFranchiseRenewals
    .slice(1, sortedFranchiseRenewals.length)
    .find((fr) => fr.approvalStatus === FranchiseApprovalStatus.Approved);

  return lastApproved ? [latest, lastApproved] : [latest];
}
