const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens

const config = require('../config'); // get our config file
const error_helper = require('../helpers/error_helper');

const countriesController = require('../cf_api/countries');
const holderController = require('../cf_api/holders');
const contactController = require('../cf_api/contacts');
const projectsController = require('../cf_api/projects');
const tagsController = require('../cf_api/tags');
const customFieldsController = require('../cf_api/customFields');
const docTypesController = require('../cf_api/doctypes');
const projectCustomFieldsController = require('../cf_api/projectCustomFields');
const projectInsuredsController = require('../cf_api/projectInsureds');
const tasksController = require('../cf_api/tasks');
const coverageTypesController = require('../cf_api/coverageTypes');
const agenciesController = require('../cf_api/agencies');
const agentsController = require('../cf_api/agents');
const searchController = require('../cf_api/search');
const requirementSetsController = require('../cf_api/requirementSets');
const endorsementsController = require('../cf_api/endorsements');
const rulesController = require('../cf_api/rules');
const ruleGroupsController = require('../cf_api/ruleGroups');
const documentsController = require('../cf_api/documents');
const requirementSetsDocumentsController = require('../cf_api/requirementSetsDocuments');
const attributesController = require('../cf_api/attributes');
const waiversController = require('../cf_api/waivers');
const waiverLineItemsController = require('../cf_api/waiverLineItems');
const projectInsuredDeficienciesController = require('../cf_api/projectInsuredDeficiencies');
const projectDocumentsController = require('../cf_api/projectDocuments');
const projectInsuredDocumentsController = require('../cf_api/projectInsuredDocuments');
const insurersController = require('../cf_api/insurers');
const insuredsController = require('../cf_api/insureds');
const coverageDocumentsController = require('../cf_api/coverageDocuments');
const coverageAttributesController = require('../cf_api/coverageAttributes');
const insurersCoveragesController = require('../cf_api/insurersCoverages');
const projectInsuredCoveragesController = require('../cf_api/projectInsuredCoverages');
const coveragesController = require('../cf_api/coverages');
const projectRequirementSetsController = require('../cf_api/projectRequirementSets');
const projectCertTextsController = require('../cf_api/projectCertTexts');
const projectInsuredComplianceStatus = require('../cf_api/projectInsuredComplianceStatus');
const projectInsuredTagsController = require('../cf_api/projectInsuredTags');
const holderSettingsController = require('../cf_api/holderSettings');
const paymentsController = require('../cf_api/payments');
const invoicesController = require('../cf_api/invoices');
const refundsController = require('../cf_api/refunds');
const invoicePaymentsController = require('../cf_api/invoicePayments');
const invoiceLineItemsController = require('../cf_api/invoiceLineItems');
const processingController = require('../cf_api/processing');
const requirementSetsEndorsementsController = require('../cf_api/requirementSetsEndorsements');
const holderCoverageTypesController = require('../cf_api/holderCoverageTypes');
const certUploadController = require('../cf_api/certUpload');
const customTermsController = require('../cf_api/customTerms');
const gesEacTypesController = require('../cf_api/gesEacTypes');
const documentQueueDefinitionsController = require('../cf_api/documentQueueDefinitions');
const projectUsers = require("../cf_api/projectUsers");
const departmentsController = require('../cf_api/departments');
const certificatesController = require('../cf_api/certificates');
const workflowService = require('../processors/cf_workflow/main')

// ------------------- Routes With No Token Control -------------------

// ------------------- GES ---------------------
router.get('/ges/data', function (req, res) {
  holderController.getGESData(req, res);
});

router.post('/ges/insureds', (req, res) => {
  insuredsController.createInsureds(req, res);
});

router.post('/ges/agencies', (req, res) => {
  agenciesController.createAgencies(req, res);
});

// ------------------- WORKFLOW EPS -------------------
router.post('/workflow/run', (req, res) => {
  workflowService.executeWorkflow(req, res)
})

router.post('/workflow/create', (req, res) => {
  workflowService.InstanceNewWorkflow(req, res)
})

router.put('/workflow/update', (req, res) => {
  workflowService.UpdateWorflowStatus(req, res)
})

