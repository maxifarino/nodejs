const error_helper = require('../helpers/error_helper');
const transforms = require('../helpers/transforms');
const finances_facade = require('../mssql/finances');
const financials_processor = require('../processors/finances');
const mail = require('../mssql/emails')
const { formatCurrency } = require('../helpers/utils')

const _ = require('underscore')

exports.getAccountValues = async function (req, res) {
  const params = {}
  const data = {};

  if (!req.query.accountId && !req.query.savedFormId) {
    let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
  }

  params.accountId = req.query.accountId;
  params.savedFormId = req.query.savedFormId

  finances_facade.getAccountValues(params, function (err, result) {
    if (err) {
      return res.send(err);
    }
    if (!result) {
      let error = error_helper.getErrorData(error_helper.CODE_ACCOUNT_VALUE_NOT_FOUND, error_helper.MSG_ACCOUNT_VALUE_NOT_FOUND);
      return res.send(error);
    }
    data.totalCount = result.length;
    data.accountValues = result.recordset;

    return res.status(200).json({ success: true, data: data });
  });
}

exports.saveAccountValue = async function (req, res) {
  if (_.isEmpty(req.body) || !req.body.savedFormId || !req.body.accountId || !req.body.value) {
    let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
  }

  const params = {};
  let method = req.method;
  let originalUrl = req.originalUrl;

  params.accountValue = Object.assign({}, req.body);
  params.userId = req.currentUser.Id;
  params.eventDescription = method + '/' + originalUrl;

  finances_facade.saveAccountValue(params, function (err, result, accountValueId) {
    if (err) {
      error = error_helper.getSqlErrorData(err);
      return res.send(error);
    }
    return res.status(200).json({ success: true, data: { accountValueId: accountValueId } });
  });
}

exports.createAccount = async function (req, res) {
  if (_.isEmpty(req.body) || !req.body.groupId || !req.body.hiringClientId || !req.body.name || !req.body.accountTypeId) {
    let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
  }

  const params = {};
  let method = req.method;
  let originalUrl = req.originalUrl;

  params.account = Object.assign({}, req.body);
  params.userId = req.currentUser.Id;
  params.eventDescription = method + '/' + originalUrl;

  finances_facade.createAccount(params, function (err, result, accountId) {
    if (err) {
      error = error_helper.getSqlErrorData(err);
      return res.send(error);
    }
    return res.status(200).json({ success: true, data: { accountId: accountId } });
  });
}

exports.getAccounts = async function (req, res) {
  const params = {};
  const data = {};
  let invalidData = false;

  if (req.query.pageSize && (parseInt(req.query.pageSize) <= 0 || isNaN(parseInt(req.query.pageSize)))) invalidData = true;
  if (req.query.pageNumber && (parseInt(req.query.pageNumber) <= 0 || isNaN(parseInt(req.query.pageNumber)))) invalidData = true;

  if (invalidData) {
    let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
  }

  if (req.query.accountId) {
    params.accountId = req.query.accountId;
  }

  if (req.query.groupId) {
    params.groupId = req.query.groupId;
  }

  if (req.query.hiringClientId) {
    params.hiringClientId = req.query.hiringClientId;
  }

  if (req.query.pageSize && req.query.pageNumber) {
    params.pagination = {};
    params.pagination.pageSize = req.query.pageSize;
    params.pagination.pageNumber = req.query.pageNumber;
  }

  finances_facade.getAccounts(params, function (err, result) {
    if (err) {
      let error = error_helper.getSqlErrorData(err);
      return res.send(error);
    }
    if (!result) {
      let error = error_helper.getErrorData(error_helper.CODE_ACCOUNT_NOT_FOUND, error_helper.MSG_ACCOUNT_NOT_FOUND);
      return res.send(error);
    }

    data.totalCount = result.length;
    data.accounts = result.recordset;

    return res.status(200).json({ success: true, data: data });
  });
}

