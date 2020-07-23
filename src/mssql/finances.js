const _ = require('lodash');
const moment = require('moment');
// Internal dependencies
// HELPERS
const sql_helper = require('./mssql_helper');
const error_helper = require('../helpers/error_helper')

// PROVIDERS
const financials_query_provider = require('../providers/financials_query_provider');
const subcontractors_query_provider = require('../providers/subcontractors_query_provider')

// FACADES
const logger = require('./log');

const _getDateOfRenewal = function (turnOverMonths, financialStatementTypeId, dateOfFinancialStatement, dateOfFinancialStatementPrepared) {
  const cpaIdsPreparedStatements = [1, 2, 3];
  const internallyPreparedStatements = [4, 5, 6];
  const isCpaPreparedStatement = _.includes(cpaIdsPreparedStatements, financialStatementTypeId);
  const isInternallyPreparedStatements = _.includes(internallyPreparedStatements, financialStatementTypeId);
  const momentFinancialStatement = moment(dateOfFinancialStatement);
  const momentFinancialStatementPrepared = moment(dateOfFinancialStatementPrepared);

  // isLastDayOfYear function
  const isLastDayOfYear = (date) => {
    let isLastDayOfYear = false;

    if (date) {
      const momentDate = moment(date);
      const lastDayOfYear = moment([momentDate.year(), '11', '31']); //11 represents December in moment()

      isLastDayOfYear = momentDate.isSame(lastDayOfYear, 'day'); //check just day, month, and year
    }

    return isLastDayOfYear
  }

  // isDateAfterLastDayOfMay function
  const isDateAfterLastDayOfMay = (date) => {
    const momentDate = moment(date);
    const lastDayOfMay = moment([momentDate.year(), '04', '31']); //04 represents May in moment()

    return momentDate.isAfter(lastDayOfMay);
  }

  //Logic
  let renewalDate;
  if (turnOverMonths === 12 && isCpaPreparedStatement && isLastDayOfYear(dateOfFinancialStatement)) {
    renewalDate = momentFinancialStatementPrepared.add(12, 'months');

    if (isDateAfterLastDayOfMay(renewalDate)) {
      renewalDate.month('04').date('01'); //04 represents May in moment()
    }
  } else if (turnOverMonths === 12 && internallyPreparedStatements && isLastDayOfYear(dateOfFinancialStatement)) {
    renewalDate = momentFinancialStatement.add(14, 'months');

    if (isDateAfterLastDayOfMay(renewalDate)) {
      renewalDate.month('04').date('01'); //04 represents May in moment()
    }
  } else if (turnOverMonths === 12 && isCpaPreparedStatement && !isLastDayOfYear(dateOfFinancialStatement)) {
    renewalDate = momentFinancialStatementPrepared.add(12, 'months');
  } else if (turnOverMonths === 12 && internallyPreparedStatements && !isLastDayOfYear(dateOfFinancialStatement)) {
    renewalDate = momentFinancialStatement.add(12, 'months');
  } else if (turnOverMonths === 9 && isCpaPreparedStatement) {
    renewalDate = momentFinancialStatement.add(7, 'months');
  } else if (turnOverMonths === 9 && internallyPreparedStatements) {
    renewalDate = momentFinancialStatement.add(4, 'months');
  } else if (turnOverMonths === 6 && isCpaPreparedStatement) {
    renewalDate = momentFinancialStatement.add(8, 'months');
  } else if (turnOverMonths === 6 && internallyPreparedStatements) {
    renewalDate = momentFinancialStatement.add(7, 'months');
  }

  return renewalDate;
}

const formatInputDiscreteAccounts = (discreteAccounts) => {
  return discreteAccounts.map(el => ({
    discreteValueId: el.discreteValueId,
    id: el.accountId,
    name: el.name,
    valueSeleted: el.valueSelected,
    options: el.options,
    note: el.note,
  }));
};

exports.getAccountValues = async function (params, callback) {
  try {
    const connection = await sql_helper.getConnection();

    const query = financials_query_provider.generateAccountValuesQuery(params);
    const result = await connection.request().query(query);
    connection.close();

    if (result.recordset.length > 0) {
      callback(null, result.recordset);
    } else {
      console.log("No account value found");
      callback(null, null);
    }
  }
  catch (err) {
    callback(err, null);
  }
}

exports.saveAccountValue = async function (params, callback) {
  let queryParams = params.accountValue;
  let query = financials_query_provider.generateAccountValueInsertQuery(queryParams);

  query = sql_helper.getLastIdentityQuery(query, 'AccountValues');

  sql_helper.createTransaction(query, function (err, result, accountValueId) {
    if (err) {
      return callback(err);
    }
    callback(null, result, accountValueId);

    const logParams = {
      eventDescription: params.eventDescription,
      UserId: params.userId,
      Payload: accountValueId
    }

    logger.addEntry(logParams, function (err, result) {
      if (err) {
        console.log("There was an error creating log for: ");
        console.log(logParams);
        console.log(err);
      } else {
        console.log("Log succesfully created");
      }
      return;
    });
  });
}

exports.createAccount = async function (params, callback) {
  let queryParams = params.account;
  let query = financials_query_provider.generateAccountInsertQuery(queryParams);

  query = sql_helper.getLastIdentityQuery(query, 'Accounts');

  sql_helper.createTransaction(query, function (err, result, accountId) {
    if (err) {
      return callback(err);
    }
    callback(null, result, accountId);

    const logParams = {
      eventDescription: params.eventDescription,
      UserId: params.userId,
      Payload: accountId
    }

    logger.addEntry(logParams, function (err, result) {
      if (err) {
        console.log("There was an error creating log for: ");
        console.log(logParams);
        console.log(err);
      } else {
        console.log("Log succesfully created");
      }
      return;
    });
  });
}

exports.getAccounts = async function (params, callback) {
  try {
    const connection = await sql_helper.getConnection();

    const query = financials_query_provider.generateAccountsQuery(params);
    const result = await connection.request().query(query);
    connection.close();

    if (result.recordset.length > 0) {
      callback(null, result.recordset);
    } else {
      console.log("No account found");
      callback(null, null);
    }
  }
  catch (err) {
    callback(err, null);
  }
}

exports.updateAccount = async function (params, callback) {
  let queryParams = params.account;
  let query = financials_query_provider.generateAccountUpdateQuery(queryParams);

  sql_helper.createTransaction(query, function (err, result) {
    if (err) {
      return callback(err);
    }
    callback(null, result);

    const logParams = {
      eventDescription: params.eventDescription,
      UserId: params.userId,
      Payload: params.account.accountId
    }

    logger.addEntry(logParams, function (err, result) {
      if (err) {
        console.log("There was an error creating log for: ");
        console.log(logParams);
        console.log(err);
      } else {
        console.log("Log succesfully created");
      }
      return;
    });
  });
}

