const {isEmailValid} = require('../helpers/utils');

const emailsProcessor = require('../processors/emails');
const hashProvider = require('../processors/hashes');
const subContractors_sql = require('../mssql/sub_contractors')
const formsSQL = require('../mssql/forms')
const workflowsSQL = require('../mssql/workflows')
const error_helper = require('../helpers/error_helper');
const transforms = require('../helpers/transforms');
const _ = require('underscore')
const { writeLog } = require('./../utils')
const { sanitizeQuotesForDB, addDoubleQuotes } = require('../helpers/utils')

exports.getSubContractorsHeaderDetails = async function(req, res) {
  let invalidData = false;
  let invalidHCData = false
  let params = req.query;

  if(!params) {
    invalidData = true;
  }
  else {
    if(!params.hiringClientId) invalidHCData = true;
    if(params.hiringClientId && (parseInt(params.hiringClientId) <= 0 || isNaN(parseInt(params.hiringClientId)))) invalidHCData = true;
    if(!params.subcontractorId) invalidData = true;
    if(params.subcontractorId && (parseInt(params.subcontractorId) <= 0 || isNaN(parseInt(params.subcontractorId)))) invalidData = true;

  }

  params.currentUserId = req.currentUser.Id;

  if(invalidData || (invalidHCData && params.hiringClientId != 'null')){
    let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
     return res.send(error);
  }

  await subContractors_sql.getSubContractorsHeaderDetails(params, async function(err, headerData, hiringClientsListData) {
    if (err) {
      const date = `${(new Date()).toLocaleString()}`
      console.log('\n>DATE : ' + date + ',\n>ERROR: ' + err + ', \n>PARAMS: ' + params)
      const error = error_helper.getSqlErrorData(err);
      return res.status(500).send(error);
    }

    let data = {};
    data = headerData;
    data.hiringClientsList = hiringClientsListData;
    data.currentHiringClient = params.hiringClientId ? params.hiringClientId : hiringClientsListData[0].hiringClientId

    let registrationUrl = null;
    if(headerData.linkVisitedDate == null) {
      let tokenParams = {};
      tokenParams.hiringClientId = params.hiringClientId;
      tokenParams.subcontractorId = params.subcontractorId;
      let hash = await hashProvider.createToken(tokenParams);

      if(hiringClientsListData[0].registrationURL != null) {
         registrationUrl = hiringClientsListData[0].registrationURL + '/register/' + hash
      }
    }

    data.registrationUrl = registrationUrl;
    return res.status(200).json({ success: true, data: data});
  });
}

exports.getSubContractorsForPopover = async (req, res) => {
  let invalidData = false
  if(!req.query.userId) invalidData = true;

  if(invalidData){
    let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
     return res.send(error);
  }

  const id = req.query.userId

  await subContractors_sql.getSubContractorsForPopover(id, (err, result) => {
    if (err) {
      console.log(err);
      const error = error_helper.getSqlErrorData(err);
      return res.send(error);
    }
    const data = {}
    data.subContractors = result;
    return res.status(200).json({ success: true, data: data });
  });
}

exports.getSubContractorsByKeyword = async (req, res) => {
  // console.log('SEARCH BY KEYWORD '.repeat(50))
  // console.log('req.query.keyword = ', req.query.keyword)
  let invalidData = false
  if(!req.query.keyword) invalidData = true;

  if(invalidData){
    let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
     return res.send(error);
  }

  await subContractors_sql.getSubContractorsByKeyword(req.query.keyword, function(err, result) {
    if (err) {
      console.log(err);
      error = error_helper.getSqlErrorData(err);
    }
    if (!result) {
      error = error_helper.getErrorData(error_helper.CODE_SUB_CONTRATOR_NOT_FOUND, error_helper.MSG_SUB_CONTRACTOR_NOT_FOUND);
      return res.send(error);
    }
    const data = {}
    data.subContractors = result;
    return res.status(200).json({ success: true, data: data });
  });

}