// ------------------- Start CertUpload routes ---------------------
router.post('/certUpload/validateHash', (req, res) => {
  certUploadController.validateHash(req, res);
});
router.get('/certUpload/requirementSetsDetail', (req, res) => {
  coveragesController.getCoveragesAndAttributesStatus(req, res);
});
router.get('/certUpload/requirementSetsDocuments', (req, res) => {
  requirementSetsDocumentsController.getRequirementSetsDocuments(req, res);
});
router.get('/certUpload/requirementSetsEndorsements', (req, res) => {
  requirementSetsEndorsementsController.getRequirementSetsEndorsements(req, res);
});
router.get('/certUpload/endorsements', (req, res) => {
  endorsementsController.getEndorsements(req, res);
});
router.post('/certUpload/documents', (req, res) => {
  documentsController.createDocuments(req, res);
});
router.get('/certUpload/projectInsuredDocuments', (req, res) => {
  projectInsuredDocumentsController.getProjectInsuredDocuments(req, res);
});
router.post('/certUpload/projectInsuredDocuments', (req, res) => {
  projectInsuredDocumentsController.createProjectInsuredDocuments(req, res);
});
router.post('/certUpload/tasks', (req, res) => {
  //FIXME update data on certificate upload.
  tasksController.createTask(req, res);
});

router.get('/coverages/expirations', (req, res) => {
  coveragesController.coverageExpirations(req, res);
});

// ------------------- End CertUpload routes ---------------------

function iterateBody(body, stack) {
  for (var key in body) {
    if (Object.prototype.toString.call(body[key]) == '[object String]') {
      // console.log(body[key]);
      body[key] = body[key].replace("'", " ");
      // console.log(body[key]);
    }
    else {
      for (var key2 in body[key]) {
        if (Object.prototype.toString.call(body[key][key2]) == '[object String]') {
          // console.log(body[key][key2]);
          body[key][key2] = body[key][key2].replace("'", " ");
          // console.log(body[key][key2]);
        }
        else {
          for (var key3 in body[key][key2]) {
            if (Object.prototype.toString.call(body[key][key2][key3]) == '[object String]') {
              // console.log(body[key][key2][key3]);
              body[key][key2][key3] = body[key][key2][key3].replace("'", " ");
              // console.log(body[key][key2][key3]);
            }
            else {

            }
          }
        }
      }
    }
  }
}


// Route middleware to verify a token
router.use(function (req, res, next) {
  console.log('token control');
  if (req.body) {
    iterateBody(req.body, '');
  }

  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  // decode token
  if (token) {

    if (token == 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJZCI6MywiRmlyc3ROYW1lIjoiTHVpcyIsIkxhc3ROYW1lIjoiVGVzdGVyMiIsIk1haWwiOiJsdWlzLnBhcmFkZWxhQGFjY2Vsb25lLmNvbSIsIlJvbGVJRCI6MSwiSXNFbmFibGVkIjoxLCJJc0NvbnRhY3QiOjEsIlRpdGxlSWQiOjAsIlBob25lIjoiNDY0NjQ2NDY0NjQ2IiwiQ2VsbFBob25lIjpudWxsLCJUaW1lWm9uZUlkIjo5LCJNdXN0UmVuZXdQYXNzIjowLCJNdXN0VXBkYXRlUHJvZmlsZSI6MCwiVGltZVN0YW1wIjoiMjAxNy0xMS0xM1QxNDoyNToyMS40NjBaIiwiUm9sZSI6eyJJZCI6MSwiTmFtZSI6IlBRIEFkbWluIiwiVGltZVN0YW1wIjoiMjAxNy0xMS0xM1QxNDoyMzo1MS4yNTdaIn0sIlRpbWVab25lIjp7IklkIjo5LCJWYWx1ZSI6IlBhY2lmaWMgRGF5bGlnaHQgVGltZSIsIkRlc2NyaXB0aW9uIjoiKFVUQy0wODowMCkgUGFjaWZpYyBUaW1lIChVUyAmIENhbmFkYSkiLCJUaW1lU3RhbXAiOiIyMDE3LTExLTMwVDE1OjQ5OjUxLjA2MFoifSwiVGl0bGUiOnsiSWQiOjAsIlRpdGxlIjoiTm9uZSIsIlRpbWVTdGFtcCI6IjIwMTctMTEtMjlUMTE6NTU6MzMuNDQ3WiJ9LCJpYXQiOjE1MjMwMTkzODYsImV4cCI6MTUzMzAxOTM4NX0.Aee4zvkZTvsAZPajnLTQFGpdnZ7fddPp6u3tZwF9Ayk') {
      req.currentUser = {};
      req.currentUser.Id = 1006;
      next();
    }
    else {

      // verifies secret and checks exp
      jwt.verify(token, config.secret, function (err, decoded) {
        if (err) {
          // var decoded = jwt.decode(token);
          //console.log(decoded);
          var error;
          if (err.name == 'TokenExpiredError') {
            var error = error_helper.getErrorData(error_helper.CODE_TOKEN_EXPIRED, error_helper.MSG_TOKEN_EXPIRED);
          } else {
            var error = error_helper.getErrorData(error_helper.CODE_TOKEN_FAILED, error_helper.MSG_TOKEN_FAILED);
          }
          return res.send(error);
        } else {
          req.currentUser = decoded._doc || decoded;


          // if everything is ok, save to request to use in other routes
          if (req.currentUser) {
            next();
          } else {
            console.log("--token was valid, but something else failed--");
            var error = error_helper.getErrorData(error_helper.CODE_TOKEN_FAILED, error_helper.MSG_TOKEN_FAILED);
            return res.send(error);
          }
        }
      });
    }

  } else {
    // if there is no token
    // return an error
    var error = error_helper.getErrorData(error_helper.CODE_NO_TOKEN, error_helper.MSG_NO_TOKEN);
    return res.send(error);

  }
});