exports.updateAccountValue = async function (params, callback) {
  let queryParams = {};
  queryParams.savedFormId = params.savedFormId;
  queryParams.accountValues = params.accountValues;
  let query = financials_query_provider.generateAccountValuesUpdateQuery(queryParams);

  sql_helper.createTransaction(query, function (err, result) {
    if (err) {
      return callback(err);
    }
    callback(null, result);

    const logParams = {
      eventDescription: params.eventDescription,
      UserId: params.userId,
      Payload: params.savedFormId
    }

    logger.addEntry(logParams, function (err, result) {
      if (err) {
        console.log("There was an error creating log for: ");
        console.log(logParams);
        console.log(err);
      } else {
        console.log("Log succesfully created");
      }
      return;
    });
  });
}

exports.getScorecards = async function (hcId, scId, sfId, callback) {
  try {
    const connection = await sql_helper.getConnection();
    const data = {};

    let savedFormId = ''

    // console.log('sfId = ', sfId)
    // console.log('hcId = ', hcId)
    // console.log('scId = ', scId)

    if (typeof sfId != 'undefined' && Number(sfId) > 0) {
      savedFormId = sfId
      // console.log('just savedFormId '.repeat(50))
      // console.log('savedFormId = ', savedFormId)
    } else if (hcId && scId) {
      // console.log('savedFormId '.repeat(50))
      // console.log('savedFormId = ', savedFormId)

      const mostRecentSavedFormIdQuery = financials_query_provider.generateMostRecentSavedFormIdQuery(hcId, scId);
      console.log('mostRecentSavedFormIdQuery', mostRecentSavedFormIdQuery);
      const savedFormIdResult = await connection.request().query(mostRecentSavedFormIdQuery);
      console.log('savedFormIdResult = ', savedFormIdResult)
      savedFormId = savedFormIdResult
        && savedFormIdResult.recordset
        && savedFormIdResult.recordset[0]
        && savedFormIdResult.recordset[0].Id
        ? savedFormIdResult.recordset[0].Id
        : ''
      // console.log('savedFormId = ', savedFormId)

    }

    if (typeof savedFormId != 'undefined' && Number(savedFormId) > 0) {

      let scDataQuery = financials_query_provider.generateScorecardQuery(savedFormId);
      let scDataResult = await connection.request().query(scDataQuery);

      let scSubcontractorDataQuery = financials_query_provider.generateScorecardSCDataQuery(savedFormId);
      let scSubcontractorDataResult = await connection.request().query(scSubcontractorDataQuery);

      let scSourcesQuery = financials_query_provider.generateScorecardSourcesQuery();
      let scSourcesResult = await connection.request().query(scSourcesQuery);

      let scCompaniesTypesQuery = financials_query_provider.generateGetCompaniesTypesQuery();
      let scCompaniesTypesResult = await connection.request().query(scCompaniesTypesQuery);

      let scTurnOverRatesQuery = financials_query_provider.generateGetTurnOverRatesQuery();
      let scTurnOverRatesResult = await connection.request().query(scTurnOverRatesQuery);

      let scGetBasicAccountsQuery = financials_query_provider.generateGetBasicAccountsBySubmissionIdQuery(savedFormId, 2);
      let scGetBasicAccountsResult = await connection.request().query(scGetBasicAccountsQuery);

      // If no basic accounts then generate them in 0 and run the query again
      if (scGetBasicAccountsResult.recordset.length == 0) {
        let generateBasicAccountsQuery = financials_query_provider.generateGetBasicAccounts(savedFormId, 2);
        // console.log(generateBasicAccountsQuery);
        await sql_helper.createTransaction(generateBasicAccountsQuery, async function (err, result1, result2, result3) {
          if (err) {
            return callback(err);
          }

          // Re execute basic accounts query
          scGetBasicAccountsQuery = financials_query_provider.generateGetBasicAccountsBySubmissionIdQuery(savedFormId, 2);
          scGetBasicAccountsResult = await connection.request().query(scGetBasicAccountsQuery);
        });
      }

      let scGetAvgProjectAccountsQuery = financials_query_provider.generateGetBasicAccountsBySubmissionIdQuery(savedFormId, 3);
      let scGetAvgProjectAccountsResult = await connection.request().query(scGetAvgProjectAccountsQuery);

      // If no AVG project account then generate them in 0 and run the query again
      if (scGetAvgProjectAccountsResult.recordset.length == 0) {
        let generateAvgPrjAccountsQuery = financials_query_provider.generateGetBasicAccounts(savedFormId, 3);
        await sql_helper.createTransaction(generateAvgPrjAccountsQuery, async function (err, result1, result2, result3) {
          if (err) {
            return callback(err);
          }

          // Re execute avg projects accounts query
          scGetAvgProjectAccountsQuery = financials_query_provider.generateGetBasicAccountsBySubmissionIdQuery(savedFormId, 3);
          scGetAvgProjectAccountsResult = await connection.request().query(scGetAvgProjectAccountsQuery);
        });
      }

      let scGetAvgVolumeAccountsQuery = financials_query_provider.generateGetBasicAccountsBySubmissionIdQuery(savedFormId, 4);
      let scGetAvgVolumeAccountsResult = await connection.request().query(scGetAvgVolumeAccountsQuery);

      // If no AVG vol account then generate them in 0 and run the query again
      if (scGetAvgVolumeAccountsResult.recordset.length == 0) {
        let generateAvgVolAccountsQuery = financials_query_provider.generateGetBasicAccounts(savedFormId, 4);
        await sql_helper.createTransaction(generateAvgVolAccountsQuery, async function (err, result1, result2, result3) {
          if (err) {
            return callback(err);
          }

          // Re execute avg volume accounts query
          scGetAvgVolumeAccountsQuery = financials_query_provider.generateGetBasicAccountsBySubmissionIdQuery(savedFormId, 4);
          scGetAvgVolumeAccountsResult = await connection.request().query(scGetAvgVolumeAccountsQuery);
        });
      }

      let scGetManualScorecardsConceptValuesQuery = financials_query_provider.generateGetManualScorecardConceptsValuesQuery(savedFormId);
      let scGetManualScorecardsConceptValuesResulr = await connection.request().query(scGetManualScorecardsConceptValuesQuery);

      let creditHistoryEvaluationPossibleValuesQuery = financials_query_provider.generateGetCreditHistoryEvaluationPossibleValuesQuery();
      data.creditHistoryPossibleValues = (await connection.request().query(creditHistoryEvaluationPossibleValuesQuery)).recordset;

      let legalEvaluationPossibleValuesQuery = financials_query_provider.generateGetLegalEvaluationPossibleValuesQuery();
      data.legalPossibleValues = (await connection.request().query(legalEvaluationPossibleValuesQuery)).recordset;

      let referenceEvaluationPossibleValuesQuery = financials_query_provider.generateGetReferenceEvaluationPossibleValuesQuery();
      data.referencesPossibleValues = (await connection.request().query(referenceEvaluationPossibleValuesQuery)).recordset;

      let bankLineEvaluationPossibleValuesQuery = financials_query_provider.generateGetBankLineEvaluationPossibleValuesQuery();
      data.bankLinePossibleValues = (await connection.request().query(bankLineEvaluationPossibleValuesQuery)).recordset;

      let analysisTypePossibleValuesQuery = financials_query_provider.generateGetAnalysisTypePossibleValuesQuery();
      data.analysisTypePossibleValues = (await connection.request().query(analysisTypePossibleValuesQuery)).recordset;

      let financialStatementTypesPossibleValuesQuery = financials_query_provider.generateGetFinancialStatementTypesPossibleValuesQuery();
      data.financialStatementTypesPossibleValues = (await connection.request().query(financialStatementTypesPossibleValuesQuery)).recordset;

      let companiesTypesPossibleValuesQuery = financials_query_provider.generateGetCompaniesTypesQuery();
      data.companiesTypesPossibleValues = (await connection.request().query(companiesTypesPossibleValuesQuery)).recordset;

      let discreteAccountsValuesQuery = financials_query_provider.generateGetDiscreteAccountsQuery(savedFormId);
      let discreteAccountsResult = (await connection.request().query(discreteAccountsValuesQuery));

      let formDisplayTypeQuery = financials_query_provider.generateGetFormDisplayTypeBySavedForm(savedFormId);
      let formDisplayTypeResult = (await connection.request().query(formDisplayTypeQuery));

      let subcontractorData = scSubcontractorDataResult.recordset[0];
      let scSourcesData = scSourcesResult.recordset;
      let scCompaniesTypesData = scCompaniesTypesResult.recordset;
      let formDisplayTypeData = formDisplayTypeResult.recordset[0];

      data.subcontractorData = {};
      data.subcontractorData.savedFormId = savedFormId
      data.subcontractorData.subcontractorId = subcontractorData.subcontractorId;
      data.subcontractorData.subcontractorName = subcontractorData.subcontractorName;
      data.subcontractorData.hiringClientId = subcontractorData.hiringClientId;
      data.subcontractorData.dateOfSubmission = subcontractorData.dateOfSubmission;
      data.subcontractorData.dateOfPrequal = subcontractorData.dateOfPrequal;
      data.subcontractorData.dateOfFinancialStatement = subcontractorData.dateOfFinancialStatement;
      data.subcontractorData.dateOfFinancialStatementPrepared = subcontractorData.dateOfFinancialStatementPrepared; // can return NULL
      data.subcontractorData.scorecardSourceId = subcontractorData.scorecardSourceId;
      data.subcontractorData.scorecardSource = subcontractorData.scorecardSource;
      data.subcontractorData.companyTypeId = subcontractorData.companyTypeId;
      data.subcontractorData.companyType = subcontractorData.companyType;
      data.subcontractorData.turnOverRateId = subcontractorData.turnOverRateId;
      data.subcontractorData.turnOverRate = subcontractorData.turnOverRate;
      data.subcontractorData.turnOverDays = subcontractorData.turnOverDays;
      data.subcontractorData.analysisTypeId = subcontractorData.analysisTypeId; // can return NULL
      data.subcontractorData.commentary = subcontractorData.commentary;
      data.subcontractorData.isComplete = subcontractorData.isComplete;
      data.subcontractorData.finIsComplete = subcontractorData.finIsComplete; // can return NULL
      data.subcontractorData.financialStatementTypeId = subcontractorData.financialStatementTypeId;
      data.subcontractorData.dateOfRenewal = subcontractorData.dateOfRenewal || _getDateOfRenewal(subcontractorData.turnOverMonths, subcontractorData.financialStatementTypeId, subcontractorData.dateOfFinancialStatement, subcontractorData.dateOfFinancialStatementPrepared);

      data.scorecardSourcePossibleValues = scSourcesData;
      data.scorecardCompaniesTypesPossibleValues = scCompaniesTypesData;
      data.scorecardTurnOverRatesPossibleValues = scTurnOverRatesResult.recordset;

      data.scorecardConcetpsList = scGetManualScorecardsConceptValuesResulr.recordset;

      data.accountsList = [];

      if (formDisplayTypeData) {
        data.accountDisplayTypeId = formDisplayTypeData.AccountDisplayTypeId;
      }

      let discreteAccountsList = [];
      let noteDiscreteAccountResult = null;

      let existDiscreteAccounts = (discreteAccountsResult.recordset.filter(x => x.exist == 0).length > 0);
      if (existDiscreteAccounts) {
        discreteAccountsResult.recordset.forEach(element => {

          if (discreteAccountsList.length == 0) {
            let object = { 'discreteValueId': element.discreteValueId, 'id': element.accountId, 'name': element.accountName, 'valueSeleted': element.AccountValue, 'options': [], 'note': null };
            object.options.push(element.Options);
            discreteAccountsList.push(object);
          }
          else {

            let existsAccount = discreteAccountsList.find(x => x.id == element.accountId);

            if (existsAccount === undefined) {
              let object = { 'discreteValueId': element.discreteValueId, 'id': element.accountId, 'name': element.accountName, 'valueSeleted': element.AccountValue, 'options': [], 'note': null };
              object.options.push(element.Options);
              discreteAccountsList.push(object);
            }
            else {
              discreteAccountsList.find(x => x.id == element.accountId).options.push(element.Options);
            }
          }

        })
      }

      data.discreteAccountsList = existDiscreteAccounts ? discreteAccountsList : [];

      if (existDiscreteAccounts) {
        let discreteValueId = "";
        data.discreteAccountsList.forEach(element => {
          discreteValueId += element.discreteValueId + ",";
        })
        discreteValueId = discreteValueId.substring(0, discreteValueId.length - 1);
        let noteDiscreteAccountQuery = financials_query_provider.generateGetTaskQuery(discreteValueId);
        noteDiscreteAccountResult = (await connection.request().query(noteDiscreteAccountQuery));

      }
      connection.close();

      if (existDiscreteAccounts) {
        noteDiscreteAccountResult.recordset.forEach(element => {
          data.discreteAccountsList.find(x => x.discreteValueId == element.AssetId).note = { 'taskId': element.Id, 'name': element.Name, 'description': element.Description };
        })
      }


      let accounts = scDataResult.recordset;

      let parentGroupId = 0;
      let groupId = 0;

      for (i = 0; i < accounts.length; i++) {
        let account = accounts[i];
        if (parentGroupId != account.parentGroupId) {
          parentGroupId = account.parentGroupId;
          let parentGroup = {};
          parentGroup.id = account.parentGroupId;
          parentGroup.name = account.parentGroup;
          parentGroup.groups = [];
          data.accountsList.push(parentGroup);
        }
      }

      parentGroupId = 0;

      // Visit parent groups
      for (i = 0; i < data.accountsList.length; i++) {
        let parentGroup = data.accountsList[i];

        if (parentGroupId != parentGroup.id) {
          parentGroupId = parentGroup.id;

          // Visit groups
          for (j = 0; j < accounts.length; j++) {

            let account = accounts[j];

            if (parentGroupId == account.parentGroupId) {

              if (groupId != account.groupId) {
                groupId = account.groupId;
                let group = {};
                group.id = account.groupId;
                group.name = account.groupName;
                group.accounts = [];

                // Visit accounts
                for (h = 0; h < accounts.length; h++) {
                  let accountValue = accounts[h];
                  if (accountValue.groupId == group.id) {
                    group.accounts.push(accountValue);
                  }
                }

                parentGroup.groups.push(group);
              }
            }
          }
        }
      }

      const accountsMapper = (account) => {
        const {
          AdjustmentValue,
          id,
          name,
          value,
          orderIndex
        } = account;

        return {
          accountId: id,
          accountName: name,
          orderIndex: orderIndex,
          adjustment: AdjustmentValue || 0,
          alwaysVisible: true,
          value: value || 0
        }
      };

      const noAdjustmentAccountsMapper = (account) => {
        const {
          id,
          name,
          value,
          orderIndex
        } = account;

        return {
          accountId: id,
          accountName: name,
          orderIndex: orderIndex,
          adjustment: 0,
          hideAdjustment: true,
          alwaysVisible: true,
          value: value || 0
        }
      };

      data.basicAccounts = {
        id: 'basicAccounts',
        name: 'Basic Accounts',
        totalType: 'none',
        accounts: scGetBasicAccountsResult.recordset.map(accountsMapper),
      };

      data.avgProjectAccounts = {
        id: 'averageProject',
        name: 'Largest Contracts Completed',
        totalLabel: 'Average Largest Project',
        hideAdjustment: true,
        totalType: 'average',
        accounts: scGetAvgProjectAccountsResult.recordset.map(noAdjustmentAccountsMapper)
      };

      data.avgVolumeAccounts = {
        id: 'averageVolume',
        name: 'Annual Revenue',
        totalLabel: 'Average Annual Revenue',
        hideAdjustment: true,
        totalType: 'average',
        accounts: scGetAvgVolumeAccountsResult.recordset.map(noAdjustmentAccountsMapper)
      };

      callback(null, data);
    } else {
      callback(null, null);
    }
  }
  catch (err) {
    console.log(err);
    callback(err, null);
  }
}