exports.getSubContractors = async function(req, res) {
  const data = {};
  let params = {};
  var invalidData = false;

  if(req.query.id && (parseInt(req.query.id) <= 0 || isNaN(parseInt(req.query.id)))) invalidData = true;
  if(req.query.userId && (parseInt(req.query.userId) <= 0 || isNaN(parseInt(req.query.userId)))) invalidData = true;
  if(req.query.searchByHCId && (parseInt(req.query.searchByHCId) <= 0 || isNaN(parseInt(req.query.searchByHCId)))) invalidData = true;
  if(req.query.searchByStatusId && (parseInt(req.query.searchByStatusId) <= 0 || isNaN(parseInt(req.query.searchByStatusId)))) invalidData = true;
  if(req.query.searchByTradeId && (parseInt(req.query.searchByTradeId) <= 0 || isNaN(parseInt(req.query.searchByTradeId)))) invalidData = true;
  if(req.query.searchByTierRatingId && (parseInt(req.query.searchByTierRatingId) <= 0 || isNaN(parseInt(req.query.searchByTierRatingId)))) invalidData = true;
  if(req.query.subcontractorId && (parseInt(req.query.subcontractorId) <= 0 || isNaN(parseInt(req.query.subcontractorId)))) invalidData = true;

  if(req.query.orderDirection) {
    if(req.query.orderDirection != 'ASC' &&
      req.query.orderDirection != 'DESC')
      invalidData = true;
  }

  if(req.query.orderBy) {
    if(
        req.query.orderBy != 'id' &&
        req.query.orderBy != 'name' &&
        req.query.orderBy != 'address' &&
        req.query.orderBy != 'city' &&
        req.query.orderBy != 'state' &&
        req.query.orderBy != 'zipCode' &&
        req.query.orderBy != 'mainEmail' &&
        req.query.orderBy != 'taxID' &&
        req.query.orderBy != 'mainTrade' &&
        req.query.orderBy != 'status' &&
        req.query.orderBy != 'tierDesc' &&
        req.query.orderBy != 'requestorName' &&
        req.query.orderBy != 'requestorEmail'
       )
      invalidData = true;
  }

  if(invalidData){
    let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
     return res.send(error);
  }

  params = req.query;

  if(req.query.id) {
    params.id = req.query.id;
  }

  if (req.query.userId) {
    let userId = req.query.userId;
    params.method = 'userId';
    params.userId = userId;
    data.userId = userId;
  }
  else {
    params.method = 'list'
  }

  if(req.query.fields) {
    params.fields = req.query.fields.split(',');
  }

  await subContractors_sql.getSubContractors(params, function(err, result, totalRowsCount) {
    if (err) {
      console.log(err);
      error = error_helper.getSqlErrorData(err);
    }
    if (!result) {
      error = error_helper.getErrorData(error_helper.CODE_SUB_CONTRATOR_NOT_FOUND, error_helper.MSG_SUB_CONTRACTOR_NOT_FOUND);
      return res.send(error);
    }
    data.totalCount = totalRowsCount;
    let subcontractorsList = [];
    for(i = 0; i < result.length; i++) {
      let subcontractorItem = result[i];
      subcontractorItem.trade = {};
      subcontractorItem.secondaryTrade = {};
      subcontractorItem.tertiaryTrade = {};
      subcontractorItem.tier = {};
      subcontractorItem.trade.value = subcontractorItem.mainTradeId;
      subcontractorItem.trade.description = subcontractorItem.mainTrade;
      subcontractorItem.secondaryTrade.value = subcontractorItem.secondTradeId;
      subcontractorItem.secondaryTrade.description = subcontractorItem.secondTrade;
      subcontractorItem.tertiaryTrade.value = subcontractorItem.tertTradeId;
      subcontractorItem.tertiaryTrade.description = subcontractorItem.tertTrade;
      subcontractorItem.tier.id = subcontractorItem.tierId;
      subcontractorItem.tier.description = subcontractorItem.tierDesc;
      subcontractorItem.tier.color = subcontractorItem.tierColor;
      subcontractorsList.push(subcontractorItem);
    }
    data.subContractors = result;
    return res.status(200).json({ success: true, data: data });
  });
};

exports.getSubContractorsSubmissions = async function(req, res) {
  var invalidData = false;

  if(req.currentHiringClientId && (parseInt(req.currentHiringClientId) <= 0 || isNaN(parseInt(req.currentHiringClientId)))) invalidData = true;
  if(req.query.subcontractorId && (parseInt(req.query.subcontractorId) <= 0 || isNaN(parseInt(req.query.subcontractorId)))) invalidData = true;

  if(invalidData){
    let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
     return res.send(error);
  }

  await subContractors_sql.getSubContractorsSubmissions(req.currentHiringClientId, req.query.subcontractorId, function(err, result, totalRowsCount) {
    if (err) {
      console.log(err);
      error = error_helper.getSqlErrorData(err);
    }

    return res.status(200).json({ success: true, data: result });
  });

};

exports.getSubContractorsSummary = async function(req, res) {
  const data = {};
  let params = {};
  var invalidData = false;

  if(req.currentHiringClientId && (parseInt(req.currentHiringClientId) <= 0 || isNaN(parseInt(req.currentHiringClientId)))) invalidData = true;
  if(req.query.subcontractorId && (parseInt(req.query.subcontractorId) <= 0 || isNaN(parseInt(req.query.subcontractorId)))) invalidData = true;

  if(invalidData){
    let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
     return res.send(error);
  }

  await subContractors_sql.getSubContractorsSummary(req.currentHiringClientId, req.query.subcontractorId, function(err, result, totalRowsCount) {
    if (err) {
      console.log(err);
      error = error_helper.getSqlErrorData(err);
    }

    return res.status(200).json({ success: true, data: result });
  });
};

function isValidDate(dateString) {
  if(dateString.length > 8) return false;
  return true;
}

exports.getSubContractorsCompleted = async function(req, res) {
  const data = {};
  let params = {};
  var invalidData = false;
  console.log(req.query.ChangedSince);

  if(req.currentHiringClientId && (parseInt(req.currentHiringClientId) <= 0 || isNaN(parseInt(req.currentHiringClientId)))) invalidData = true;
  if(req.query.ChangedSince != null) {
    if(!isValidDate(req.query.ChangedSince)) invalidData = true;
  }

  if(invalidData){
    let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
     return res.send(error);
  }

  await subContractors_sql.getSubContractorsCompleted(req.currentHiringClientId, req.query.ChangedSince, true, function(err, result, totalRowsCount) {
    if (err) {
      console.log(err);
      error = error_helper.getSqlErrorData(err);
    }

    return res.status(200).json({ success: true, data: result });
  });
};

