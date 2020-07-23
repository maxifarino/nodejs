const _ = require('lodash');
const sql_helper = require('../mssql/mssql_helper');
const { writeLog } = require('../utils')

// Financials calculations processor

// -------------------------------------------------------
// Single project limit and Aggregate LImit parameters
// Cup for Single project limit = percentage of avg volume
const kAvgVolumePerc = 0.5;

// Avg project percentage per tier
const kAvgProjectPerc_t1 = 1.25;
const kAvgProjectPerc_t2 = 1.00;
const kAvgProjectPerc_t3 = 0.75;

// Aggregate limit (times WC = Working Capital)
const kAggregateLimitCoef = 5.0;

// Avg volume percentage per tier
const kAvgVolumePerc_t1 = 0.60;
const kAvgVolumePerc_t2 = 0.50;
const kAvgVolumePerc_t3 = 0.40;

// -------------------------------------------------------

// Constants to get accounts by name
// If a name is modified in the DB, the changed should be alos apply next:
const kNetIncome = 'net income';
const kOperatingIncome = 'operating income';
const kContractReceivables = 'contract receivables';
const kRetentionsReceivable = 'retentions receivable';
const kAccountsPayable = 'accounts payable';
const kRetentionsPayable = 'retentions payable';
const kCostOfGoodsSold = 'cost of goods sold';
const kRevenue = 'revenue';
const kBacklog = 'backlog';
const kCashAndCashEquivalents = 'cash and cash equivalents';
const kMarketableSecurities = 'investment in marketable securities / available-for-sale securities';
const kTotalEquityAtTheEndOfTheYear = 'total equity at the end of the year';
const kShortTermDebt = 'short term portion of long term borrowings';
const kLongTermDebt = 'long-term debt, net of current portion';
const kAllowancesOnAccountsReceivable = 'allowances on accounts receivable';
const kAccountsReceivable = 'accounts receivable';
const kSubcontractorsPayable = 'subcontractors payable';
const kDistributions = 'distributions';
const kAccountsPayableAndAccruedExpenses = 'accounts payable and accrued expenses';

// -------------------------------------------------------

// Scorecard concepts ids
// Current Ratio
const kCurrentRatioId = 1;
// Working Capital to Backlog
const kWorkingCapitalToBacklogId = 2;
// Number of Days Cash
const kNumberOfDaysCashId = 3;
// AR Turnover
const kARTurnoverId = 4;
// AP Turnover
const kAPTurnoverId = 5;
// Debt to Net Worth
const kDebtToNetWorthId = 6;
// Net Worth to Backlog
const kNetWorthToBacklogId = 7;
// Profitability
const kProfitabilityId = 8;
// Bank Line Usage
const kBankLineUsageId = 9;
// Legal
const kLegalId = 10;
// References
const kReferencesId = 11;
// Credit History
const kCreditHistoryId = 12;

// Gets the total of an account group
getTotalByGroup = function(data, accountsList, groupId) {

  var total = {};
  total.value = 0.0;
  total.adjustment = 0.0;
  total.adjustedBalance = 0.0;

  var accountsByGroup = getAccountsByGroup(data, accountsList, groupId);

  for(i = 0; i < accountsByGroup.length; ++i) {
    total.value += accountsByGroup[i].value;
    total.adjustment += accountsByGroup[i].adjustment;
  }

  total.adjustedBalance =  total.value + total.adjustment;
  return total;
}

// Gets a list of accounts by their group id
getAccountsByGroup = function(data, accountsList, groupId) {
  var accountsByGroup = [];

  for(i = 0; i < accountsList.length; ++i) {
    if(accountsList[i].groupId == groupId) {
      for(j = 0; j < data.accountsList.length; ++j) {
        if(data.accountsList[j].accountId == accountsList[i].id) {
          accountsByGroup.push(data.accountsList[j]);
        }
      }
    }
  }

  return accountsByGroup;
}

// Get company type by id
getCompanyTypeById = function(companiesTypes, companyTypeId) {
  var companyType = {};
  for(i = 0; i < companiesTypes.length; ++i) {
    if(companiesTypes[i].id == companyTypeId) {
      companyType = companiesTypes[i];
    }
  }

  return companyType;
}

//Get basic account by name (non case sensitive)
getBasicAccountByName = function(basicAccounts, accountName) {

  var basicAccount = {};

  for(i = 0; i < basicAccounts.length; ++i) {
    if(basicAccounts[i].name.toLowerCase() == accountName.toLowerCase()) {
      basicAccount = basicAccounts[i];
      basicAccount.adjustedValue = basicAccount.value + basicAccount.AdjustmentValue;
    }
  }

  return basicAccount;
}