exports.getScorecardConcepts = async function (submissionId, callback) {
  try {
    const connection = await sql_helper.getConnection();
    const data = {};

    let scDataQuery = financials_query_provider.generateScorecardConceptsQuery(submissionId);
    let scDataResult = await connection.request().query(scDataQuery);

    let scSubcontractorDataQuery = financials_query_provider.generateScorecardSCDataQuery(submissionId);
    let scSubcontractorDataResult = await connection.request().query(scSubcontractorDataQuery);

    let scGetAvgProjectAccountsQuery = financials_query_provider.generateGetBasicAccountsBySubmissionIdQuery(submissionId, 3);
    let scGetAvgProjectAccountsResult = await connection.request().query(scGetAvgProjectAccountsQuery);

    let scGetAvgVolumeAccountsQuery = financials_query_provider.generateGetBasicAccountsBySubmissionIdQuery(submissionId, 4);
    let scGetAvgVolumeAccountsResult = await connection.request().query(scGetAvgVolumeAccountsQuery);

    let scEMRValuesQuery = financials_query_provider.getEMRValuesQuery(submissionId);
    let scEMRValuesResult = await connection.request().query(scEMRValuesQuery);

    let discreteAccountQuery = financials_query_provider.generateGetDiscreteAccountsQuery(submissionId);
    let discreteAccountsResult = await connection.request().query(discreteAccountQuery);

    let formDisplayTypeQuery = financials_query_provider.generateGetFormDisplayTypeBySavedForm(submissionId);
    let formDisplayTypeResult = await connection.request().query(formDisplayTypeQuery);

    let formHiddenScorecardFieldsQuery = financials_query_provider.generateGetFormHiddenScorecardFieldsBySavedForm(submissionId);
    let formHiddenScorecardFieldsResult = await connection.request().query(formHiddenScorecardFieldsQuery);

    let isCovidFormQuery = financials_query_provider.generateGetIsCovidFormBySavedForm(submissionId);
    let isCovidFormResult = await connection.request().query(isCovidFormQuery);

    let discreteAccountsList = [];
    let noteDiscreteAccountResult = null;
    let existDiscreteAccounts = (discreteAccountsResult.recordset.filter(x => x.exist == 0).length > 0);

    if (existDiscreteAccounts) {
      discreteAccountsResult.recordset.forEach(element => {

        if (discreteAccountsList.length == 0) {
          let object = {
            'discreteValueId': element.discreteValueId,
            'id': element.accountId,
            'name': element.accountName,
            'valueSeleted': element.AccountValue,
            'options': [],
            'color': element.AccountValue === element.Options ? element.Color : null,
            'note': null,
          };

          object.options.push(element.Options);
          discreteAccountsList.push(object);
        } else {
          let existsAccount = discreteAccountsList.find(x => x.id == element.accountId);

          if (existsAccount === undefined) {
            let object = {
              'discreteValueId': element.discreteValueId,
              'id': element.accountId,
              'name': element.accountName,
              'valueSeleted': element.AccountValue,
              'options': [],
              'color': element.AccountValue === element.Options ? element.Color : null,
              'note': null,
            };

            object.options.push(element.Options);
            discreteAccountsList.push(object);
          } else {
            const existantAccount = discreteAccountsList.find(x => x.id == element.accountId);

            if (!existantAccount.color && element.AccountValue === element.Options) {
              existantAccount.color = element.Color;
            }

            existantAccount.options.push(element.Options);
          }
        }
      });
    }

    data.discreteAccountsList = existDiscreteAccounts ? discreteAccountsList : [];

    if (existDiscreteAccounts) {
      let discreteValueId = "";

      data.discreteAccountsList.forEach(element => {
        discreteValueId += element.discreteValueId + ",";
      });

      discreteValueId = discreteValueId.substring(0, discreteValueId.length - 1);
      let noteDiscreteAccountQuery = financials_query_provider.generateGetTaskQuery(discreteValueId);
      noteDiscreteAccountResult = (await connection.request().query(noteDiscreteAccountQuery));
    }

    connection.close();

    if (existDiscreteAccounts) {
      noteDiscreteAccountResult.recordset.forEach(element => {
        data.discreteAccountsList.find(x => x.discreteValueId == element.AssetId).note = { 'taskId': element.Id, 'name': element.Name, 'description': element.Description };
      })
    }

    data.avgProjectAccounts = scGetAvgProjectAccountsResult.recordset;
    data.avgVolumeAccounts = scGetAvgVolumeAccountsResult.recordset;

    data.accountDisplayTypeId = formDisplayTypeResult.recordset[0] ? formDisplayTypeResult.recordset[0].AccountDisplayTypeId : 1;
    data.scorecardHiddenFields = formHiddenScorecardFieldsResult.recordset.map(res => res.id);
    data.isCovid19Form = !!isCovidFormResult.recordset[0].result;

    const hasSelectedDiscreteAccounts = data.discreteAccountsList.some(discreteAccount => discreteAccount.valueSeleted !== "0");
    const hasData = (data.accountDisplayTypeId === 2) ? hasSelectedDiscreteAccounts : (scDataResult.recordset.length > 0);

    if (hasData) {
      let subcontractorData = scSubcontractorDataResult.recordset[0];
      data.subcontractorData = {};
      data.subcontractorData.subcontractorName = subcontractorData.subcontractorName;
      data.subcontractorData.tradeName = subcontractorData.tradeName;
      data.subcontractorData.dateOfPrequal = subcontractorData.dateOfPrequal;
      data.subcontractorData.dateOfFinancialStatement = subcontractorData.dateOfFinancialStatement;

      data.scorecardMainParameters = {};
      data.scorecardMainParameters.tieRating = subcontractorData.tieRating;
      data.scorecardMainParameters.singleProjectLimit = subcontractorData.singleProjectLimit;
      data.scorecardMainParameters.aggregateProjectExposure = subcontractorData.aggregateProjectExposure;
      data.scorecardMainParameters.adjustedWorkingCapital = subcontractorData.adjustedWorkingCapital;

      data.scorecardConcepts = scDataResult.recordset;
      data.commentary = subcontractorData.commentary;
      delete subcontractorData.commentary;

      let emrList = [];
      if (scEMRValuesResult.recordset.length > 0) {
        emrList = scEMRValuesResult.recordset;
      }

      data.emrAccounts = emrList;
      data.nevadaSingleLimit = {}
      data.nevadaSingleLimit.value = subcontractorData.NSLvalue
      data.nevadaSingleLimit.adjustmentValue = subcontractorData.NSLadjustmentValue
      data.nevadaSingleLimit.adjustmentFactor = subcontractorData.NSLadjustmentFactor

      callback(null, data);
    } else {
      callback(null, null);
    }
  }
  catch (err) {
    console.log(err);
    callback(err, null);
  }
}