exports.getSubContractorsCompletedAll = async function(req, res) {
  const data = {};
  let params = {};
  var invalidData = false;

  if(req.currentHiringClientId && (parseInt(req.currentHiringClientId) <= 0 || isNaN(parseInt(req.currentHiringClientId)))) invalidData = true;
  if(req.query.ChangedSince != null) {
    if(!isValidDate(req.query.ChangedSince)) invalidData = true;
  }

  if(invalidData){
    let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
     return res.send(error);
  }

  await subContractors_sql.getSubContractorsCompleted(req.currentHiringClientId, req.query.ChangedSince, false, function(err, result, totalRowsCount) {
    if (err) {
      console.log(err);
      error = error_helper.getSqlErrorData(err);
    }

    return res.status(200).json({ success: true, data: result });
  });
};

exports.fetchHCforms = async (req, res) => {
  let invalidData = false
  const hcId = req.body.hcId

  if(invalidData){
    let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
     return res.send(error);
  }

  subContractors_sql.fetchHCforms(hcId, (err, forms) => {
    if (err || !forms) {
      error = 'No Forms could be found for this Hiring Client'
      return res.send(error);
    }
    return res.status(200).json({ success: true, data: forms });
  })

}

// POST add new subcontractor
exports.addSubContractor = async function(req, res) {

  console.log('AddSubcontractors:Name ' + req.body.name);

  if (_.isEmpty(req.body) ||
    ( _.isEmpty(req.body.name) && _.isEmpty(req.body.tradeId)
      && _.isEmpty(req.body.mainEmail) && _.isEmpty(req.body.city) )) {
    var error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
  }

  var name = req.body.name.replace("'", ' ');
  var tradeId = req.body.tradeId;
  var secondaryTradeId = req.body.secondaryTradeId;
  var tertiaryTradeId = req.body.tertiaryTradeId;
  var quaternaryTradeId = req.body.quaternaryTradeId;
  var quinaryTradeId = req.body.quinaryTradeId;
  var address = req.body.address;
  var city = req.body.city;
  var state = req.body.state;
  var zipCode = req.body.zipCode;
  var mainEmail = req.body.mainEmail;
  var taxId = req.body.taxId;

  if(secondaryTradeId == undefined)
    secondaryTradeId = '0';

  if(tertiaryTradeId == undefined)
    tertiaryTradeId = '0';

  if(quaternaryTradeId == undefined)
    quaternaryTradeId = '0';

  if(quinaryTradeId == undefined)
    quinaryTradeId = '0';

  if(address == undefined)
    address = '';

  if(city == undefined)
    city = '';

  if(state == undefined)
    state = '';

  if(zipCode == undefined)
    zipCode = '';

  if(mainEmail == undefined)
    mainEmail = '';

  if(taxId == undefined)
    taxId = '';

  var params = {
    name,
    tradeId,
    secondaryTradeId,
    tertiaryTradeId,
    quaternaryTradeId,
    quinaryTradeId,
    address,
    city,
    state,
    zipCode,
    mainEmail,
    taxId
  };

  let method = req.method;
  let originalUrl = req.originalUrl;
  params.userId = req.currentUser.Id;
  params.eventDescription = method + '/' + originalUrl;

  subContractors_sql.addSubContractor(params, function(err, updated, scId) {
    if (err){
      var error;
      if (err.originalError && err.originalError.info && err.originalError.info.message &&
        err.originalError.info.message.indexOf('duplicate') != -1) {
        error = error_helper.getErrorData (error_helper.CODE_TAXID_IN_USE, error_helper.MSG_TAXID_IN_USE);
      } else {
        error = error_helper.getSqlErrorData (err);
      }
      return res.send(error);
    }
    return res.status(200).json({ success: true, data: { scId: scId } });
  });
};

exports.updateSubContractorUserRelations = async function(req, res) {
  if (_.isEmpty(req.body) || !req.body.userId || !req.body.subContractorIds) {
      let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
      return res.send(error);
    }

    const params = {};
    let invalidData = false;


    if(parseInt(req.body.userId) <= 0 || isNaN(req.body.userId)) {
    invalidData = true;
    }

    if(req.body.subContractorIds.length <= 0) {
      invalidData = true
    }

    if(invalidData) {
      let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
      return res.send(error);
    }

    params.relations = Object.assign({}, req.body);
  params.userId = req.currentUser.Id;
  params.eventDescription = req.method + '/' + req.originalUrl;

  subContractors_sql.updateUserRelation(params, function(err, result) {
    if(err) {
      error = error_helper.getSqlErrorData(err);
      return res.send(error);
    }
    return res.status(200).json({ success: true, relationsUpdated: result });
  });
}