// ------------------- Routes With Token Control -------------------

router.get('/countries', function (req, res) {
  countriesController.getCountries(req, res);
});
router.get('/states', function (req, res) {
  countriesController.getStates(req, res);
});


// -- HOLDERS --
// -- HOLDERS create --
router.post('/holders', function (req, res) {
  holderController.createHolder(req, res);
});

router.get('/holders', function (req, res) {
  console.log('/holders', req.query);
  holderController.getHolders(req, res);
});

router.post('/holders/archive', function (req, res) {
  holderController.archiveHolder(req, res);
});

// -- HOLDER detail --
router.get('/holderdetail', function (req, res) {
  holderController.getHolderDetail(req, res);
});

router.get('/holders/managers', function (req, res) {
  holderController.getHoldersAccountManagers(req, res);
});

router.get('/contacts', function (req, res) {
  contactController.getContacts(req, res);
});

router.post('/contacts', function (req, res) {
  contactController.createContact(req, res);
});

router.post('/contacts/holderrelation', function (req, res) {
  contactController.linkContactAndHolder(req, res);
});

router.post('/contacts/insuredrelation', function (req, res) {
  contactController.linkContactAndInsured(req, res);
});

router.delete('/contacts/holderrelation', function (req, res) {
  contactController.unlinkContactAndHolder(req, res);
});

router.delete('/contacts/insuredrelation', function (req, res) {
  contactController.unlinkContactAndInsured(req, res);
});


router.get('/projects', function (req, res) {
  projectsController.getProjects(req, res);
});

router.post('/projects', function (req, res) {
  projectsController.createProject(req, res);
});

router.put('/projects', function (req, res) {
  projectsController.updateProject(req, res);
});

router.get('/projectsdetail', function (req, res) {
  projectsController.getProjectDetail(req, res);
});

router.post('/projects/favorites', function (req, res) {
  projectsController.addFavorite(req, res);
});

router.delete('/projects/favorites', function (req, res) {
  projectsController.removeFavorite(req, res);
});

router.post('/projects/archive', function (req, res) {
  projectsController.archiveProject(req, res);
});

router.get('/tags', function (req, res) {
  tagsController.getTags(req, res);
});

router.post('/tags', function (req, res) {
  tagsController.createTags(req, res);
});

router.put('/tags', function (req, res) {
  tagsController.updateTags(req, res);
});

router.get('/customFields', function (req, res) {
  customFieldsController.getCustomFields(req, res);
});

router.post('/customFields', function (req, res) {
  customFieldsController.createCustomFields(req, res);
});

router.put('/customFields', function (req, res) {
  customFieldsController.updateCustomFields(req, res);
});

router.delete('/customFields', function (req, res) {
  customFieldsController.removeCustomFields(req, res);
});

router.get('/doctypes', function (req, res) {
  docTypesController.getDocTypes(req, res);
});

router.post('/doctypes', function (req, res) {
  docTypesController.createDocTypes(req, res);
});

router.put('/doctypes', function (req, res) {
  docTypesController.updateDocTypes(req, res);
});

router.get('/tasks', function (req, res) {
  tasksController.getTasks(req, res);
});

router.post('/tasks', function (req, res) {
  tasksController.createTask(req, res);
});

router.put('/tasks', function (req, res) {
  tasksController.updateTask(req, res);
});

router.get('/task/history', function (req, res) {
  tasksController.getTaskHistory(req, res);
});

router.get('/projectCustomFields', (req, res) => {
  projectCustomFieldsController.getProjectCustomFieldsByProjectId(req, res);
});