exports.updateAccount = async function (req, res) {
  if (_.isEmpty(req.body) || !req.body.accountId || !req.body.groupId || !req.body.hiringClientId || !req.body.name) {
    let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
  }

  const params = {};
  let method = req.method;
  let originalUrl = req.originalUrl;

  params.account = Object.assign({}, req.body);
  params.userId = req.currentUser.Id;
  params.eventDescription = method + '/' + originalUrl;

  finances_facade.updateAccount(params, function (err, result) {
    if (err) {
      error = error_helper.getSqlErrorData(err);
      return res.send(error);
    }
    return res.status(200).json({ success: true, data: { accountUpdated: result } });
  });
}

exports.updateAccountValue = async function (req, res) {
  if (_.isEmpty(req.body) || !req.body.savedFormId || !req.body.values) {
    let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
  }

  // if(isNaN(parseFloat(req.body.value))) {
  //   let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
  //   return res.send(error);
  // }

  const params = {};
  let method = req.method;
  let originalUrl = req.originalUrl;

  params.accountValues = Object.assign({}, req.body.values);
  params.savedFormId = req.body.savedFormId;
  params.userId = req.currentUser.Id;
  params.eventDescription = method + '/' + originalUrl;

  finances_facade.updateAccountValue(params, function (err, result) {
    if (err) {
      error = error_helper.getSqlErrorData(err);
      return res.send(error);
    }
    return res.status(200).json({ success: true, data: { accountValueUpdated: result } });
  });
}

exports.getScorecards = async function (req, res) {
  // get accounts values
  // generate totals

  const params = {}
  const data = {};

  if (!req.query.savedFormId && (!req.query.hcId || !req.query.scId)) {
    let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
  }

  let savedFormId = req.query.savedFormId
  let hcId = req.query.hcId
  let scId = req.query.scId

  finances_facade.getScorecards(hcId, scId, savedFormId, function (err, result) {
    if (err) {
      return res.send(err);
    }
    if (!result) {
      let error = error_helper.getErrorData(error_helper.CODE_ACCOUNT_VALUE_NOT_FOUND, error_helper.MSG_ACCOUNT_VALUE_NOT_FOUND);
      return res.send(error);
    }

    return res.status(200).json({ success: true, data: result });
  });
}

exports.getScorecardConcepts = async function (req, res) {
  // get criteria formulas
  // apply formulas using strategies
  // return scorecard concepts and their values

  if (_.isEmpty(req.query) || !req.query.savedFormId) {
    let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
  }

  var savedFormId = req.query.savedFormId

  finances_facade.getScorecardConcepts(savedFormId, function (err, data) {
    if (err) {
      return res.send(err);
    }
    if (!data) {
      let error = error_helper.getErrorData(error_helper.CODE_ACCOUNT_VALUE_NOT_FOUND, error_helper.MSG_ACCOUNT_VALUE_NOT_FOUND);
      return res.send(error);
    }

    return res.status(200).json({ success: true, data: data });
  });
}

exports.getWorkingCapital = async function (req, res) {

  let
    inputData = req.body.data,
    savedFormId = inputData.savedFormId,
    scAccounts = await finances_facade.getSubcontractorAccounts(savedFormId),
    accountsList = scAccounts.accounts,
    basicAccounts = scAccounts.basicAccounts

  inputData.basicAccounts = basicAccounts

  let
    workingCapital = financials_processor.calculateWorkingCapital(inputData, accountsList),
    invalidData = false

  if (inputData.accountsList.length == 0) invalidData = true;
  if (inputData.basicAccounts.length == 0) invalidData = true;
  if (!inputData.subcontractorData.companyTypeId) invalidData = true;
  if (!savedFormId) invalidData = true;

  if (invalidData) {
    let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    // console.log('E*R*R*O*R'.repeat(20))
    // console.log('error = ', error)
    return res.send(error);
  } else {
    return res.status(200).json({ success: true, workingCapital });
  }

}