// POST Send subcontractor submission
// Save a new SavedForms entry
// Send email with form link (with hash parameter)
// Change SC status to Submission pending
exports.sendSubContractorSubmission = async function(req, res) {

  var invalidData = false;
  var hiringClientId = 0;
  var subcontractorId = 0;
  var formId = 0;
  let params = req.body;

  if (!params) invalidData = true;

  if(invalidData == false){
    hiringClientId = params.hiringClientId;
    subcontractorId = params.subcontractorId;
    formId = params.formId;

    if(!hiringClientId) invalidData = true;
    if(hiringClientId && (parseInt(hiringClientId) <= 0 || isNaN(parseInt(hiringClientId)))) invalidData = true;

    if(!subcontractorId) invalidData = true;
    if(subcontractorId && (parseInt(subcontractorId) <= 0 || isNaN(parseInt(subcontractorId)))) invalidData = true;

    if(!formId) invalidData = true;
    if(formId && (parseInt(formId) <= 0 || isNaN(parseInt(formId)))) invalidData = true;
  }

  if(invalidData){
    let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
     return res.send(error);
  }

  let method = req.method;
  let originalUrl = req.originalUrl;
  params.userId = req.currentUser.Id;
  params.eventDescription = method + '/' + originalUrl;

  //Save SavedForm (submission) entry
  await formsSQL.addSavedForm(params, async function(err, result, savedFormId) {

      var locSavedFormId = savedFormId;
      if(err) {
        error = error_helper.getSqlErrorData(err);
        return res.send(error);
      }

      if(params.id)
        locSavedFormId = params.id;
    //Get Email template
    //Pass workflowTypeId = 2 which means Subcontractor Submission workflow type
    await workflowsSQL.getWFMailTemplate(hiringClientId, 2, async function(err, wfResult) {

      if (err) {
        let error = error_helper.getSqlErrorData(err);
        console.log(err);
        return res.status(500).send(err);
      }

      if (!wfResult) {
        let error = error_helper.getErrorData(error_helper.CODE_WORKFLOW_NOT_FOUND, error_helper.MSG_FORM_NOT_FOUND);
        console.log(err);
        return res.status(500).send(err);
      }

      if(wfResult){

        // Get subcontractor mail and contact name
        await subContractors_sql.getSubContractorContactInfo(subcontractorId, async function(err, subcontractorInfo) {

          // Send invitation emails
          emailParams = {};
          emailParams.templateName = wfResult[0].templateName;
          emailParams.emailOptions = {};
          emailParams.emailOptions.from = wfResult[0].fromAddress;
          emailParams.emailOptions.subject = wfResult[0].subject;
          emailParams.emailOptions.templateId = wfResult[0].id;
          emailParams.emailOptions.html = wfResult[0].bodyHTML;
          emailParams.emailOptions.text = wfResult[0].bodyText;
          emailParams.emailOptions.alreadyLoaded = true;

          emailParams.emailOptions.to = subcontractorInfo[0].mainEmail;
          emailParams.emailOptions.name = subcontractorInfo[0].contactFullName;

          tokenParams = {};
          tokenParams.hiringClientId = hiringClientId;
          tokenParams.subcontractorId = subcontractorId;
          tokenParams.formId = formId;
          tokenParams.userId = req.currentUser.Id;
          tokenParams.savedFormId = savedFormId;
          let hash = hashProvider.createToken(tokenParams);
          emailParams.emailOptions.link = process.env.BACKEND_PROD_URL + ':' + process.env.FRONTEND_PORT + '/form-link/' + hash;
          emailParams.emailOptions.createTask = true;
          emailParams.emailOptions.currentUser = req.currentUser;

          await emailsProcessor.sendEmail(emailParams, function(err, result) {
            if(err) {
              console.log(err);
              return res.status(500).send(err);
            }
          });

          // If email was sent correctly then update status to Pending Submission
          await subContractors_sql.updateHC_SC_StatusById(hiringClientId, subcontractorId, 4, function(err, result) {
            if(err) {
              return res.status(500).send(err);
            }
          });
        });

        return res.status(200).json({ success: true, savedFormId: savedFormId });
      }
    });
  });
}

// GET subcontractor status list
exports.getSubContractorTieRates = async function(req, res) {
  var invalidData = false;

  // Validate subcontractor
  await subContractors_sql.getSubContractorTieRates(async function(err, statusResult) {
    if(err) {
      let error = error_helper.getSqlErrorData(err);
      res.send(error);
    }
    if(!statusResult) {
      let error = error_helper.getErrorData(error_helper.CODE_HIRING_CLIENT_NOT_FOUND, error_helper.MSG_HIRING_CLIENT_NOT_FOUND);
         return res.send(error);
    }

    return res.status(200).json({ success: true, subcontratorTieRates: statusResult });
  });
}


// GET subcontractor status list
exports.getSubcontractorsStatus = async function(req, res) {
  var invalidData = false;

  let hcId = req.body.hcId

  // Validate subcontractor
  await subContractors_sql.getSubcontractorsStatus(async function(err, subcontratorStatus) {
    if(err) {
      let error = error_helper.getSqlErrorData(err);
      res.send(error);
    }
    if(!subcontratorStatus) {
      let error = error_helper.getErrorData(error_helper.CODE_HIRING_CLIENT_NOT_FOUND, error_helper.MSG_HIRING_CLIENT_NOT_FOUND);
         return res.send(error);
    }

    return res.status(200).json({ success: true, subcontratorStatus });
  });
}