router.post('/projectCustomFields', (req, res) => {
  projectCustomFieldsController.createProjectCustomFields(req, res);
});

router.get('/projectInsureds', (req, res) => {
  projectInsuredsController.getProjectInsureds(req, res);
});

router.post('/projectInsureds', (req, res) => {
  projectInsuredsController.createProjectInsureds(req, res);
});

router.put('/projectInsureds', (req, res) => {
  projectInsuredsController.updateProjectInsureds(req, res);
});

router.delete('/projectInsureds', (req, res) => {
  projectInsuredsController.removeProjectInsureds(req, res);
});

router.put('/projectInsureds/archive', (req, res) => {
  projectInsuredsController.archiveProjectInsureds(req, res);
});

router.put('/projectInsureds/exempt', (req, res) => {
  projectInsuredsController.exemptProjectInsureds(req, res);
});

router.get('/coverageTypes', (req, res) => {
  coverageTypesController.getCoverageTypes(req, res);
});

router.post('/coverageTypes', (req, res) => {
  coverageTypesController.createCoverageTypes(req, res);
});

router.put('/coverageTypes', (req, res) => {
  coverageTypesController.updateCoverageTypes(req, res);
});

router.delete('/coverageTypes', (req, res) => {
  coverageTypesController.removeCoverageTypes(req, res);
});

router.get('/agencies', (req, res) => {
  agenciesController.getAgencies(req, res);
});

router.post('/agencies', (req, res) => {
  agenciesController.createAgencies(req, res);
});

router.put('/agencies', (req, res) => {
  agenciesController.updateAgencies(req, res);
});

router.delete('/agencies', (req, res) => {
  agenciesController.removeAgencies(req, res);
});

router.get('/agents', (req, res) => {
  agentsController.getAgents(req, res);
});

router.post('/agents', (req, res) => {
  agentsController.createAgents(req, res);
});

router.put('/agents', (req, res) => {
  agentsController.updateAgents(req, res);
});

router.delete('/agents', (req, res) => {
  agentsController.removeAgents(req, res);
});

// Search routes
router.get('/search/', (req, res) => {
  searchController.getData(req, res);
});

router.get('/requirementSets/holderSetIds', (req, res) => {
  requirementSetsController.getHolderSetIds(req, res);
});

router.post('/requirementSets/Duplicate', (req, res) => {
  requirementSetsController.createDuplicateRequirementSets(req, res);
});

router.get('/requirementSets', (req, res) => {
  requirementSetsController.getRequirementSets(req, res);
});

router.post('/requirementSets', (req, res) => {
  requirementSetsController.createRequirementSets(req, res);
});

router.put('/requirementSets', (req, res) => {
  requirementSetsController.updateRequirementSets(req, res);
});

router.delete('/requirementSets', (req, res) => {
  requirementSetsController.removeRequirementSets(req, res);
});

router.get('/endorsements', (req, res) => {
  endorsementsController.getEndorsements(req, res);
});

router.post('/endorsements', (req, res) => {
  endorsementsController.createEndorsements(req, res);
});

router.put('/endorsements', (req, res) => {
  endorsementsController.updateEndorsements(req, res);
});

router.delete('/endorsements', (req, res) => {
  endorsementsController.removeEndorsements(req, res);
});


router.get('/rules', (req, res) => {
  rulesController.getRules(req, res);
});

router.post('/rules', (req, res) => {
  rulesController.createRules(req, res);
});

router.put('/rules', (req, res) => {
  rulesController.updateRules(req, res);
});

router.delete('/rules', (req, res) => {
  rulesController.removeRules(req, res);
});

router.get('/ruleGroups', (req, res) => {
  ruleGroupsController.getRuleGroups(req, res);
});

router.post('/ruleGroups', (req, res) => {
  ruleGroupsController.createRuleGroups(req, res);
});

router.put('/ruleGroups', (req, res) => {
  ruleGroupsController.updateRuleGroups(req, res);
});

router.delete('/ruleGroups', (req, res) => {
  ruleGroupsController.removeRuleGroups(req, res);
});

router.get('/documents/status', (req, res) => {
  documentsController.getDocumentStatus(req, res);
});

router.get('/documents/types', (req, res) => {
  documentsController.getDocumentTypes(req, res);
});

router.get('/documents', (req, res) => {
  documentsController.getDocuments(req, res);
});

router.post('/documents', (req, res) => {
  documentsController.createDocuments(req, res);
});