exports.getSubcontractorAccounts = async (savedFormId) => {
  const connection = await sql_helper.getConnection()
  let
    scAccountsQuery = financials_query_provider.generateGetAccountsBySubmissionIdQuery(savedFormId),
    scAccountsResult = await connection.request().query(scAccountsQuery),
    scBasicAccountsQuery = financials_query_provider.generateGetBasicAccountsBySubmissionIdQuery(savedFormId, 2),
    scbasicAccountsResult = await connection.request().query(scBasicAccountsQuery)

  connection.close()

  return {
    accounts: scAccountsResult.recordset,
    basicAccounts: scbasicAccountsResult.recordset
  }
}

exports.addOrUpdateScorecards = async function (inputData, logParams, userId, callback) {
  try {
    let shouldLog = false;

    // Get all accounts for the provided submission id
    const data = {};

    // Get SC data
    let subcontractorData = inputData.subcontractorData;
    let savedFormId = subcontractorData.savedFormId;
    let dateOfFinancialStatement = subcontractorData.dateOfFinancialStatement;
    if (subcontractorData.dateOfFinancialStatementPrepared == '') subcontractorData.dateOfFinancialStatementPrepared = null;
    let dateOfFinancialStatementPrepared = subcontractorData.dateOfFinancialStatementPrepared;
    let dateOfPrequal = subcontractorData.dateOfPrequal;
    let dateOfRenewal = subcontractorData.dateOfRenewal;
    let scorecardSourceId = subcontractorData.scorecardSourceId;
    let companyTypeId = subcontractorData.companyTypeId;
    let turnOverRateId = subcontractorData.turnOverRateId;
    let analysisTypeId = subcontractorData.analysisTypeId || null;
    let financialStatementTypeId = subcontractorData.financialStatementTypeId || null;
    let commentary = subcontractorData.commentary;
    let finIsComplete = subcontractorData.finIsComplete;

    // Get accounts
    let accountsList = inputData.accountsList;
    let scorecardConcetpsList = inputData.scorecardConcetpsList;
    let basicAccounts = inputData.basicAccounts;
    let avgProjectAccounts = inputData.avgProjectAccounts;
    let avgVolumeAccounts = inputData.avgVolumeAccounts;

    // Discrete Accounts
    let discreteAccountsList = inputData.discreteAccounts;

    if (shouldLog) {
      console.log('inputData', inputData);
    }

    if (inputData.update) {

      // INSERT, DELETE, and UPDATE queries -- These do not fire off if the Front End fired off the "calculate values" function, which sets "inputData.update" to "false"
      // Only the Save and Save and complete functions set "inputData.update" to "true".  See certfocus_frontend\src\components\sc-profile\tabs\financialInfo\index.js, lines 318-334


      // Create delete and insert queries
      let queries = "DECLARE @lastIdentity INT; DECLARE @exists int;";
      let deleteQueries = "";
      let updateQueries = "";
      let insertQueries = "";
      let submissionQueries = "";
      for (i = 0; i < accountsList.length; ++i) {
        let accountId = accountsList[i].accountId;
        let value = accountsList[i].value;
        let adjustmentValue = accountsList[i].adjustment;
        let deleteQuery = financials_query_provider.generateDeleteAccountValueQuery(savedFormId, accountId);
        deleteQueries += deleteQuery;
        let insertQuery = financials_query_provider.generateInsertAccountValueQuery(savedFormId, accountId, value, adjustmentValue, accountsList[i].note, userId);
        insertQueries += insertQuery;
      }

      if (scorecardConcetpsList) {
        for (i = 0; i < scorecardConcetpsList.length; i++) {
          const scorecardConceptId = scorecardConcetpsList[i].scorecardConceptId;
          const numericValue = scorecardConcetpsList[i].id; //TODO: TAKE A LOOK AT THIS NUMERIC VALUE
          const value = scorecardConcetpsList[i].value;
          const color = scorecardConcetpsList[i].color;

          if (scorecardConceptId && value && color) {
            const insertQuery = financials_query_provider.generateUpdateScorecardConceptValueQuery(
              subcontractorData.hiringClientId,
              savedFormId,
              scorecardConceptId,
              value,
              color,
              numericValue
            );

            insertQueries += insertQuery;
          }
        }
      }
      if (basicAccounts) {
        for (i = 0; i < basicAccounts.length; i++) {
          const accountId = basicAccounts[i].accountId;
          const value = basicAccounts[i].value;
          const note = basicAccounts[i].note;

          if (accountId && value) {
            let updateQuery = financials_query_provider.generateUpdateAccountValueQuery(accountId, value);
            updateQueries += updateQuery;
          }
        }
      }

      if (avgProjectAccounts) {
        for (i = 0; i < avgProjectAccounts.length; i++) {
          const accountId = avgProjectAccounts[i].accountId;
          const value = avgProjectAccounts[i].value;
          const note = avgProjectAccounts[i].note;

          if (accountId && value) {
            let updateQuery = financials_query_provider.generateUpdateAccountValueQuery(accountId, value);
            updateQueries += updateQuery;
          }
        }
      }

      if (avgVolumeAccounts) {
        for (i = 0; i < avgVolumeAccounts.length; i++) {
          const accountId = avgVolumeAccounts[i].accountId;
          const value = avgVolumeAccounts[i].value;
          const note = avgVolumeAccounts[i].note;

          if (accountId && value) {
            let updateQuery = financials_query_provider.generateUpdateAccountValueQuery(accountId, value);
            updateQueries += updateQuery;
          }
        }
      }

      if (discreteAccountsList && discreteAccountsList.length > 0) {
        const connection = await sql_helper.getConnection();

        let discreteAccountsQuerys = "DECLARE @lastIdentity int;";

        discreteAccountsList.forEach(element => {
          discreteAccountsQuerys += financials_query_provider.generateUpdateDiscreteAccountQuery(savedFormId, element.accountId, element.valueSelected, element.note);
        });

        await connection.request().query(discreteAccountsQuerys);

        connection.close();
      }

      let params = {}
      params.savedFormId = savedFormId
      params.scorecardSourceId = scorecardSourceId
      params.companyTypeId = companyTypeId
      params.dateOfFinancialStatement = dateOfFinancialStatement
      params.dateOfFinancialStatementPrepared = dateOfFinancialStatementPrepared
      params.dateOfPrequal = dateOfPrequal
      params.turnOverRateId = turnOverRateId
      params.dateOfRenewal = dateOfRenewal
      params.analysisTypeId = analysisTypeId
      params.financialStatementTypeId = financialStatementTypeId
      params.commentary = commentary
      params.finIsComplete = finIsComplete

      let submissionQuery = financials_query_provider.generateUpdateSubmissionValuesQuery(params);

      let updateSubcontractorStatusQuery = finIsComplete ? subcontractors_query_provider.updateHC_SC_StatusById(subcontractorData.hiringClientId, subcontractorData.subcontractorId, 6, 0) : '';


      queries += deleteQueries + insertQueries + updateQueries + submissionQuery + updateSubcontractorStatusQuery;

      if (shouldLog) {
        console.log('addOrUpdateScorecards '.repeat(20));
        console.log('origin = addOrUpdateScorecards')
        console.log(queries);
      }

      sql_helper.createTransaction(queries, async function (err, allAccountsByHC, basicAccountsValues, companiesTypes) {
        if (err) {
          console.log('error:', err)
          callback(err, false, null);
        }

        await logger.addEntry(logParams, function (err, result) {
          if (err) {
            console.log("There was an error creating log for: ");
            console.log(logParams);
            console.log(err);
          } else {
            console.log("Log succesfully created");
          }
          return;
        });
      });

    } else {
      if (shouldLog) {
        console.log('UPDATE BLOCKED '.repeat(25))
        console.log('UPDATE, INSERT, and DELETE queries in mssql.addOrUpdateScorecards were skipped')
      }
    }

    // GET/SELECT Queries only

    const connection = await sql_helper.getConnection();

    let scAccountsQuery = financials_query_provider.generateGetAccountsBySubmissionIdQuery(savedFormId);

    let scAccountsResult = await connection.request().query(scAccountsQuery);

    // Get basic accounts
    let scBasicAccountsQuery = financials_query_provider.generateGetBasicAccountsBySubmissionIdQuery(savedFormId, 2);
    let scDefaultAccountsQuery = financials_query_provider.generateGetBasicAccountsBySubmissionIdQuery(savedFormId, 1);

    let scbasicAccountsResult = await connection.request().query(scBasicAccountsQuery);
    let scDefaultAccountsResult = await connection.request().query(scDefaultAccountsQuery);

    // Get companies types
    let scCompaniesTypesQuery = financials_query_provider.generateGetCompaniesTypesQuery(savedFormId);

    let scCompaniesTypesResult = await connection.request().query(scCompaniesTypesQuery);

    // Get companies types
    let scTurnOverRatesQuery = financials_query_provider.generateGetTurnOverRatesQuery();

    let scTurnOverRatesResult = await connection.request().query(scTurnOverRatesQuery);

    // Get qualifications criterias
    let scQualificationsCriteriasQuery = financials_query_provider.generateGetQualificationsCriteriaQuery(subcontractorData.subcontractorId, subcontractorData.hiringClientId);

    let scQualificationsCriteriasResult = await connection.request().query(scQualificationsCriteriasQuery);

    // Get tie ratings criterias
    let scTierRatingsCriteriasQuery = financials_query_provider.generateGetTieRatingCriteriaQuery(savedFormId);

    let scTierRatingsCriteriasResult = await connection.request().query(scTierRatingsCriteriasQuery);

    // Get avg projects amounts
    let scAvgProjectsQuery = financials_query_provider.generateGetscAvgProjectsQuery(savedFormId, 3);

    let scAvgProjectsResult = await connection.request().query(scAvgProjectsQuery);

    // Get avg volumes
    let scAvgVolumesQuery = financials_query_provider.generateGetscAvgProjectsQuery(savedFormId, 4);

    let scAvgVolumesResult = await connection.request().query(scAvgVolumesQuery);

    // Get Project Limiti Coefficients
    let projectLimitCoefficientsQuery = financials_query_provider.generateGetProjectLimitCoefficientsQuery(subcontractorData.hiringClientId);

    let projectLimitCoefficientsResult = await connection.request().query(projectLimitCoefficientsQuery);

    // Get Max Aggregate Project maxAggregateProjectLimitResult
    let maxAggregateProjectLimitQuery = financials_query_provider.generateGetMaxAggregateProjectLimitQuery(subcontractorData.hiringClientId, subcontractorData.financialStatementTypeId);

    let maxAggregateProjectLimitResult = await connection.request().query(maxAggregateProjectLimitQuery);

    // Discrete Accounts
    let discreteAccountQuery = financials_query_provider.generateGetDiscreteAccountsQuery(savedFormId);
    let discreteAccountsResult = await connection.request().query(discreteAccountQuery);

     discreteAccountsList = [];
    let noteDiscreteAccountResult = null;

      let existDiscreteAccounts = (discreteAccountsResult.recordset.filter(x => x.exist == 0).length > 0);
      if (existDiscreteAccounts) {
        discreteAccountsResult.recordset.forEach(element => {

          if (discreteAccountsList.length == 0) {
            let object = {
              'discreteValueId': element.discreteValueId,
              'id': element.accountId,
              'name': element.accountName,
              'valueSeleted': element.AccountValue,
              'options': [],
              'note': null,
              'color': element.AccountValue === element.Options ? element.Color : null,
            };

            object.options.push(element.Options);
            discreteAccountsList.push(object);
          } else {
            let existsAccount = discreteAccountsList.find(x => x.id == element.accountId);

            if (existsAccount === undefined) {
              let object = {
                'discreteValueId': element.discreteValueId,
                'id': element.accountId,
                'name': element.accountName,
                'valueSeleted': element.AccountValue,
                'options': [],
                'note': null,
                'color': element.AccountValue === element.Options ? element.Color : null,
              };

              object.options.push(element.Options);
              discreteAccountsList.push(object);
            } else {
              const existantAccount = discreteAccountsList.find(x => x.id == element.accountId);

              if (!existantAccount.color && element.AccountValue === element.Options) {
                existantAccount.color = element.Color;
              }

              existantAccount.options.push(element.Options);
            }
          }
        })
      }

      discreteAccountsList = existDiscreteAccounts ? discreteAccountsList : [];

      if (existDiscreteAccounts) {
        let discreteValueId = "";
        discreteAccountsList.forEach(element => {
          discreteValueId += element.discreteValueId + ",";
        })
        discreteValueId = discreteValueId.substring(0, discreteValueId.length - 1);
        let noteDiscreteAccountQuery = financials_query_provider.generateGetTaskQuery(discreteValueId);
        noteDiscreteAccountResult = (await connection.request().query(noteDiscreteAccountQuery));
      }

    connection.close();

    if (existDiscreteAccounts) {
      noteDiscreteAccountResult.recordset.forEach(element => {
        discreteAccountsList.find(x => x.discreteValueId == element.AssetId).note = { 'taskId': element.Id, 'name': element.Name, 'description': element.Description };
      })
    }

    const discreteAccountsResultList = inputData.update ? discreteAccountsList : formatInputDiscreteAccounts(inputData.discreteAccounts);

    if (shouldLog) {
      console.log('GET/SELECT Queries '.repeat(20))
      console.log('scAccountsResult.recordset = ', scAccountsResult.recordset)
      console.log('scbasicAccountsResult.recordset = ', scbasicAccountsResult.recordset)
      console.log('scCompaniesTypesResult.recordset = ', scCompaniesTypesResult.recordset)
      console.log('scTurnOverRatesResult.recordset = ', scTurnOverRatesResult.recordset)
      console.log('scQualificationsCriteriasResult.recordset = ', scQualificationsCriteriasResult.recordset)
      console.log('scTierRatingsCriteriasResult.recordset = ', scTierRatingsCriteriasResult.recordset)
      console.log('scAvgProjectsResult.recordset = ', scAvgProjectsResult.recordset)
      console.log('scAvgVolumesResult.recordset = ', scAvgVolumesResult.recordset)
      console.log('projectLimitCoefficientsResult.recordset = ', projectLimitCoefficientsResult.recordset)
      console.log('maxAggregateProjectLimitResult.recordset = ', maxAggregateProjectLimitResult.recordset)
    }

    // Should be 13 arguments
    callback(
      null,
      inputData.update,
      scAccountsResult.recordset,
      scbasicAccountsResult.recordset,
      scDefaultAccountsResult.recordset,
      scCompaniesTypesResult.recordset,
      scTurnOverRatesResult.recordset,
      scQualificationsCriteriasResult.recordset,
      scTierRatingsCriteriasResult.recordset,
      scAvgProjectsResult.recordset,
      scAvgVolumesResult.recordset,
      projectLimitCoefficientsResult.recordset,
      maxAggregateProjectLimitResult.recordset,
      discreteAccountsResultList,
    );
  }
  catch (err) {
    console.log(err);
    callback(err, false, null);
  }
}