// POST hcId in order to get sub status list with counts
exports.getSubcontractorsStatusWithCounts = async function(req, res) {
  var invalidData = false;

  let hcId = req.body.hcId

  if(hcId && (parseInt(hcId) <= 0 || isNaN(parseInt(hcId)))) invalidData = true;

  if(invalidData){
    let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
       return res.send(error);
  }

  // Validate subcontractor
  await subContractors_sql.getSubcontractorsStatusWithCounts(hcId, async function(err, subcontratorStatusWithCounts) {
    if(err) {
      let error = error_helper.getSqlErrorData(err);
      res.send(error);
    }
    if(!subcontratorStatusWithCounts) {
      let error = error_helper.getErrorData(error_helper.CODE_HIRING_CLIENT_NOT_FOUND, error_helper.MSG_HIRING_CLIENT_NOT_FOUND);
         return res.send(error);
    }

    return res.status(200).json({ success: true, subcontratorStatusWithCounts });
  });
}

// GET hiringclients by subcontractor
exports.getHiringClientsBySubContractor = async function(req, res) {
  var invalidData = false;
  var params = req.query;

  if(!params)
    invalidData = true;

  if(!params.subcontractorId)
    invalidData = true;

  if(params.subcontractorId && (parseInt(params.subcontractorId) <= 0 || isNaN(parseInt(params.subcontractorId)))) invalidData = true;

  if(invalidData){
    let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
       return res.send(error);
  }

  let subcontractorId = params.subcontractorId;

  // Validate subcontractor
  await subContractors_sql.getHiringClientsBySubContractor(subcontractorId, req.currentUser.Id, async function(err, hiringClientsResult) {
    if(err) {
      let error = error_helper.getSqlErrorData(err);
      res.send(error);
    }
    if(!hiringClientsResult) {
      let error = error_helper.getErrorData(error_helper.CODE_HIRING_CLIENT_NOT_FOUND, error_helper.MSG_HIRING_CLIENT_NOT_FOUND);
         return res.send(error);
    }

    return res.status(200).json({ success: true, hiringClients: hiringClientsResult });
  });
}

// GET Subcontractor submission by hash parameter
exports.getSubContractorSubmission = async function(req, res) {
  var invalidData = false;
  var params = req.query;

  // Uncomment this code to test
  /*
  params.hiringClientId = 1;
  params.subcontractorId = 2;
  params.formId = 72;
  params.userId = 2;
  params.savedFormId = 27;
  params.timsStamp = '2018-03-12T15:38:25.593Z';

  let hash = hashProvider.createToken(params);
  console.log('hash:');
  console.log(hash);
  */

  if(!params)
    invalidData = true;

  if(!params.submissionCode)
    invalidData = true;

  if(invalidData){
    let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
       return res.send(error);
  }

  try {
    encodedParams = hashProvider.parseToken(params.submissionCode);
  }
  catch(err) {
    console.log(err);
    let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
       return res.send(error);
  }

  // Validate subcontractor
  await formsSQL.validateSavedForm(encodedParams, async function(err, formValidationResult) {

    if(!formValidationResult) {
      let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
         return res.status(500).send(error);
    }

    if( formValidationResult[0].found > 0)
      return res.status(200).json({ success: true, savedFormId: encodedParams.savedFormId, subcontractorId: encodedParams.subcontractorId });
    else
      return res.status(200).json({ success: false, savedFormId: null });
  });
}

exports.getSubContractorBrief = async function(req, res) {
  let invalidData = false;
  let query = req.query;
  let hiringClientId;
  let subcontractorId;

  if(!query) {
      invalidData = true;
  }
  else {
    hiringClientId = query.hiringClientId;
    if(hiringClientId && (parseInt(hiringClientId) <= 0 || isNaN(parseInt(hiringClientId)))) invalidData = true;
  }

  if(invalidData){
    let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
     return res.send(error);
  }

  await subContractors_sql.getSubContractorBrief(hiringClientId, function(err, result) {
    if (err) {
      console.log(err);
      error = error_helper.getSqlErrorData(err);
      return res.status(500).send(error);
    }
    return res.status(200).json({ success: true, data: result });
  });
};

exports.getFirstSubcontractorForUser = async function (user) {
  const params = {
      method: 'userId',
      pageNumber: 1,
      pageSize: 1,
      roleId: user.RoleID,
      userId: user.Id
  };

  let subcontractor;

  await subContractors_sql.getSubContractors(params, function (err, result) {
      if (err) {
          error = error_helper.getSqlErrorData(err);
      }

      if (!result) {
          error = error_helper.getErrorData(error_helper.CODE_HIRING_CLIENT_NOT_FOUND, error_helper.MSG_HIRING_CLIENT_NOT_FOUND);
          console.log(error);
          return error;
      }

      subcontractor = result.shift();
  });

  return subcontractor;
};


exports.getSubContractorInviteValues = async function(req, res) {
  let query = req.query;
  let hash = null;
  let invalidData = false;

  if(!query) {
    invalidData = true;
  }
  else {
    hash = query.inviteCode;
    if(!hash) {
      invalidData = true;
    }
  }

  try {
    encodedParams = hashProvider.parseToken(hash);
  }
  catch(err) {
    console.log(err);
    invalidData = true;
  }

  if(invalidData){
    let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    console.log(error);
       return res.status(200).send(error);
  }

  await subContractors_sql.getSubContractorInviteValues(encodedParams, function (err, resultData) {
      if (err) {
          error = error_helper.getSqlErrorData(err);
      }

      return res.status(200).json({ success: true, data: resultData });
  });
}