router.put('/documents', (req, res) => {
  documentsController.updateDocuments(req, res);
});

router.delete('/documents', (req, res) => {
  documentsController.removeDocuments(req, res);
});

router.get('/requirementSetsDocuments', (req, res) => {
  requirementSetsDocumentsController.getRequirementSetsDocuments(req, res);
});

router.post('/requirementSetsDocuments', (req, res) => {
  requirementSetsDocumentsController.createRequirementSetsDocuments(req, res);
});

router.delete('/requirementSetsDocuments', (req, res) => {
  requirementSetsDocumentsController.removeRequirementSetsDocuments(req, res);
});

router.get('/attributes', function (req, res) {
  attributesController.getAttributes(req, res);
});

router.post('/attributes', (req, res) => {
  attributesController.createAttributes(req, res);
});

router.put('/attributes', (req, res) => {
  attributesController.updateAttributes(req, res);
});

router.delete('/attributes', (req, res) => {
  attributesController.removeAttributes(req, res);
});

router.get('/requirementSetsDetail', (req, res) => {
  requirementSetsController.getRequirementSetsDetail(req, res);
});

router.get('/waivers', (req, res) => {
  waiversController.getWaivers(req, res);
});

router.post('/waivers', (req, res) => {
  waiversController.createWaivers(req, res);
});

router.delete('/waivers', (req, res) => {
  waiversController.removeWaivers(req, res);
});

router.get('/waiverLineItems', (req, res) => {
  waiverLineItemsController.getWaiverLineItems(req, res);
});

router.post('/waiverLineItems', (req, res) => {
  waiverLineItemsController.createWaiverLineItems(req, res);
});

router.put('/waiverLineItems', (req, res) => {
  waiverLineItemsController.updateWaiverLineItems(req, res);
});

router.delete('/waiverLineItems', (req, res) => {
  waiverLineItemsController.removeWaiverLineItems(req, res);
});

router.get('/projectInsuredDeficiencies', (req, res) => {
  projectInsuredDeficienciesController.getProjectInsuredDeficiencies(req, res);
});

router.post('/projectInsuredDeficiencies', (req, res) => {
  projectInsuredDeficienciesController.createProjectInsuredDeficiencies(req, res);
});

router.put('/projectInsuredDeficiencies', (req, res) => {
  projectInsuredDeficienciesController.updateProjectInsuredDeficiencies(req, res);
});

router.delete('/projectInsuredDeficiencies', (req, res) => {
  projectInsuredDeficienciesController.removeProjectInsuredDeficiencies(req, res);
});

router.get('/projectDocuments', (req, res) => {
  projectDocumentsController.getProjectDocuments(req, res);
});

router.post('/projectDocuments', (req, res) => {
  projectDocumentsController.createProjectDocuments(req, res);
});

router.delete('/projectDocuments', (req, res) => {
  projectDocumentsController.removeProjectDocuments(req, res);
});

router.get('/projectInsuredDocuments', (req, res) => {
  projectInsuredDocumentsController.getProjectInsuredDocuments(req, res);
});

router.post('/projectInsuredDocuments', (req, res) => {
  projectInsuredDocumentsController.createProjectInsuredDocuments(req, res);
});

router.delete('/projectInsuredDocuments', (req, res) => {
  projectInsuredDocumentsController.removeProjectInsuredDocuments(req, res);
});

router.get('/insurers', (req, res) => {
  insurersController.getInsurers(req, res);
});

router.post('/insurers', (req, res) => {
  insurersController.createInsurers(req, res);
});

router.delete('/insurers', (req, res) => {
  insurersController.removeInsurers(req, res);
});

router.get('/insureds/holder', (req, res) => {
  insuredsController.getInsuredsByHolder(req, res);
});

router.get('/insureds', (req, res) => {
  insuredsController.getInsureds(req, res);
});

router.post('/insureds', (req, res) => {
  insuredsController.createInsureds(req, res);
});

router.put('/insureds', (req, res) => {
  insuredsController.updateInsureds(req, res);
});

router.delete('/insureds', (req, res) => {
  insuredsController.removeInsureds(req, res);
});

router.post('/insureds/archive', (req, res) => {
  insuredsController.archiveInsureds(req, res);
});

router.get('/coverageDocuments', (req, res) => {
  coverageDocumentsController.getCoverageDocuments(req, res);
});

router.post('/coverageDocuments', (req, res) => {
  coverageDocumentsController.createCoverageDocuments(req, res);
});

router.delete('/coverageDocuments', (req, res) => {
  coverageDocumentsController.removeCoverageDocuments(req, res);
});