exports.addOrUpdateScorecards = async function (req, res) {
  // Saved accounts values and adjustments and update calculations
  // get criteria formulas
  // apply formulas using strategies
  // return scorecard concepts and their values

  var invalidData = false;
  var inputData = req.body.data;
  const subcontractorData = inputData.subcontractorData;
  const accountsList = inputData.accountsList;

  if (!inputData) invalidData = true;
  if (!subcontractorData) invalidData = true;
  if (!accountsList) invalidData = true;

  if (invalidData) {
    let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
  }

  var logParams = {};
  let method = req.method;
  let originalUrl = req.originalUrl;

  logParams = {
    eventDescription: method + '/' + originalUrl,
    UserId: req.currentUser.Id,
    Payload: subcontractorData.savedFormId
  };

  var calcRes = {};

  await finances_facade.addOrUpdateScorecards(inputData, logParams, req.currentUser.Id,
    async function (
      err,
      wereScorecardsUpdated,
      accountsListResult,
      basicAccountsValuesResult,
      DefaultAccountsValuesResult,
      companiesTypesResult,
      turnOverRatesResult,
      qualificationCriteriasResult,
      tierRatingsCriteriasResult,
      avgProjectsResult,
      avgVolumesResult,
      projectLimitCoefficientsResult,
      maxAggregateProjectLimitResult,
      discreteAccountsList
    ) {
      if (err) {
        console.log('SCORECARD UPDATE ERROR '.repeat(5));
        console.log('err =', err);

        return res.send(err);
      }

      // Perform calculations and update scorecard values
      if (basicAccountsValuesResult.length > 0) {
        inputData.basicAccounts = basicAccountsValuesResult;
      } else {
        inputData.basicAccounts = [];
      }

      if ([1, 3].includes(inputData.accountDisplayTypeId)) {
        calcRes = financials_processor.calculateScorecards(
          inputData,
          accountsListResult,
          basicAccountsValuesResult,
          DefaultAccountsValuesResult,
          companiesTypesResult,
          turnOverRatesResult,
          qualificationCriteriasResult,
          tierRatingsCriteriasResult,
          avgProjectsResult,
          avgVolumesResult,
          projectLimitCoefficientsResult,
          maxAggregateProjectLimitResult
        );

        calcRes.discreteAccountsList = discreteAccountsList;

        // Notify Backend to Send Prequalification Auto-Notification Email to HC Requestors where hcOption = 1 (Currently only CRB)
        // console.log('ABOUT TO SEND MAIL '.repeat(10))
        // console.log('inputData.hcOption = ', inputData.hcOption)
        // console.log('inputData.emailParams = ', inputData.emailParams)
        // console.log('inputData.emailToHCactivityId = ', inputData.emailToHCactivityId)
        if (inputData.hcOption && inputData.emailParams && Number(inputData.emailToHCactivityId) == 6) {
          const {
            tieRating,
            singleProjectLimit,
            aggregateProjectExposure
          } = calcRes.scorecardMainParameters

          const {
            subject,
            body,
            hiringClientId,
            subcontractorId,
            subcontractorName,
            isRequestorEmail,
            requestorName,
            requestorEmail,
            emailToHCFromAddress,
            templateId
          } = inputData.emailParams

          const params = {
            isRequestorEmail,
            subject,
            body,
            hiringClientId,
            subcontractorId,
            subcontractorName,
            requestorName,
            requestorEmail,
            emailToHCFromAddress,
            tieRating,
            singleProjectLimit: formatCurrency(singleProjectLimit),
            aggregateProjectLimit: formatCurrency(aggregateProjectExposure),
            templateId
          }

          // console.log('LOADING MAIL PARAMS AND SENDING '.repeat(5))
          // console.log('params = ', params)

          mail.sendEmail(params)
        }

        await finances_facade.updateScorecardsConceptsValues(inputData, calcRes, function (err, wereScorecardsConceptsValuesUpdated) {
          if (err) {
            return res.send(err);
          }

          return res.status(200).json({ success: true, calcRes, wereScorecardsUpdated, wereScorecardsConceptsValuesUpdated });
        });
      } else {
        calcRes = await financials_processor.calculateDiscreteAccountsScorecards({
          inputData,
          avgProjectsResult,
        });

        calcRes.discreteAccountsList = discreteAccountsList;

        await finances_facade.updateDiscreteAccountsScorecardsConceptsValues(inputData, calcRes, function (err, wereScorecardsConceptsValuesUpdated) {
          if (err) {
            return res.send(err);
          }

          return res.status(200).json({ success: true, calcRes, wereScorecardsUpdated, wereScorecardsConceptsValuesUpdated });
        });
      }
    });
}