exports.searchSubcontractors = async function(req, res) {
  let   invalidData = false;
  const {
    pageNumber,
    searchTerm,
    orderDirection,
    orderBy,
    pageSize
  }  = req.body

  if (
    orderBy != 'hcName' &&
    orderBy != 'scName' &&
    orderBy != 'status' &&
    orderBy != 'state'
  ) {
    invalidData = true;
  }


  if(!searchTerm) invalidData = true;
  invalidData = orderDirection == 'ASC' ? false : (orderDirection == 'DESC' ? false : true);
  if(pageNumber && (parseInt(pageNumber) < 0 || isNaN(parseInt(pageNumber)))) invalidData = true;
  if(pageSize && (parseInt(pageSize) < 0 || isNaN(parseInt(pageSize)))) invalidData = true;

  if(invalidData){
    const error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    console.log(error);
       return res.status(200).send(error);
  }

  const params = req.body

  // Validate subcontractor
  await subContractors_sql.searchSubcontractors(params, async function(err, subcontratorSearchResult, totalRowsCount) {
    if(err) {
      const error = error_helper.getSqlErrorData(err);
      res.send(error);
    }
    if(!subcontratorSearchResult) {
      const error = error_helper.getErrorData(error_helper.CODE_HIRING_CLIENT_NOT_FOUND, error_helper.MSG_HIRING_CLIENT_NOT_FOUND);
         return res.send(error);
    }

    const data = {
      subcontratorSearchResult,
      totalRowsCount
    }

    return res.status(200).json({ success: true, data });
  });
}

exports.updateSCname = async (req, res) => {
  const body = req.body;
  let invalidData = false;
  let {
    scId,
    subName
  } = body

    body.subName = addDoubleQuotes(subName)

  if(!body) {
    invalidData = true;
  } else {


    if(!scId) invalidData = true;
    if(!subName) invalidData = true;
  }

  if(invalidData){
    const error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    console.log(error);
       return res.status(500).send(error);
  }

try {
    const logParams = {};
    logParams.userId = req.currentUser.Id;
    logParams.eventDescription = req.method + '/' + req.originalUrl;

    await subContractors_sql.updateSubcontractortName(body, logParams, async function (err) {

      if (err) {
          console.log(err);
          error = error_helper.getSqlErrorData(err);
          return res.status(500).send(error);
      }
    });

    return res.status(200).json({ success: true });
  }
  catch(err) {
    console.log('err in /api = ', err)
    return res.status(500).send(err);
  }
}


exports.updateHCofficeLocation = async function(req, res) {
  const body = req.body;
  let invalidData = false;
  let {
    subcontractorId,
    hiringClientId,
    location
  } = body
  body.location = addDoubleQuotes(location)

  subcontractorId = Number(subcontractorId)

  if(!body) {
    invalidData = true;
  } else {


    if(!subcontractorId) invalidData = true;
    if(!hiringClientId) invalidData = true;
    if(!location) invalidData = true;
  }

  if(invalidData){
    const error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    console.log(error);
       return res.status(500).send(error);
  }

try {
    const logParams = {};
    logParams.userId = req.currentUser.Id;
    logParams.eventDescription = req.method + '/' + req.originalUrl;



    await subContractors_sql.updateHCofficeLocation(body, logParams, async function (err) {

      if (err) {
          console.log(err);
          error = error_helper.getSqlErrorData(err);
          return res.status(500).send(error);
      }
    });

    return res.status(200).json({ success: true });
  }
  catch(err) {
    console.log('err in /api = ', err)
    return res.status(500).send(err);
  }
}


exports.setSCTieRate = async function(req, res) {
  let body = req.body;
  let invalidData = false;

  const {
    subcontractorId,
    hcId,
    tierRatingId
  } = body

  if(!body) {
    invalidData = true;
  } else {


    if(!subcontractorId) invalidData = true;
    if(!hcId) invalidData = true;
    if(!tierRatingId) invalidData = true;

    if(subcontractorId && (parseInt(subcontractorId) < 0 || isNaN(parseInt(subcontractorId)))) invalidData = true;
    if(tierRatingId && (parseInt(tierRatingId) < 0 || isNaN(parseInt(tierRatingId)))) invalidData = true;
    if(hcId && (parseInt(hcId) < 0 || isNaN(parseInt(hcId)))) invalidData = true;
  }

  if(invalidData){
    let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    console.log(error);
       return res.status(500).send(error);
  }

try {
    let logParams = {};
    logParams.userId = req.currentUser.Id;
    logParams.eventDescription = req.method + '/' + req.originalUrl;



    await subContractors_sql.setSCTieRate(body, logParams, async function (err) {

      if (err) {
          console.log(err);
          error = error_helper.getSqlErrorData(err);
          return res.status(500).send(error);
      }
    });

    return res.status(200).json({ success: true });
  }
  catch(err) {
    console.log('err in /api = ', err)
    return res.status(500).send(err);
  }
}

exports.updateBasicSCData = async function(req, res) {
  let body = req.body;
  let invalidData = false;
  let subcontractorId = null;

  if(!body) {
    invalidData = true;
  }
  else {
    let subcontractorId = body.subcontractorId;
    let contactEmail = body.contactEmail;
    let contactPhone = body.contactPhone;
    let contactFullName = body.contactFullName;
    if(!subcontractorId)  invalidData = true;
    if(!contactEmail)  invalidData = true;
    if(!contactPhone)  invalidData = true;
    if(!contactFullName)  invalidData = true;
    if(subcontractorId && (parseInt(subcontractorId) < 0 || isNaN(parseInt(subcontractorId)))) invalidData = true;
  }

  if(invalidData){
    let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    console.log(error);
       return res.status(200).send(error);
  }

  const logParams = {};
  logParams.userId = req.currentUser.Id;
  logParams.eventDescription = req.method + '/' + req.originalUrl;

  await subContractors_sql.updateBasicSCData(body, logParams, async function (err) {
      if (err) {
          console.log(err);
          error = error_helper.getSqlErrorData(err);
          return res.status(500).send(error);
      }
  });

  return res.status(200).json({ success: true});
}