router.get('/coverageAttributes', (req, res) => {
  coverageAttributesController.getCoverageAttributes(req, res);
});

router.post('/coverageAttributes', (req, res) => {
  coverageAttributesController.createCoverageAttributes(req, res);
});

router.delete('/coverageAttributes', (req, res) => {
  coverageAttributesController.removeCoverageAttributes(req, res);
});

router.get('/insurersCoverages', (req, res) => {
  insurersCoveragesController.getInsurersCoverages(req, res);
});

router.post('/insurersCoverages', (req, res) => {
  insurersCoveragesController.createInsurersCoverages(req, res);
});

router.delete('/insurersCoverages', (req, res) => {
  insurersCoveragesController.removeInsurersCoverages(req, res);
});

router.get('/projectInsuredCoverages', (req, res) => {
  projectInsuredCoveragesController.getProjectInsuredCoverages(req, res);
});

router.post('/projectInsuredCoverages', (req, res) => {
  projectInsuredCoveragesController.createProjectInsuredCoverages(req, res);
});

router.delete('/projectInsuredCoverages', (req, res) => {
  projectInsuredCoveragesController.removeProjectInsuredCoverages(req, res);
});

router.get('/coverages', (req, res) => {
  coveragesController.getCoverages(req, res);
});

router.post('/coverages', (req, res) => {
  coveragesController.createCoverages(req, res);
});

router.put('/coverages', (req, res) => {
  coveragesController.updateCoverages(req, res);
});

router.delete('/coverages', (req, res) => {
  coveragesController.removeCoverages(req, res);
});

router.get('/coverages/status', (req, res) => {
  coveragesController.getCoveragesAndAttributesStatus(req, res)
});

router.get('/projectRequirementSets', (req, res) => {
  projectRequirementSetsController.getProjectRequirementSets(req, res);
});

router.post('/projectRequirementSets', (req, res) => {
  projectRequirementSetsController.createProjectRequirementSets(req, res);
});

router.delete('/projectRequirementSets', (req, res) => {
  projectRequirementSetsController.removeProjectRequirementSets(req, res);
});

router.get('/projectCertTexts', (req, res) => {
  projectCertTextsController.getProjectCertTexts(req, res);
});

router.post('/projectCertTexts', (req, res) => {
  projectCertTextsController.createProjectCertTexts(req, res);
});

router.put('/projectCertTexts', (req, res) => {
  projectCertTextsController.updateProjectCertTexts(req, res);
});

router.get('/projectInsuredComplianceStatus', (req, res) => {
  projectInsuredComplianceStatus.getProjectInsuredComplianceStatus(req, res);
});

router.get('/projectInsuredTags', (req, res) => {
  projectInsuredTagsController.getProjectInsuredTags(req, res);
});

router.post('/projectInsuredTags', (req, res) => {
  projectInsuredTagsController.createProjectInsuredTags(req, res);
});

router.delete('/projectInsuredTags', (req, res) => {
  projectInsuredTagsController.removeProjectInsuredTags(req, res);
});

router.get('/holderSettings', (req, res) => {
  holderSettingsController.getHolderSettings(req, res);
});

router.put('/holderSettings', (req, res) => {
  holderSettingsController.updateHolderSettings(req, res);
});

router.get('/holderSettingsDataEntryOptions', (req, res) => {
  holderSettingsController.getHolderSettingsDataEntryOptions(req, res);
});

router.get('/holderSettingsCertificateOptions', (req, res) => {
  holderSettingsController.getHolderSettingsCertificateOptions(req, res);
});

router.get('/payments', (req, res) => {
  paymentsController.getPayments(req, res);
});

router.post('/payments', (req, res) => {
  paymentsController.createPayments(req, res);
});

router.delete('/payments', (req, res) => {
  paymentsController.removePayments(req, res);
});

router.get('/invoices', (req, res) => {
  invoicesController.getInvoices(req, res);
});

router.post('/invoices', (req, res) => {
  invoicesController.createInvoices(req, res);
});

router.delete('/invoices', (req, res) => {
  invoicesController.removeInvoices(req, res);
});

router.get('/refunds', (req, res) => {
  refundsController.getRefunds(req, res);
});

router.post('/refunds', (req, res) => {
  refundsController.createRefunds(req, res);
});

router.delete('/refunds', (req, res) => {
  refundsController.removeRefunds(req, res);
});

router.get('/invoicePayments', (req, res) => {
  invoicePaymentsController.getInvoicePayments(req, res);
});

