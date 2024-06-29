import dayjs from '#/common/config/dayjs.config';
import {
  ENABLE_RENEW_BEFORE_EXPIRY_DAYS,
  ENABLE_RENEW_AFTER_EXPIRY_DAYS,
} from '../config/franchise.config';
import { Franchise } from '../entities/franchise.entity';
import { FranchiseRenewal } from '../entities/franchise-renewal-entity';
import { FranchiseResponse } from '../dtos/franchise-response.dto';

export function transformFranchises(
  franchises: Franchise | Franchise[],
  allRenewals = false,
): FranchiseResponse | FranchiseResponse[] {
  if (Array.isArray(franchises)) {
    return franchises.map((franchise) => {
      if (!franchise.franchiseRenewals.length) {
        const expiryStatus = getExpiryStatus(franchise.expiryDate);
        return { ...franchise, ...expiryStatus };
      }

      const franchiseRenewals = sortFranchiseRenewals(
        franchise.franchiseRenewals,
        allRenewals,
      );

      const expiryStatus = getExpiryStatus(franchiseRenewals[0].expiryDate);
      return { ...franchise, ...expiryStatus, franchiseRenewals };
    });
  }

  if (!franchises.franchiseRenewals.length) {
    const expiryStatus = getExpiryStatus(franchises.expiryDate);
    return { ...franchises, ...expiryStatus };
  }

  const franchiseRenewals = sortFranchiseRenewals(
    franchises.franchiseRenewals,
    allRenewals,
  );

  const expiryStatus = getExpiryStatus(franchiseRenewals[0].expiryDate);
  return { ...franchises, ...expiryStatus, franchiseRenewals };
}

export function getExpiryStatus(expiryDate: Date | null) {
  if (!expiryDate)
    return {
      isExpired: false,
      canRenew: false,
    };

  const currentDate = dayjs();

  const isExpired = currentDate.isAfter(dayjs(expiryDate), 'd');

  const canRenew = currentDate.isBetween(
    dayjs(expiryDate).subtract(ENABLE_RENEW_BEFORE_EXPIRY_DAYS, 'd'),
    dayjs(expiryDate).add(ENABLE_RENEW_AFTER_EXPIRY_DAYS, 'd'),
    'day',
    '[]',
  );

  return { isExpired, canRenew };
}

function sortFranchiseRenewals(
  franchiseRenewals: FranchiseRenewal[],
  allRenewals: boolean,
) {
  const sortedFranchiseRenewals = franchiseRenewals.sort(
    (a, b) => b.createdAt.valueOf() - a.createdAt.valueOf(),
  );

  return allRenewals ? sortedFranchiseRenewals : [sortedFranchiseRenewals[0]];
}