exports.registerSC = async function(req, res) {
  const body = req.body;
  let subcontractor = null;
  let user = null;
  let invalidData = false;

  if(!body) {
    invalidData = true;
  }
  else {
    // Check main objects
    subcontractor = body.subcontractor;
    user = body.user;
    if(!subcontractor) {
      invalidData = true;
    }
    if(!user) {
      invalidData = true;
    }
  }

  if(!invalidData) {
    // check SC
    const subcontractorId = subcontractor.id
    if(!subcontractorId) invalidData = true;
    if(subcontractorId && (parseInt(subcontractorId) < 0 || isNaN(parseInt(subcontractorId)))) invalidData = true;

    const hiringClientId = subcontractor.hiringClientId
    if(!hiringClientId) invalidData = true;
    if(hiringClientId && (parseInt(hiringClientId) < 0 || isNaN(parseInt(hiringClientId)))) invalidData = true;

    const tradeId = subcontractor.tradeId;
    if(tradeId && (parseInt(tradeId) < 0 || isNaN(parseInt(tradeId)))) invalidData = true;

    const secTradeId = subcontractor.secTradeId;
    if(secTradeId && (parseInt(secTradeId) < 0 || isNaN(parseInt(secTradeId)))) invalidData = true;

    const terTradeId = subcontractor.terTradeId;
    if(terTradeId && (parseInt(terTradeId) < 0 || isNaN(parseInt(terTradeId)))) invalidData = true;

    const quatTradeId = subcontractor.quatTradeId;
    if(quatTradeId && (parseInt(quatTradeId) < 0 || isNaN(parseInt(quatTradeId)))) invalidData = true;

    const quinTradeId = subcontractor.quinTradeId;
    if(quinTradeId && (parseInt(quinTradeId) < 0 || isNaN(parseInt(quinTradeId)))) invalidData = true;
    // check user
    const titleId = user.titleId;
    if(titleId && (parseInt(titleId) < 0 || isNaN(parseInt(titleId)))) invalidData = true;

    const countryId = subcontractor.countryId;
    if(countryId && (parseInt(countryId) < 0 || isNaN(parseInt(countryId)))) invalidData = true;
  }

  if(invalidData){
    const error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    console.log(error);
       return res.status(200).send(error);
  }

  const logParams = {};
  logParams.userId = req.currentUser.Id;
  logParams.eventDescription = req.method + '/' + req.originalUrl;

  try {
    await subContractors_sql.registerSC(subcontractor, user, logParams, async function (err, subAlreadyExists) {
        if (err) {
            console.log(err);
            const error = error_helper.getSqlErrorData(err);
            return res.status(500).send(error);
        }

        return res.status(200).json({ success: true, subAlreadyExists });
    });

  }
  catch(err) {
    console.log(err)
    return res.status(500).send(err);
  }
}

// GET Subcontractor submission link with its hash
exports.getSubContractorSubmissionLink = async function(req, res) {
  var invalidData = false;
  let subcontractorId;
  let hiringClientId;
  let query = req.query;

  if(!query) {
    invalidData = true;
  }
  else {
    subcontractorId = query.subcontractorId;
    hiringClientId = query.hiringClientId;
    if(subcontractorId && (parseInt(subcontractorId) <= 0 || isNaN(parseInt(subcontractorId)))) invalidData = true;
    if(hiringClientId && (parseInt(hiringClientId) <= 0 || isNaN(parseInt(hiringClientId)))) invalidData = true;
  }

  if(invalidData){
    let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
       return res.send(error);
  }

  // Validate subcontractor
  await subContractors_sql.getSubContractorSubmissionLink(hiringClientId, subcontractorId, async function(err, linkResult) {
    if(err) {
      let error = error_helper.getSqlErrorData(err);
      res.send(error);
    }

    let pendingSubmissions = linkResult.recordset;
    let link = null;

    if(pendingSubmissions.length > 0) {
      let savedFormId = pendingSubmissions[0].id;
      let formId = pendingSubmissions[0].formId;
      let userId = req.currentUser.Id;

      tokenParams = {};
      tokenParams.hiringClientId = hiringClientId;
      tokenParams.subcontractorId = subcontractorId;
      tokenParams.formId = formId;
      tokenParams.userId = userId;
      tokenParams.savedFormId = savedFormId;
      let hash = await hashProvider.createToken(tokenParams);
      link = process.env.BACKEND_PROD_URL + ':' + process.env.FRONTEND_PORT + '/form-link/' + hash;
    }

    return res.status(200).json({ success: true, link: link });
  });
}