exports.updateScorecardsConceptsValues = async function (inputData, calcRes, callback) {
  try {

    const shouldLog = false

    if (!inputData.update) {
      if (shouldLog) {
        console.log('UPDATE BLOCKED '.repeat(25))
        console.log('UPDATE queries in mssql.updateScorecardsConceptsValues were skipped')
      }
      callback(null, inputData.update);
      return
    }

    let submissionId = {};
    let currentRatio = {};
    let workingCapitalToBacklog = {};
    let numberDaysOfCash = {};
    let ARturnover = {};
    let APturnover = {};
    let debtNetWorth = {};
    let netWorthBacklog = {};
    let profitability = {};

    // Copy render value
    submissionId = inputData.subcontractorData.savedFormId;
    let subcontractorData = inputData.subcontractorData;
    let scorecardConcetpsList = inputData.scorecardConcetpsList;

    currentRatio.value = Math.round(calcRes.scorecardConcepts.currentRatio.value * 100) / 100;
    workingCapitalToBacklog.value = Math.round(calcRes.scorecardConcepts.workingCapitalToBacklog.value * 100) / 100;
    numberDaysOfCash.value = Math.round(calcRes.scorecardConcepts.numberDaysOfCash.value * 100) / 100;
    ARturnover.value = Math.round(calcRes.scorecardConcepts.ARturnover.value * 100) / 100;
    APturnover.value = Math.round(calcRes.scorecardConcepts.APturnover.value * 100) / 100;
    debtNetWorth.value = Math.round(calcRes.scorecardConcepts.debtNetWorth.value * 100) / 100;
    netWorthBacklog.value = Math.round(calcRes.scorecardConcepts.netWorthBacklog.value * 100) / 100;
    profitability.value = calcRes.scorecardConcepts.profitability.value;

    // Copy rounded numeric value
    currentRatio.numericValue = Math.round(calcRes.scorecardConcepts.currentRatio.numericValue * 100) / 100;
    workingCapitalToBacklog.numericValue = Math.round(calcRes.scorecardConcepts.workingCapitalToBacklog.numericValue * 100) / 100;
    numberDaysOfCash.numericValue = Math.round(calcRes.scorecardConcepts.numberDaysOfCash.numericValue * 100) / 100;
    ARturnover.numericValue = Math.round(calcRes.scorecardConcepts.ARturnover.numericValue * 100) / 100;
    APturnover.numericValue = Math.round(calcRes.scorecardConcepts.APturnover.numericValue * 100) / 100;
    debtNetWorth.numericValue = Math.round(calcRes.scorecardConcepts.debtNetWorth.numericValue * 100) / 100;
    netWorthBacklog.numericValue = Math.round(calcRes.scorecardConcepts.netWorthBacklog.numericValue * 100) / 100;
    profitability.numericValue = calcRes.scorecardConcepts.profitability.numericValue;

    // Copy ids
    currentRatio.id = calcRes.scorecardConcepts.currentRatio.id;
    workingCapitalToBacklog.id = calcRes.scorecardConcepts.workingCapitalToBacklog.id;
    numberDaysOfCash.id = calcRes.scorecardConcepts.numberDaysOfCash.id;
    ARturnover.id = calcRes.scorecardConcepts.ARturnover.id;
    APturnover.id = calcRes.scorecardConcepts.APturnover.id;
    debtNetWorth.id = calcRes.scorecardConcepts.debtNetWorth.id;
    netWorthBacklog.id = calcRes.scorecardConcepts.netWorthBacklog.id;
    profitability.id = calcRes.scorecardConcepts.profitability.id;

    // Copy colors
    currentRatio.color = calcRes.scorecardConcepts.currentRatio.color;
    workingCapitalToBacklog.color = calcRes.scorecardConcepts.workingCapitalToBacklog.color;
    numberDaysOfCash.color = calcRes.scorecardConcepts.numberDaysOfCash.color;
    ARturnover.color = calcRes.scorecardConcepts.ARturnover.color;
    APturnover.color = calcRes.scorecardConcepts.APturnover.color;
    debtNetWorth.color = calcRes.scorecardConcepts.debtNetWorth.color;
    netWorthBacklog.color = calcRes.scorecardConcepts.netWorthBacklog.color;
    profitability.color = calcRes.scorecardConcepts.profitability.color;

    let queries = "DECLARE @exists INT;";

    queries += financials_query_provider.generateSCConceptsUpdateQuery(subcontractorData.hiringClientId, submissionId, currentRatio.id,
      currentRatio.value, currentRatio.numericValue,
      currentRatio.color);

    queries += financials_query_provider.generateSCConceptsUpdateQuery(subcontractorData.hiringClientId, submissionId, workingCapitalToBacklog.id,
      '' + workingCapitalToBacklog.value + '%', workingCapitalToBacklog.numericValue,
      workingCapitalToBacklog.color);

    queries += financials_query_provider.generateSCConceptsUpdateQuery(subcontractorData.hiringClientId, submissionId, numberDaysOfCash.id,
      numberDaysOfCash.value, numberDaysOfCash.numericValue,
      numberDaysOfCash.color);

    queries += financials_query_provider.generateSCConceptsUpdateQuery(subcontractorData.hiringClientId, submissionId, ARturnover.id,
      ARturnover.value, ARturnover.numericValue,
      ARturnover.color);

    queries += financials_query_provider.generateSCConceptsUpdateQuery(subcontractorData.hiringClientId, submissionId, APturnover.id,
      APturnover.value, APturnover.numericValue,
      APturnover.color);

    queries += financials_query_provider.generateSCConceptsUpdateQuery(subcontractorData.hiringClientId, submissionId, debtNetWorth.id,
      debtNetWorth.value, debtNetWorth.numericValue,
      debtNetWorth.color);

    queries += financials_query_provider.generateSCConceptsUpdateQuery(subcontractorData.hiringClientId, submissionId, netWorthBacklog.id, '' +
      netWorthBacklog.value + '%', netWorthBacklog.numericValue,
      netWorthBacklog.color);

    queries += financials_query_provider.generateSCConceptsUpdateQuery(subcontractorData.hiringClientId, submissionId, profitability.id,
      profitability.value, profitability.numericValue,
      profitability.color);

    queries += financials_query_provider.generateSCSubmissionTierUpdateQuery(submissionId, calcRes.scorecardMainParameters);



    for (let i = 0; i < scorecardConcetpsList.length; ++i) {
      let scConcept = scorecardConcetpsList[i];
      let value = scConcept.value;
      let id = scConcept.id;
      let color = scConcept.color;
      let scorecardConceptId = scConcept.scorecardConceptId;

      let comboConceptQuery = financials_query_provider.generateSCConceptsUpdateQuery(subcontractorData.hiringClientId, submissionId, scorecardConceptId,
        value, id, color);
      queries += comboConceptQuery
    }

    if (shouldLog) {
      console.log('Q*U*E*R*I*E*S '.repeat(20));
      console.log('origin = updateScorecardsConceptsValues')
      console.log(queries);
    }

    sql_helper.createTransaction(queries, async function (err, allAccountsByHC, basicAccountsValues, companiesTypes) {
      if (err) {
        return callback(err, false);
      }
    });

    callback(null, inputData.update);
  }
  catch (err) {
    console.log(err);
    callback(err, false);
  }
}

exports.updateDiscreteAccountsScorecardsConceptsValues = async (inputData, calcRes, callback) => {
  try {
    if (!inputData.update) {
      return callback(null, inputData.update);
    }

    let submissionId = inputData.subcontractorData.savedFormId;
    let queries = financials_query_provider.generateSCSubmissionTierUpdateQuery(submissionId, calcRes.scorecardMainParameters);

    sql_helper.createTransaction(queries, async err => {
      if (err) return callback(err, false);

      callback(null, inputData.update);
    });
  } catch (err) {
    console.log(err);
    callback(err, false);
  }
}