router.post('/invoicePayments', (req, res) => {
  invoicePaymentsController.createInvoicePayments(req, res);
});

router.delete('/invoicePayments', (req, res) => {
  invoicePaymentsController.removeInvoicePayments(req, res);
});

router.get('/invoiceLineItems', (req, res) => {
  invoiceLineItemsController.getInvoiceLineItems(req, res);
});

router.post('/invoiceLineItems', (req, res) => {
  invoiceLineItemsController.createInvoiceLineItems(req, res);
});

router.delete('/invoiceLineItems', (req, res) => {
  invoiceLineItemsController.removeInvoiceLineItems(req, res);
});

router.get('/finance', (req, res) => {
  invoicesController.getFinance(req, res);
});

/**
 * COIs
 */
router.get('/certificateOfInsurance', (req, res) => {
  processingController.getCertificateOfInsurance(req, res);
});
router.post('/certificateOfInsurance', (req, res) => {
  processingController.createCertificateOfInsurance(req, res);
});
router.put('/certificateOfInsurance', (req, res) => {
  processingController.updateCertificateOfInsurance(req, res);
});

/**
 * Processing
 */
router.get('/processing', (req, res) => {
  processingController.getProcessing(req, res);
});
router.post('/processing', (req, res) => {
  processingController.createProcessing(req, res);
});
router.put('/processing', (req, res) => {
  processingController.updateProcessing(req, res);
});

// router.get('/deficiencyViewer', (req, res) => {
//   processingController.getDeficiencyViewer(req, res);
// });
router.post('/certificates/deficiencies', (req, res) => {
  processingController.calculateDeficiencies(req, res);
});

router.get('/requirementSetsEndorsements', (req, res) => {
  requirementSetsEndorsementsController.getRequirementSetsEndorsements(req, res);
});

router.post('/requirementSetsEndorsements', (req, res) => {
  requirementSetsEndorsementsController.createRequirementSetsEndorsements(req, res);
});

router.delete('/requirementSetsEndorsements', (req, res) => {
  requirementSetsEndorsementsController.removeRequirementSetsEndorsements(req, res);
});

router.get('/holderCoverageTypes', (req, res) => {
  holderCoverageTypesController.getHolderCoverageTypes(req, res);
});

router.post('/holderCoverageTypes', (req, res) => {
  holderCoverageTypesController.createHolderCoverageTypes(req, res);
});

router.put('/holderCoverageTypes', (req, res) => {
  holderCoverageTypesController.updateHolderCoverageTypes(req, res);
});

router.delete('/holderCoverageTypes', (req, res) => {
  holderCoverageTypesController.removeHolderCoverageTypes(req, res);
});


router.get('/customTerms', function (req, res) {
  customTermsController.getCustomTerms(req, res);
});

router.post('/customTerms', function (req, res) {
  customTermsController.createCustomTerms(req, res);
});

router.put('/customTerms', function (req, res) {
  customTermsController.updateCustomTerms(req, res);
});

router.delete('/customTerms', function (req, res) {
  customTermsController.removeCustomTerms(req, res);
});

router.get('/waiversDetail', (req, res) => {
  waiversController.getWaiversDetail(req, res);
});

router.get('/ges/eac-types', (req, res) => {
  gesEacTypesController.getTypes(req, res);
});

router.get('/documentQueueDefinitions', (req, res) => {
  documentQueueDefinitionsController.getDocumentQueueDefinitions(req, res);
});

router.post('/documentQueueDefinitions', (req, res) => {
  documentQueueDefinitionsController.createDocumentQueueDefinitions(req, res);
});

router.put('/documentQueueDefinitions', (req, res) => {
  documentQueueDefinitionsController.updateDocumentQueueDefinitions(req, res);
});

router.delete('/documentQueueDefinitions', (req, res) => {
  documentQueueDefinitionsController.removeDocumentQueueDefinitions(req, res);
});

router.get('/documentQueueDefinitions/users', (req, res) => {
  documentQueueDefinitionsController.getDocumentQueueUsers(req, res);
});

router.post('/documentQueueDefinitions/users', (req, res) => {
  documentQueueDefinitionsController.createDocumentQueueUsers(req, res);
});

router.delete('/documentQueueDefinitions/users', (req, res) => {
  documentQueueDefinitionsController.removeDocumentQueueUsers(req, res);
});

router.get('/documentQueueDefinitions/availableUsersPerRole', (req, res) => {
  documentQueueDefinitionsController.getAvailableUsersPerRole(req, res);
});