exports.getSubContractorsLocations = async function(req, res) {
	const data = {};
	let invalidData = false;
	let query = req.query;

	if(!query) {
		invalidData = true;
	}
	else {
		if(query.subcontractorId && (parseInt(query.subcontractorId) <= 0 || isNaN(parseInt(query.subcontractorId)))) invalidData = true;
		if(query.pageNumber && (parseInt(query.pageNumber) <= 0 || isNaN(parseInt(query.pageNumber)))) invalidData = true;
		if(query.pageSize && (parseInt(query.pageSize) <= 0 || isNaN(parseInt(query.pageSize)))) invalidData = true;
		if(query.orderBy) {
      if ( query.orderBy != 'Address'         &&
           query.orderBy != 'City'            &&
           query.orderBy != 'State'           &&
           query.orderBy != 'ZipCode'         &&
           query.orderBy != 'CountryID'       &&
           query.orderBy != 'ContactName'     &&
           query.orderBy != 'ContactEmail'    &&
           query.orderBy != 'Phone'           &&
           query.orderBy != 'Fax'             &&
           query.orderBy != 'Comments'        &&
           query.orderBy != 'Primary'         &&
           query.orderBy != 'Active') invalidData = true;
    }

    if (query.orderBy == 'ContactName') {
      query.orderBy = '[Contact Name]'
    }
    if (query.orderBy == 'ContactEmail') {
      query.orderBy = '[Contact Email]'
    }
    if (query.orderBy == 'Primary') {
      query.orderBy = 'PrimaryLocation'
    }

		if(query.orderDirection)
			if(query.orderDirection != 'ASC' &&
			   query.orderDirection != 'DESC') query.orderDirection = 'ASC'
	}

	if(invalidData) {
		let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	subContractors_sql.getSubContractorsLocations(query, function(err, result, totalCount) {
		if (err) {
			const error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		if (!result) {
			const error = error_helper.getErrorData(error_helper.CODE_SUBCONTRACTOR_LOCATIONS_NOT_FOUND, error_helper.MSG_SUBCONTRACTOR_LOCATIONS_NOT_FOUND);
			return res.send(error);
		}

		data.totalCount = totalCount;
    data.locations = result;

		return res.status(200).json({ success: true, data: data });
	});
}

exports.getSubContractorsStatesAndCountries = async function(req, res) {
  const data = {};
	subContractors_sql.getSubContractorsStatesAndCountries((err, states, provAndTerr, countries) => {
		if (err) {
			const error = error_helper.getSqlErrorData(err);
			return res.send(error);
    }


		data.provAndTerr = provAndTerr;
		data.states      = states;
		data.countries   = countries;

		return res.status(200).json({ success: true, data: data });
	});
}

exports.createOrUpdateSubContractorLocation = async (req, res) => {
  let   invalidData = false;
  const body        = req.body;
  // writeLog(req.body)

  const LocationId = body.LocationId ? Number(body.LocationId) : null
	const Primary    = body.Primary    ? Number(body.Primary)    : null
	const Active     = body.Active     ? Number(body.Active)     : null


	if (!body) {
		invalidData = true;
	} else {
		if(!body.Address) invalidData = true;
    if(!body.City) invalidData = true;
    if(body.CountryID == 1 && !body.State) invalidData = true;
    if(!body.ZipCode) invalidData = true;
    if(!body.CountryID) invalidData = true;

		if(LocationId && (LocationId <= 0 || isNaN(LocationId))) invalidData = true;
		if(Primary && (Primary <= 0 || isNaN(Primary))) invalidData = true;
		if(Active && (Active <= 0 || isNaN(Active))) invalidData = true;
  }

  // console.log('POST/PUT LOCATION '.repeat(10))

  // console.log('invalidData = ', invalidData)
  // console.log('body = ', body)
  // console.log('req.method = ', req.method)

	if(invalidData) {
		const error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
  	return res.send(error);
	}

  const params = body
  params.eventDescription = req.method + '/' + req.originalUrl;

	await subContractors_sql.createOrUpdateLocation(params, (err, result, locationId) => {
		if (err) {
			const error = error_helper.getSqlErrorData(err);
			return res.send(error);
		} else {
      return res.status(200).json( { success: true, data: { locationId } });
    }
	});
}

exports.deleteSubContractorLocation = async (req, res) => {
  let   invalidData = false;
  const body        = req.body;

  const id = body.id ? Number(body.id) : null
  const params = body

	if (!body || !id) {
		invalidData = true;
	}

  // console.log('DELETE LOCATION '.repeat(10))

  // console.log('invalidData = ', invalidData)
  // console.log('body = ', body)

	if(invalidData) {
		const error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
  	return res.send(error);
	}

  params.eventDescription = req.method + '/' + req.originalUrl;

	await subContractors_sql.deleteSubContractorLocation(params, (err) => {
		if (err) {
			const error = error_helper.getSqlErrorData(err);
			return res.send(error);
		} else {
      return res.status(200).json( { success: true });
    }
	});
}

exports.checkMailExists = async (req, res) => {
  let   invalidData = false;
  const params = req.query;
  if (!params || !isEmailValid(params.email))
    invalidData = true;

	if(invalidData) {
		const error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
  	return res.send(error);
	}
	let email = params.email;
	await subContractors_sql.checkMailExists(email, (err, result) => {
		if (err) {
			const error = error_helper.getSqlErrorData(err);
			return res.send(error);
		} else {
      return res.status(200).json( {
        success: true,
        emailExists: result
      });
    }
	});
}