//Get account value by name (non case sensitive)
getAccountValueByName = function(data, accountsList, accountName) {
  var accountValue = {};
  accountValue.value = 0.0;
  accountValue.adjustment = 0.0;
  accountValue.adjustedBalance = 0.0;

  for(i = 0; i < accountsList.length; ++i) {
    if(accountsList[i].name.toLowerCase() == accountName.toLowerCase()) {
      for(j = 0; j < data.accountsList.length; ++j) {
        if(data.accountsList[j].accountId == accountsList[i].id) {
          accountValue.value = data.accountsList[j].value;
          accountValue.adjustment = data.accountsList[j].adjustment;
          accountValue.adjustedBalance = accountValue.value + accountValue.adjustment;
        }
      }
    }
  }

  return accountValue;
}


getTurnOverRate = function(data, turnOverRates) {
  var turnOverRate = 0.0;

  for(i = 0; i < turnOverRates.length; ++i) {
    if(turnOverRates[i].id == data.subcontractorData.turnOverRateId) {
      turnOverRate = turnOverRates[i].value;
    }
  }

  return turnOverRate;
}


getSocrecardConceptListItemById =  function(scorecardConceptId, scorecardConcetpsList) {
  for(let i = 0; i < scorecardConcetpsList.length; i++) {
    var scorecardConcetpItem = scorecardConcetpsList[i];
    if(scorecardConcetpItem.scorecardConceptId == scorecardConceptId) {
      return scorecardConcetpItem;
    }
  }

  return null;
}

getConceptColor = function(scorecardConceptId, value, qualificationCriterias) {

  let colorRes = 3;
  for(i = 0; i < qualificationCriterias.length; i++) {
    if(scorecardConceptId == qualificationCriterias[i].scorecardConceptId) {
      let minPassed = false;
      let maxPassed = false;

      let minValue = qualificationCriterias[i].minValue;
      let maxValue = qualificationCriterias[i].maxValue;
      let minValueIncluded = qualificationCriterias[i].minValueIncluded;
      let maxValueIncluded = qualificationCriterias[i].maxValueIncluded;
      let color = qualificationCriterias[i].color;

      if(minValueIncluded == 1) {
        if(minValue <= value) minPassed = true;
      }
      else {
        if(minValue < value) minPassed = true;
      }

      if(maxValueIncluded == 1) {
        if(maxValue >= value) maxPassed = true;
      }
      else {
        if(maxValue > value) maxPassed = true;
      }

      if(minPassed == true && maxPassed == true) {
        return color;
      }
    }
  }

  return colorRes;
}

// Get color flags count
getColorFlags = function(scConcepts,  color) {
  let count = 0;

  if(scConcepts.currentRatio.color == color) count++;
  if(scConcepts.workingCapitalToBacklog.color == color) count++;
  if(scConcepts.numberDaysOfCash.color == color) count++;
  if(scConcepts.ARturnover.color == color) count++;
  if(scConcepts.APturnover.color == color) count++;
  if(scConcepts.debtNetWorth.color == color) count++;
  if(scConcepts.netWorthBacklog.color == color) count++;
  if(scConcepts.profitability.color == color) count++;

  if(scConcepts.bankLineUsage.color == color) count++;
  if(scConcepts.legal.color == color) count++;
  if(scConcepts.references.color == color) count++;
  if(scConcepts.creditHistory.color == color) count++;

  return count;
}

getTierRating = function(greenFlagsCount, redFlagsCount, tierRatingsCriterias) {
  for(i = 0; i < tierRatingsCriterias.length; i++) {
    tierRating = tierRatingsCriterias[i].tier;
    minGreenFlagsCount = tierRatingsCriterias[i].minGreenFlagsCount;
    maxRedFlagsCount = tierRatingsCriterias[i].maxRedFlagsCount;
    if(greenFlagsCount >= minGreenFlagsCount && redFlagsCount <= maxRedFlagsCount) {
      return tierRating;
    }
  }
}

getProjectOrVolumeAvg = function(values) {
  let sum = 0.0;
  let avg = 0.0;
  let count = 0;

  for(i = 0; i < values.length; i++) {
    sum += values[i].value;
    if(values[i].value > 0) {
      count++;
    }
  }

  if(count > 0) {
    avg = sum / count;
  }

  return avg;
}