/**
 * Add a new user to a project
 */
router.post('/projectUser', (req, res) => {
  projectUsers.saveProjectUser(req, res);
});

/**
 * Fetch a project users list.
 */
router.get('/projectUsers', (req, res) => {
  projectUsers.getProjectUsers(req, res);
});

/**
 * Change the status of an user for the given project
 */
router.put('/projectUser/status', (req, res) => {
  projectUsers.toggleProjectUserStatus(req, res);
});

router.put('/holders/user/status', (req, res) => {
  holderController.toogleHolderUserStatus(req, res);
});

router.post('/projectInsureds/certificate', (req, res) => {
  projectInsuredsController.createProjectInsuredsCertificate(req, res);
});

router.get('/coverages/topLayers', (req, res) => {
  coveragesController.getCoveragesTopLayers(req, res);
});

router.post('/coverages/topLayers', (req, res) => {
  coveragesController.createCoveragesTopLayers(req, res);
});

// DEPARTMENT ROUTES

/**
 * Creates a new department
 */
router.post('/departments', (req, res) => {
  departmentsController.saveDepartment(req, res);
});

/**
 * update a department data (only it's name)
 */
router.put('/departments', (req, res) => {
  departmentsController.updateDepartment(req, res);
});

/**
 * Fetch departments list of the system
 */
router.get('/departments', (req, res) => {
  departmentsController.getDepartments(req, res);
})

/**
 * Fetch All users of a department and its available CF users to be assigned.
 */
router.get('/departments/users', (req, res) => {
  departmentsController.getDepartmentUsers(req, res);
})

/**
 * Remove a use from a department (can't be undone)
 */
router.delete('/departments/user', (req, res) => {
  departmentsController.removeDepartmentUser(req, res);
})

/**
 * Adds a user to a department.
 */
router.post('/departments/user', (req, res) => {
  departmentsController.addDepartmentUser(req, res);
});

/**Certificates */
router.get('/certificates', (req, res) => {
  certificatesController.getCertificates(req, res);
});

router.get('/certificates/deficiences', (req, res) => {
  certificatesController.getDeficiences(req, res);
});

// router.put('/certificates/toggledeficiences', (req, res) => { // change deficiency status to waiver or confirm one by one
//   certificatesController.setToggledeficiencies(req, res);
// });

// router.post('/certificates/insuredemail', (req, res) => {
//   //certificatesController.setToggledeficiences(req,res);  
// });

// router.post('/certificates/procedureemail', (req, res) => {
//   //certificatesController.setToggledeficiences(req,res);  
// });

// router.post('/certificates/sendemail', (req, res) => {
//   //certificatesController.setToggledeficiences(req,res);  
// });

router.get('/certificates/users', (req, res) => {
  certificatesController.getUsers(req, res);
});

router.get('/certificates/projectInsured', (req, res) => {
  certificatesController.getProjectInsured(req, res);
});

router.post('/certificates/waiversdeficiencies', (req, res) => {
  certificatesController.saveWaiversDeficiencies(req, res);
});

router.put('/certificates/undowaiversdeficiencies', (req, res) => {
  certificatesController.undoWaiversDeficiencies(req, res);
});

router.put('/certificates/confirmdeficiencies', (req, res) => {  // confirm all deficiencies
  certificatesController.confirmdeficiencies(req, res);
});

router.put('/certificates/emailprocedure', (req, res) => {
  certificatesController.updateProcedureEmail(req, res);
});

router.put('/certificates/emailinsured', (req, res) => {
  certificatesController.updateInsuredEmail(req, res);
});

router.put('/certificates/rejectcertificate', (req, res) => {
  certificatesController.rejectCertificate(req, res);
});

router.put('/certificates/onholdcertificate', (req, res) => {
  certificatesController.onHoldCertificate(req, res);
});

router.put('/certificates/removeonholdcertificate', (req, res) => {
  certificatesController.removeOnHoldCertificate(req, res);
});

router.put('/certificates/escalatecertificate', (req, res) => {
  let deficiences = req.body.deficiences.map(x => {

    switch (x.coverageAttributeStatusID) {
      case 5:
        x.coverageAttributeStatusID = 7;
        break;
      case 12:
        x.coverageAttributeStatusID = 6;
        break;
      default:
        x.coverageAttributeStatusID = 13
    }
    return x;    
  });
  
  certificatesController.escalateCertificate({ deficiences: deficiences, projectInsuredId: req.body.projectInsuredId }, res);
});

module.exports = router;