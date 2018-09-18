const ACCESS_TOKEN = 'access_token';

const CONSERVATIVE = 'convervative';
const MODERATE = 'moderate';
const AGGRESSIVE = 'aggressive';

const EARLY_SAVERS = 'earlySavers';
const MIDLIFE_SAVERS = 'midLifeSavers';
const RETIREE_SAVERS = 'retireeSavers';

const EARLY_SAVER_CONSERVATIVE_FUND_ID = '8cd559f8-b512-4926-a71d-d001927aa31c';
const EARLY_SAVER_MODERATE_FUND_ID = '3cd4299b-3035-4100-82d2-9662511b5ce1';
const EARLY_SAVER_AGGRESSIVE_FUND_ID = 'd7640360-98fa-497f-9c77-808f00ca37f0';

const MIDLIFE_ACCUMULATOR_CONSERVATIVE_FUND_ID =
  '8f077f32-d0d8-4db5-ae48-528f675c06bc';
const MIDLIFE_ACCUMULATOR_MODERATE_FUND_ID =
  '3eb9698c-1e2c-4ce7-b9e7-68ee64b7c786';
const MIDLIFE_ACCUMULATOR_AGGRESSIVE_FUND_ID =
  'bd00035b-0f61-4fb0-a1e2-26f414bb72fe';

const TRANSITIONAL_RETIREE_CONSERVATIVE_FUND_ID =
  '482e00b5-443b-4f2d-8afd-9702fb04bff1';
const TRANSITIONAL_RETIREE_MODERATE_FUND_ID =
  'cd5d0e5d-81e5-4c82-94b5-14edd1fdc13d';
const TRANSITIONAL_RETIREE_AGGRESSIVE_FUND_ID =
  '30e91160-6657-4f97-ba93-aa9756bd8929';

const AGE_TOLERANCE_LEVEL_FUND_ID_MAP = {
  [EARLY_SAVERS]: {
    [CONSERVATIVE]: EARLY_SAVER_CONSERVATIVE_FUND_ID,
    [MODERATE]: EARLY_SAVER_MODERATE_FUND_ID,
    [AGGRESSIVE]: EARLY_SAVER_AGGRESSIVE_FUND_ID,
  },
  [MIDLIFE_SAVERS]: {
    [CONSERVATIVE]: MIDLIFE_ACCUMULATOR_CONSERVATIVE_FUND_ID,
    [MODERATE]: MIDLIFE_ACCUMULATOR_MODERATE_FUND_ID,
    [AGGRESSIVE]: MIDLIFE_ACCUMULATOR_AGGRESSIVE_FUND_ID,
  },
  [RETIREE_SAVERS]: {
    [CONSERVATIVE]: TRANSITIONAL_RETIREE_CONSERVATIVE_FUND_ID,
    [MODERATE]: TRANSITIONAL_RETIREE_MODERATE_FUND_ID,
    [AGGRESSIVE]: TRANSITIONAL_RETIREE_AGGRESSIVE_FUND_ID,
  },
};

export function getRiskToleranceLevelType(totalRiskScore) {
  let toleranceType = '';

  if (totalRiskScore >= 12 && totalRiskScore <= 16) {
    toleranceType = AGGRESSIVE;
  } else if (totalRiskScore >= 7 && totalRiskScore <= 12) {
    toleranceType = MODERATE;
  } else if (totalRiskScore >= 4 && totalRiskScore <= 7) {
    toleranceType = CONSERVATIVE;
  }

  return toleranceType;
}

export function getAllocationModelId(ageStr, riskToleranceLevelType) {
  let ageType = '';
  const age = +ageStr;

  if (age === 5 || age === 4) {
    ageType = EARLY_SAVERS;
  } else if (age === 3) {
    ageType = MIDLIFE_SAVERS;
  } else if (age === 2) {
    ageType = RETIREE_SAVERS;
  }

  console.log(ageType, riskToleranceLevelType);

  return AGE_TOLERANCE_LEVEL_FUND_ID_MAP[ageType][riskToleranceLevelType];
}

export function getAccessTokenFromCookie(cookieString) {
  return cookieString.split(`${ACCESS_TOKEN}=`).filter(Boolean)[0];
}