calculateCurrentNet = (currentAssets, currentLiabilities, data) => {

  let workingCapitalAdjustment = getWorkingCapitalAdjustment(data);

  currentLiabilities.adjustment = workingCapitalAdjustment;
  currentLiabilities.adjustedBalance += workingCapitalAdjustment;

  workingCapital = currentAssets.adjustedBalance - currentLiabilities.adjustedBalance;

  return {
    currentAssets,
    currentLiabilities,
    workingCapital
  }
}

exports.calculateWorkingCapital = (data, accountsList) => {
  let
    currentAssets = getTotalByGroup(data, accountsList, 3),
    currentLiabilities = getTotalByGroup(data, accountsList, 7)

  let workingCapital = calculateCurrentNet(currentAssets, currentLiabilities, data).workingCapital

  return workingCapital
}

exports.calculateDiscreteAccountsScorecards = async (params) => {
  const {
    inputData,
    avgProjectsResult,
  } = params;

  const inputDiscreteAccountsList = inputData.discreteAccounts;

  const connection = await sql_helper.getConnection();

  let query = "SELECT AccountId, Color FROM DiscreteAccountsOptions WHERE ";
  for (let i = 0; i < inputDiscreteAccountsList.length ; i++) {
    if (i !== 0) query += ' OR ';

    query += `AccountId = ${inputDiscreteAccountsList[i].accountId} AND Value = '${inputDiscreteAccountsList[i].valueSelected}'`;
  }

  const { recordset: inputDiscreteAccountsListResults } = await connection.request().query(query);

  connection.close();

  let tierRating = 1;
  let redFlagsCount = 0;

  for (let discreteAccount of inputDiscreteAccountsListResults) {
    if (discreteAccount.Color === 3) redFlagsCount++;
  }

  // Special criteria: If "Current Assets exceed Current Liabilities" AND “Bank Credit Line” both red flags, make this a Tier 4
  const specialCriteriaAccounts = [1, 3];
  const filteredSpecialCriteriaAccounts = inputDiscreteAccountsListResults.filter(discreteAccount => specialCriteriaAccounts.includes(discreteAccount.AccountId));
  const areSpecialCriteriaAccountsRedFlagged = filteredSpecialCriteriaAccounts.length >= specialCriteriaAccounts.length ? filteredSpecialCriteriaAccounts.every(discreteAccount => discreteAccount.Color === 3) : false;

  if (redFlagsCount >= 3 || areSpecialCriteriaAccountsRedFlagged) {
    tierRating = 4;
  }

  // Get the average of largest projects
  const avgProjects = _.meanBy(avgProjectsResult, result => result.value);

  const aggregateProjectExposureLimit = 250000;
  const singleProjectLimitValue = avgProjects * 1.5;
  const singleProjectLimitCalculation = (singleProjectLimitValue > aggregateProjectExposureLimit) ? aggregateProjectExposureLimit : singleProjectLimitValue;
  const singleProjectLimit = tierRating === 1 ? singleProjectLimitCalculation : 0;
  const aggregateProjectExposure = tierRating === 1 ? aggregateProjectExposureLimit : 0;

  return calcRes = {
    scorecardMainParameters: {
      tieRating: tierRating,
      singleProjectLimit,
      aggregateProjectExposure,
    },
    calculatedAccounts: {
      singleProjectLimitValue: singleProjectLimit,
      aggregateProjectExposure: aggregateProjectExposure,
    },
  };
}

