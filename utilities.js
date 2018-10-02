const ACCESS_TOKEN = "access_token";

const CONSERVATIVE = "convervative";
const MODERATE = "moderate";
const AGGRESSIVE = "aggressive";

const EARLY_SAVERS = "earlySavers";
const MIDLIFE_SAVERS = "midLifeSavers";
const RETIREE_SAVERS = "retireeSavers";

// These are all 'allocation_id's
const EARLY_SAVER_CONSERVATIVE_FUND_ID = "1292c4ad-469a-4437-97b8-defa084e9936";
const EARLY_SAVER_MODERATE_FUND_ID = "5cb27bee-03f8-411d-8d00-8716ddcd0941";
const EARLY_SAVER_AGGRESSIVE_FUND_ID = "5aebcbf9-87e2-43f4-80c6-9def50fcc706";

const MIDLIFE_ACCUMULATOR_CONSERVATIVE_FUND_ID =
  "e051c46f-6c0a-45eb-b8f1-8ec2c83f4277";
const MIDLIFE_ACCUMULATOR_MODERATE_FUND_ID =
  "bc77092f-f917-45c6-b621-7c2ad0965496";
const MIDLIFE_ACCUMULATOR_AGGRESSIVE_FUND_ID =
  "5de8a928-caee-4b6c-8769-897e9fd4cbfa";

const TRANSITIONAL_RETIREE_CONSERVATIVE_FUND_ID =
  "8d3774ec-1647-43f6-844d-3184ab7edba8";
const TRANSITIONAL_RETIREE_MODERATE_FUND_ID =
  "6f24c771-705d-4a69-b267-aa09e1c52669";
const TRANSITIONAL_RETIREE_AGGRESSIVE_FUND_ID =
  "f967b0d3-67be-4cd1-bc47-9fb67fe37cdb";

const AGE_TOLERANCE_LEVEL_FUND_ID_MAP = {
  [EARLY_SAVERS]: {
    [CONSERVATIVE]: EARLY_SAVER_CONSERVATIVE_FUND_ID,
    [MODERATE]: EARLY_SAVER_MODERATE_FUND_ID,
    [AGGRESSIVE]: EARLY_SAVER_AGGRESSIVE_FUND_ID
  },
  [MIDLIFE_SAVERS]: {
    [CONSERVATIVE]: MIDLIFE_ACCUMULATOR_CONSERVATIVE_FUND_ID,
    [MODERATE]: MIDLIFE_ACCUMULATOR_MODERATE_FUND_ID,
    [AGGRESSIVE]: MIDLIFE_ACCUMULATOR_AGGRESSIVE_FUND_ID
  },
  [RETIREE_SAVERS]: {
    [CONSERVATIVE]: TRANSITIONAL_RETIREE_CONSERVATIVE_FUND_ID,
    [MODERATE]: TRANSITIONAL_RETIREE_MODERATE_FUND_ID,
    [AGGRESSIVE]: TRANSITIONAL_RETIREE_AGGRESSIVE_FUND_ID
  }
};

export function getRiskToleranceLevelType(totalRiskScore) {
  let toleranceType = "";

  if (totalRiskScore >= 12 && totalRiskScore <= 16) {
    toleranceType = AGGRESSIVE;
  } else if (totalRiskScore >= 7 && totalRiskScore <= 12) {
    toleranceType = MODERATE;
  } else if (totalRiskScore >= 4 && totalRiskScore <= 7) {
    toleranceType = CONSERVATIVE;
  }

  return toleranceType;
}

export function getAllocationId(ageStr, riskToleranceLevelType) {
  let ageType = "";
  const age = +ageStr;

  if (age === 5 || age === 4) {
    ageType = EARLY_SAVERS;
  } else if (age === 3) {
    ageType = MIDLIFE_SAVERS;
  } else if (age === 2) {
    ageType = RETIREE_SAVERS;
  }

  return AGE_TOLERANCE_LEVEL_FUND_ID_MAP[ageType][riskToleranceLevelType];
}

export function getAccessTokenFromCookie(cookieString) {
  return cookieString.split(`${ACCESS_TOKEN}=`).filter(Boolean)[0];
}

export function sortArrayByDesc(array, accessor) {
  return [...array].sort((a, b) => {
    const weightA = typeof accessor === "function" ? accessor(a) : a[accessor];
    const weightB = typeof accessor === "function" ? accessor(b) : b[accessor];

    if (weightA < weightB) {
      return 1;
    }

    if (weightA > weightB) {
      return -1;
    }

    return 0;
  });
}

export function roundValuesUpToTarget({ source, target, accessorKey = false }) {
  let off =
    target -
    source.reduce(
      (acc, curr) => acc + Math.round(accessorKey ? curr[accessorKey] : curr),
      0
    );

  for (const ele of source) {
    if (off > 0) {
      ele[accessorKey] += 1;
      off -= 1;
    } else if (off < 0) {
      ele[accessorKey] -= 1;
      off += 1;
    } else {
      break;
    }
  }
}

export function getUTCDate(dateString = Date.now()) {
  const date = new Date(dateString);

  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  );
}