exports.calculateScorecards = function(data, accountsList, basicAccountsValues, DefaultAccountsValues,
                                       companiesTypes, turnOverRates, qualificationCriterias,
    tierRatingsCriterias, avgProjects, avgVolumes, projectLimitCoefficientsResult, maxAggregateProjectLimitResult) {
  var res = {};

  // Calculate working capital:
  // Calculate current assets:
  res.calc = {};
  res.calc.currentAssets = getTotalByGroup(data, accountsList, 3); // Group 3: Current assets
  res.calc.currentAssets.taxes = 0.0;

  // Calculate current liabilities:
  res.calc.currentLiabilities = getTotalByGroup(data, accountsList, 7); // Group 7: Current liabilities

  let workingCapitalAdjustment = getWorkingCapitalAdjustment(data);

  res.calc.currentLiabilities.adjustment = workingCapitalAdjustment;
  res.calc.currentLiabilities.adjustedBalance += workingCapitalAdjustment;

  res.calc.currentAssetsAfterTaxes =  res.calc.currentAssets.adjustedBalance;
  res.calc.currentLiabilitiesAfterTaxes = res.calc.currentLiabilities.adjustedBalance;

  // Working Capital
  res.calc.workingCapital = res.calc.currentAssets.adjustedBalance - res.calc.currentLiabilities.adjustedBalance;

  // Total liabilities
  // Non current liabilities
  res.calc.nonCurrentLiabilities = getTotalByGroup(data, accountsList, 8);  // Group 8: Non current liabilities

  res.calc.totalLiabilities = {};
  res.calc.totalLiabilities.value = res.calc.currentLiabilities.value + res.calc.nonCurrentLiabilities.value;
  res.calc.totalLiabilities.adjustment = res.calc.currentLiabilities.adjustment + res.calc.nonCurrentLiabilities.adjustment;
  res.calc.totalLiabilities.adjustedBalance = res.calc.currentLiabilities.adjustedBalance + res.calc.nonCurrentLiabilities.adjustedBalance;

  // Turn over rate
  res.calc.turnOverRate = getTurnOverRate(data, turnOverRates);

  // Total stakeholders equity
  res.calc.totalStakeholdersEquity = getTotalByGroup(data, accountsList, 9);  // Group 9: Stakeholders equity

  // Debt net worth
  if(res.calc.totalStakeholdersEquity.adjustedBalance != 0)
    res.calc.debtNetWorth = res.calc.totalLiabilities.adjustedBalance / res.calc.totalStakeholdersEquity.adjustedBalance;
  else
    res.calc.debtNetWorth = 0.0;

  // Calculated basic accounts
  res.basicaccounts = basicAccountsValues;
  res.calcBasicAccounts = {};

  res.calcBasicAccounts.totalAccountsReceivable = getAccountValueByName(data, accountsList, kContractReceivables).value +
                                                getAccountValueByName(data, accountsList, kRetentionsReceivable).value +
                                                getAccountValueByName(data, accountsList,kAccountsReceivable).value +
                                                getAccountValueByName(data, accountsList, kAllowancesOnAccountsReceivable).value;

  res.calcBasicAccounts.totalAP = getAccountValueByName(data, accountsList, kAccountsPayable).value +
                                      getAccountValueByName(data, accountsList, kRetentionsPayable).value +
                                      getAccountValueByName(data, accountsList, kAccountsPayableAndAccruedExpenses).value +
                                      getAccountValueByName(data, accountsList, kSubcontractorsPayable).value;

  res.calcBasicAccounts.costOfBacklog = getBasicAccountByName(basicAccountsValues, kCostOfGoodsSold).value /
                                            getBasicAccountByName(basicAccountsValues, kRevenue).value *
                                            getBasicAccountByName(basicAccountsValues, kBacklog).value;


  // Calculate Scorecard concepts
  res.scorecardConcepts = {};
  res.scorecardConcepts.currentRatio = {};
  res.scorecardConcepts.workingCapitalToBacklog = {};
  res.scorecardConcepts.numberDaysOfCash = {};
  res.scorecardConcepts.ARturnover = {};
  res.scorecardConcepts.APturnover = {};
  res.scorecardConcepts.debtNetWorth = {};
  res.scorecardConcepts.netWorthBacklog = {};
  res.scorecardConcepts.profitability = {};

  res.scorecardConcepts.bankLineUsage = {};
  res.scorecardConcepts.legal = {};
  res.scorecardConcepts.references = {};
  res.scorecardConcepts.creditHistory = {};

  const operatingIncome = getBasicAccountByName(basicAccountsValues, kOperatingIncome).value;
  const netWorth = getBasicAccountByName(DefaultAccountsValues, kTotalEquityAtTheEndOfTheYear).value;
  const debt = getBasicAccountByName(basicAccountsValues, kShortTermDebt).value + getBasicAccountByName(basicAccountsValues, kLongTermDebt).value;

  if(res.calc.currentLiabilitiesAfterTaxes >= 0.01) {
    res.scorecardConcepts.currentRatio.value = res.calc.currentAssetsAfterTaxes / res.calc.currentLiabilitiesAfterTaxes;
    res.scorecardConcepts.currentRatio.numericValue = res.scorecardConcepts.currentRatio.value;
  }
  else{
    res.scorecardConcepts.currentRatio.value = 0.0;
    res.scorecardConcepts.currentRatio.numericValue = 0.0;
  }

  if(res.calcBasicAccounts.costOfBacklog >= 0.01) {
    res.scorecardConcepts.workingCapitalToBacklog.value = res.calc.workingCapital / res.calcBasicAccounts.costOfBacklog * 100.0;
    res.scorecardConcepts.workingCapitalToBacklog.numericValue = res.scorecardConcepts.workingCapitalToBacklog.value;
  }
  else {
    res.scorecardConcepts.workingCapitalToBacklog.value = 0.0;
    res.scorecardConcepts.workingCapitalToBacklog.numericValue = 0.0;
  }


  if(getBasicAccountByName(basicAccountsValues, kRevenue).value != 0.0) {
    res.scorecardConcepts.numberDaysOfCash.value =(getAccountValueByName(data, accountsList, kCashAndCashEquivalents).adjustedBalance +
                                             getAccountValueByName(data, accountsList, kMarketableSecurities).adjustedBalance ) /
                                             getBasicAccountByName(basicAccountsValues, kRevenue).value *
                                             res.calc.turnOverRate;

    res.scorecardConcepts.numberDaysOfCash.numericValue = res.scorecardConcepts.numberDaysOfCash.value;
  }
  else{
    res.scorecardConcepts.numberDaysOfCash.value = 0.0;
    res.scorecardConcepts.numberDaysOfCash.numericValue = 0.0;
  }

  if(getBasicAccountByName(basicAccountsValues, kRevenue).value != 0.0) {
    res.scorecardConcepts.ARturnover.value = res.calcBasicAccounts.totalAccountsReceivable / getBasicAccountByName(basicAccountsValues, kRevenue).value *
                                       res.calc.turnOverRate;
    res.scorecardConcepts.ARturnover.numericValue = res.scorecardConcepts.ARturnover.value;
  }
  else {
    res.scorecardConcepts.ARturnover.value = 0.0;
    res.scorecardConcepts.ARturnover.numericValue = 0.0;
  }

  if(getBasicAccountByName(basicAccountsValues, kCostOfGoodsSold).value != 0.0) {
    res.scorecardConcepts.APturnover.value = res.calcBasicAccounts.totalAP / getBasicAccountByName(basicAccountsValues, kCostOfGoodsSold).value *
                                       res.calc.turnOverRate;
    res.scorecardConcepts.APturnover.numericValue = res.scorecardConcepts.APturnover.value;
  }
  else{
    res.scorecardConcepts.APturnover.value = 0.0;
    res.scorecardConcepts.APturnover.numericValue = 0.0;
  }

  res.scorecardConcepts.debtNetWorth.value = res.calc.debtNetWorth;
  res.scorecardConcepts.debtNetWorth.numericValue = res.calc.debtNetWorth;

  if(res.calcBasicAccounts.costOfBacklog >= 0.01) {
    res.scorecardConcepts.netWorthBacklog.value = res.calc.totalStakeholdersEquity.adjustedBalance / res.calcBasicAccounts.costOfBacklog * 100.00;
    res.scorecardConcepts.netWorthBacklog.numericValue = res.scorecardConcepts.netWorthBacklog.value;
  }
  else {
    res.scorecardConcepts.netWorthBacklog.value = 0.0;
    res.scorecardConcepts.netWorthBacklog.numericValue = 0.0;
  }

  // The RES properties below are to log changes in this file onto the FE console.log accessed by right-click inspect.

  // console.log('OPERATING INCOME   '.repeat(10))
  // console.log('operatingIncome = ', operatingIncome)
  // writeLog('operatingIncome = ', operatingIncome)

  // res.aaa = {}

  // res.aaa.basicAccountsValues = basicAccountsValues ? basicAccountsValues : 'no basicAccountsValues!'
  // res.aaa.kTotalEquityAtTheEndOfTheYear = kTotalEquityAtTheEndOfTheYear

  // res.aaa.operatingIncome = operatingIncome
  // res.aaa.netWorth = netWorth ? netWorth : 'There is no netWorth!'
  // res.aaa.netWorthXfivePercent = netWorth * 0.05
  // res.aaa.isPositive = operatingIncome >= 0
  // res.aaa.isPlainNegative = (operatingIncome < 0 && Math.abs(operatingIncome) < (netWorth * 0.05))
  // res.aaa.isNegativeGreaterThan5percentOfNetWorth = operatingIncome < 0 && Math.abs(operatingIncome) >= (netWorth * 0.05)
  // res.aaa.colorShouldBe0 = operatingIncome >= 0 ? 'green' : 'NOT green'
  // res.aaa.colorShouldBe1 = (operatingIncome < 0 && Math.abs(operatingIncome) < (netWorth * 0.05)) ? 'yellow' : 'NOT yellow'
  // res.aaa.colorShouldBe2 = (operatingIncome < 0 && Math.abs(operatingIncome) >= (netWorth * 0.05)) ? 'red' : 'NOT red'

  if (operatingIncome >= 0) {
    res.scorecardConcepts.profitability.value = 'Positive';
    res.scorecardConcepts.profitability.numericValue = 1.0;
  } else if (operatingIncome < 0 && Math.abs(operatingIncome) < (netWorth * 0.05)) {
    res.scorecardConcepts.profitability.value = 'Negative';
    res.scorecardConcepts.profitability.numericValue = 2.0;
  } else if (operatingIncome < 0 && Math.abs(operatingIncome) >= (netWorth * 0.05)) {
    res.scorecardConcepts.profitability.value = 'Negative greater than 5% of Net Worth';
    res.scorecardConcepts.profitability.numericValue = 3.0;
  } else {
    res.scorecardConcepts.profitability.value = 'Negative greater than 5% of Net Worth';
    res.scorecardConcepts.profitability.numericValue = 3.0;
  }

  if (operatingIncome < 0 && netWorth < 0) {
    res.scorecardConcepts.profitability.value = 'Negative greater than 5% of Net Worth';
    res.scorecardConcepts.profitability.numericValue = 3.0;
  }

  // Get colors
  res.scorecardConcepts.currentRatio.color = getConceptColor(kCurrentRatioId, res.scorecardConcepts.currentRatio.numericValue, qualificationCriterias);
  res.scorecardConcepts.workingCapitalToBacklog.color = getConceptColor(kWorkingCapitalToBacklogId, res.scorecardConcepts.workingCapitalToBacklog.numericValue, qualificationCriterias);
  res.scorecardConcepts.numberDaysOfCash.color = getConceptColor(kNumberOfDaysCashId, res.scorecardConcepts.numberDaysOfCash.numericValue, qualificationCriterias);
  res.scorecardConcepts.ARturnover.color = getConceptColor(kARTurnoverId, res.scorecardConcepts.ARturnover.numericValue, qualificationCriterias);
  res.scorecardConcepts.APturnover.color = getConceptColor(kAPTurnoverId, res.scorecardConcepts.APturnover.numericValue, qualificationCriterias);
  res.scorecardConcepts.debtNetWorth.color = getConceptColor(kDebtToNetWorthId, res.scorecardConcepts.debtNetWorth.numericValue, qualificationCriterias);
  res.scorecardConcepts.netWorthBacklog.color = getConceptColor(kNetWorthToBacklogId, res.scorecardConcepts.netWorthBacklog.numericValue, qualificationCriterias);
  res.scorecardConcepts.profitability.color = getConceptColor(kProfitabilityId, res.scorecardConcepts.profitability.numericValue, qualificationCriterias);


  let scorecardConcetpsList = data.scorecardConcetpsList;
  res.scorecardConcepts.bankLineUsage = getSocrecardConceptListItemById(kBankLineUsageId, scorecardConcetpsList);
  res.scorecardConcepts.legal = getSocrecardConceptListItemById(kLegalId, scorecardConcetpsList);
  res.scorecardConcepts.references = getSocrecardConceptListItemById(kReferencesId, scorecardConcetpsList);
  res.scorecardConcepts.creditHistory = getSocrecardConceptListItemById(kCreditHistoryId, scorecardConcetpsList);

  if(res.scorecardConcepts.bankLineUsage == null) res.scorecardConcepts.bankLineUsage = {};
  if(res.scorecardConcepts.legal == null) res.scorecardConcepts.legal = {};
  if(res.scorecardConcepts.references == null) res.scorecardConcepts.references = {};
  if(res.scorecardConcepts.creditHistory == null) res.scorecardConcepts.creditHistory = {};

  //debtToNetWorth Color rules
  if (debt < 0) {
    res.scorecardConcepts.debtNetWorth.color = 1;
  }
  if (netWorth < 0) {
    res.scorecardConcepts.debtNetWorth.color = 3;
  }

  // Add concepts Ids
  res.scorecardConcepts.currentRatio.id = kCurrentRatioId;
  res.scorecardConcepts.workingCapitalToBacklog.id = kWorkingCapitalToBacklogId;
  res.scorecardConcepts.numberDaysOfCash.id = kNumberOfDaysCashId;
  res.scorecardConcepts.ARturnover.id = kARTurnoverId;
  res.scorecardConcepts.APturnover.id = kAPTurnoverId;
  res.scorecardConcepts.debtNetWorth.id = kDebtToNetWorthId;
  res.scorecardConcepts.netWorthBacklog.id = kNetWorthToBacklogId;
  res.scorecardConcepts.profitability.id = kProfitabilityId;

  res.scorecardConcepts.bankLineUsage.id = kBankLineUsageId;
  res.scorecardConcepts.legal.id = kLegalId;
  res.scorecardConcepts.references.id = kReferencesId;
  res.scorecardConcepts.creditHistory.id = kCreditHistoryId;

  // Get Tie Rating
  let greenFlagsCount = getColorFlags(res.scorecardConcepts, 1); // 1 = Green
  let redFlagsCount = getColorFlags(res.scorecardConcepts, 3); // 3 = Red

  res.scorecardMainParameters = {};
  res.scorecardMainParameters.tieRating = getTierRating(greenFlagsCount, redFlagsCount, tierRatingsCriterias);
  res.scorecardMainParameters.singleProjectLimit = 0.0;
  res.scorecardMainParameters.aggregateProjectExposure = 0.0;
  res.scorecardMainParameters.adjustedWorkingCapital = res.calc.workingCapital;

  // Calculate singleProjectLimit and aggregateProjectExposure
  // Get avg of projects average and volumes

  let tier = res.scorecardMainParameters.tieRating;
  let projectAvg = getProjectOrVolumeAvg(avgProjects);
  let volumeAvg = getProjectOrVolumeAvg(avgVolumes);

  let coefTier = tier;
  if(tier)
    if(tier == 4) coefTier = 3;

  const coefficients = _.find(projectLimitCoefficientsResult, { tierRating: coefTier });
  const maxAggregateProjectLimit = _.get(maxAggregateProjectLimitResult, '[0].maxAggregateProjectLimit');

  // Aggregate limit
  let aggregateValue = res.calc.workingCapital * coefficients.aggregateProjectLimitWorkingCapitalMultiplier ; // this last = 4.00 when Tier Rating = 3 or 4
  let aggregateProjectExposure = volumeAvg * coefficients.aggregateProjectAverageAnnualRevenue;

  if(aggregateProjectExposure > aggregateValue)
    aggregateProjectExposure = aggregateValue;

  if (aggregateProjectExposure > maxAggregateProjectLimit)
    aggregateProjectExposure = maxAggregateProjectLimit;

  // Single project limit
  let singleProjectLimitValue = projectAvg * coefficients.singleProjectLimitPercentage;
  let singleProjectLimitCup = volumeAvg * coefficients.singleProjectPercentageAverageAnnualRevenue;

  if (singleProjectLimitValue > singleProjectLimitCup)
      singleProjectLimitValue = singleProjectLimitCup;

  // The following three console logs ('000', '111', '222' etc.) are an attempt to check whether a tier rating of '4' will set single and aggregate project limits to '0'.

  // console.log('0000000000000000000000000000 tieRating in processors/finances 0000000000000000000000000000')
  // console.log(`\navgVolumes = ${JSON.stringify(avgVolumes)}, \navgProjects = ${JSON.stringify(avgProjects)}, \nvolumeAvg = ${volumeAvg},\ncoefficients.aggregateProjectAverageAnnualRevenue = ${coefficients.aggregateProjectAverageAnnualRevenue}, \nprojectAvg = ${projectAvg}, \nsingleProjectLimitValue = ${singleProjectLimitValue}, \naggregateProjectExposure = ${aggregateProjectExposure}`)

  // New custom calculations
  // This is only for Hiring Client ID = 1120 // Big D
  // TODO: Need to move somehow this logic to DB

  if(data.subcontractorData.hiringClientId == 1120) {
    if(tier == 1 && projectAvg > 10000000) {
     singleProjectLimitValue =  projectAvg;
    }

    if(tier == 1 && projectAvg <= 10000000) {
     singleProjectLimitValue =  1.25 * projectAvg;
    }

    if(tier == 2) {
     singleProjectLimitValue =  projectAvg;
    }

    if(tier == 3) {
     singleProjectLimitValue =  0.75 * projectAvg;
    }

    if(tier == 4) {
     singleProjectLimitValue =  0;
    }

    if(singleProjectLimitValue > 25000000 && projectAvg >= 25000000) {
      singleProjectLimitValue = 25000000;
    }

    if(singleProjectLimitValue > 25000000 && projectAvg < 25000000) {
      singleProjectLimitValue = projectAvg;
    }

    if (aggregateProjectExposure > singleProjectLimitValue * 5)
        aggregateProjectExposure = singleProjectLimitValue * 5;
  }

  if (singleProjectLimitValue > aggregateProjectExposure)
      singleProjectLimitValue = aggregateProjectExposure;

  // console.log('1111111111111111111111111111 tieRating in processors/finances 1111111111111111111111111111')
  // console.log(`\nres.scorecardMainParameters.tieRating = ${res.scorecardMainParameters.tieRating}, \nres.scorecardMainParameters.singleProjectLimit = ${res.scorecardMainParameters.singleProjectLimit}, \nres.scorecardMainParameters.aggregateProjectExposure = ${res.scorecardMainParameters.aggregateProjectExposure}`)

  //If Working Capital (adjusted) is < 0 then Tier Rating is 4

  if(res.calc.workingCapital < 0) {
    res.scorecardMainParameters.tieRating = 4;
  }

  if(res.scorecardMainParameters.tieRating == 4) {
   singleProjectLimitValue =  0;
   aggregateProjectExposure = 0;
  }

  res.scorecardMainParameters.singleProjectLimit  = singleProjectLimitValue;
  res.scorecardMainParameters.aggregateProjectExposure  = aggregateProjectExposure;

  // console.log('2222222222222222222222222222 tieRating in processors/finances 2222222222222222222222222222')
  // console.log(`\nres.scorecardMainParameters.tieRating = ${res.scorecardMainParameters.tieRating}, \nres.scorecardMainParameters.singleProjectLimit = ${res.scorecardMainParameters.singleProjectLimit}, \nres.scorecardMainParameters.aggregateProjectExposure = ${res.scorecardMainParameters.aggregateProjectExposure}`)

  res.calculatedAccounts = {};
  res.calculatedAccounts.singleProjectLimitValue = singleProjectLimitValue;
  res.calculatedAccounts.aggregateProjectExposure = aggregateProjectExposure;
  res.calculatedAccounts.totalAccountsReceivable = res.calcBasicAccounts.totalAccountsReceivable;
  res.calculatedAccounts.totalAccountsPayable = res.calcBasicAccounts.totalAP;
  if(res.calcBasicAccounts.costOfBacklog == null) res.calcBasicAccounts.costOfBacklog = 0;
  res.calculatedAccounts.costOfBacklog = res.calcBasicAccounts.costOfBacklog;
  res.calculatedAccounts.totalLiabilities = res.calc.totalLiabilities.adjustedBalance;
  res.calculatedAccounts.adjustedWorkingCapital = res.calc.workingCapital;

  res.ratios = {};
  res.ratios.currentRatio = res.scorecardConcepts.currentRatio.value;
  res.ratios.workCapitalToBacklog = res.scorecardConcepts.workingCapitalToBacklog.value;
  res.ratios.numberOfDaysCash = res.scorecardConcepts.numberDaysOfCash.value;
  res.ratios.ARTurnover = res.scorecardConcepts.ARturnover.value;
  res.ratios.APTurnover = res.scorecardConcepts.APturnover.value;
  res.ratios.debtToNetWorth = res.scorecardConcepts.debtNetWorth.value;
  res.ratios.netWorthToBacklog = res.scorecardConcepts.netWorthBacklog.value;
  res.ratios.profitability = res.scorecardConcepts.profitability.value;
  res.ratios.tierRating = res.scorecardMainParameters.tieRating;

  return res;
}


getWorkingCapitalAdjustment = function(data) {
// IF Corp Type = “S-Corp / LLC / LLP”
  let workingCapitalAdjustment = 0;
  let distributions = getBasicAccountByName(data.basicAccounts, kDistributions).adjustedValue;
  let netIncome = getBasicAccountByName(data.basicAccounts, kNetIncome).adjustedValue;
  let totalRevenue = getBasicAccountByName(data.basicAccounts, kRevenue).value;

  if(data.subcontractorData.companyTypeId == 2) {
    // IF Net Income < 0
    if(netIncome < 0) {
      workingCapitalAdjustment = 0;
    }
    else {
      // IF Total Revenue >= $10,000,000
      if(totalRevenue >= 10000000) {
        // IF Distribution >= .25 * Net Income
        if(distributions >= 0.25 * netIncome) {
          workingCapitalAdjustment = 0;
        }
        else {
          workingCapitalAdjustment = (0.25 * netIncome) - distributions;
        }
      }
      else { //ELSE /* Total Revenue < $10,000,000 */
        // IF Distribution >= .125 * Net Income
        if(distributions >= 0.125 * netIncome) {
          workingCapitalAdjustment = 0;
        }
        else {
          workingCapitalAdjustment = (0.125 * netIncome) - distributions;
        }
      }
    }
  }

  return workingCapitalAdjustment;
}