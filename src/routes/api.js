const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens

const config = require('../config'); // get our config file
const Users = require('../mssql/users');
const logController = require('../api/log');
const resourcesController = require('../api/resources');
const adminController = require('../api/admins');
const userController = require('../api/users');
const roleController = require('../api/roles');
const timeZoneController = require('../api/timezones');
const titleController = require('../api/titles');
const tradeController = require('../api/trades');
const formController = require('../api/forms')
const functionsController = require('../api/functions');
const formFieldsTypesController = require('../api/formfieldstypes');
const hiringClientsController = require('../api/hiring_clients');
const subContractorsController = require('../api/sub_contractors');
const subContractorsUploaderController = require('../api/sub_contractors_upload');
const templatesController = require('../api/templates');
const languagesController = require('../api/languages');
const projectsController = require('../api/projects');
const contractsController = require('../api/contracts');
const emailsController = require('../api/emails');
const referencesController = require('../api/references');
const financesController = require('../api/finances');
const tasksController = require('../api/tasks');
const workflowsController = require('../api/workflows');
const filesController = require('../api/files');
const geoController = require('../api/geo');
const error_helper = require('../helpers/error_helper');
const exagoController = require('../api/exago');
const braintreeController = require('../api/braintree');
const videosController = require('../api/videos');
const workflows_procesor = require('../processors/workflow');
const scApplicationsController = require('../api/subcontractorsApplications');

const certfocusRoutes = require('../cf_routes/api');
router.use('/cf', certfocusRoutes);

// ------------------- Customer EPs - Routes With No Token Control -------------------
router.route('/users/getapitoken').post(function (req, res, next) {
  userController.getAPIToken(req, res, next);
});
// ------------------- End Customer EPs - Routes With No Token Control ---------------

// ------------------- Routes With No Token Control -------------------

router.post('/users/ges/profile', function (req, res) {
  userController.createGESUser(req, res);
});

router.get('/users/ges/check-email', function (req, res) {
  subContractorsController.checkMailExists(req, res);
});

router.route('/users/gettoken').post(function (req, res, next) {
  console.log('get token');
  userController.getToken(req, res, next);
});

router.post('/users/reset-password', function (req, res) {
  userController.resetPassword(req, res);
});

router.get('/subcontractors/invitevalues', function (req, res) {
  subContractorsController.getSubContractorInviteValues(req, res);
});

router.post('/workflow', function (req, res) {
  workflows_procesor.processWF(req, res)
})

router.post('/subcontractors/applications', function (req, res) {
  scApplicationsController.createSCApplications(req, res);
});

router.get('/subcontractors/applications/check', function (req, res) {
  scApplicationsController.checkHC(req, res);
});

router.get('/subcontractors/applications/resources', function (req, res) {
  scApplicationsController.getResources(req, res);
});

function iterateBody(body, stack) {
  for (var key in body) {
    if (Object.prototype.toString.call(body[key]) == '[object String]') {
      // console.log(body[key]);
      body[key] = body[key].replace("'", " ");
      // console.log(body[key]);
    } else {
      for (var key2 in body[key]) {
        if (Object.prototype.toString.call(body[key][key2]) == '[object String]') {
          // console.log(body[key][key2]);
          body[key][key2] = body[key][key2].replace("'", " ");
          // console.log(body[key][key2]);
        } else {
          for (var key3 in body[key][key2]) {
            if (Object.prototype.toString.call(body[key][key2][key3]) == '[object String]') {
              // console.log(body[key][key2][key3]);
              body[key][key2][key3] = body[key][key2][key3].replace("'", " ");
              // console.log(body[key][key2][key3]);
            } else {

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
    } else {

      // verifies secret and checks exp
      jwt.verify(token, config.secret, function (err, decoded) {
        var decoded = jwt.decode(token);
        req.currentHiringClientId = decoded.hiringClientId;
        if (err) {
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

// -- BRAINTREE API CALLS --
router.post('/braintree/get-client-token', function (req, res) {
  braintreeController.getClientToken(req, res);
});

router.post('/braintree/checkout', function (req, res) {
  braintreeController.checkout(req, res);
});

// -- ADMINS --
router.post('/admins/create-user', function (req, res) {
  console.log('post create user');
  adminController.createUser(req, res);
});

router.post('/admins/enable-user', function (req, res) {
  adminController.enableUser(req, res);
});

router.post('/admins/change-user-role', function (req, res) {
  adminController.changeUserRole(req, res);
});

router.post('/admins/change-user-password', function (req, res) {
  adminController.changeUserPassword(req, res);
});

// WARNING, ONLY FOR TESTING
router.delete('/admins/delete-user', function (req, res) {
  console.log('delete user user');
  adminController.deleteUser(req, res);
});

// -- USERS --
router.get('/users/profile', function (req, res) {
  userController.getProfile(req, res);
});

// -- USERS Check if email exists--
router.get('/users/checkmail', function (req, res) {
  userController.checkMail(req, res);
});

router.post('/users/profile', function (req, res) {
  userController.createUser(req, res);
});

router.put('/users/profile', function (req, res) {
  userController.updateUser(req, res);
});

router.post('/users/change-password', function (req, res) {
  userController.changePassword(req, res);
});

router.get('/users', function (req, res) {
  userController.getUsers(req, res);
});

router.get('/users/brief', function (req, res) {
  userController.getUsersBrief(req, res);
});

router.get('/users/mustpay', function (req, res) {
  userController.getMustPay(req, res);
});

router.get('/users/hiringClientsAndOrSubcontractors', function (req, res) {
  userController.getUsersHiringClientsAndOrSubcontractors(req, res);
});


// -- RESOURCES --
router.get('/resources/login', function (req, res) {
  resourcesController.getLoginReources(req, res);
});

// -- ROLES --
router.get('/roles', function (req, res) {
  roleController.getRoles(req, res);
});

router.get('/roles/rolesext', function (req, res) {
  roleController.getRolesExt(req, res);
});

// -- TIME ZONES --
router.get('/timezones', function (req, res) {
  timeZoneController.getTimeZones(req, res);
});

// -- TITLES --
router.get('/titles', function (req, res) {
  titleController.getTitles(req, res);
});

router.post('/trades', function (req, res) {
  tradeController.AddOrUpdatedTrades(req, res);
});

router.get('/tradesbyhc', function (req, res) {
  tradeController.getTradesByHCId(req, res);
});

router.get('/tradesbyuserid', function (req, res) {
  tradeController.getTradesByLoggeduserId(req, res);
});

//  -- FORMS --
router.get('/forms', function (req, res) {
  formController.getForm(req, res);
});

router.get('/forms/fieldslists', function (req, res) {
  formController.getFormFieldsLists(req, res);
});

router.get('/forms/savedformfieldsvalues', function (req, res) {
  formController.getSavedFormFieldsValues(req, res);
});

router.put('/forms/savedformfieldsvalues', function (req, res) {
  formController.saveFormFieldsValues(req, res);
});

router.post('/forms/savedforms', function (req, res) {
  formController.createSavedForm(req, res);
});

router.get('/forms/savedforms', function (req, res) {
  formController.getSavedForms(req, res);
});

router.get('/forms/savedforms/datessubmission', function (req, res) {
  formController.getSavedFormsDateOfSubmission(req, res);
});

router.get('/forms/savedforms/datesprequal', function (req, res) {
  formController.getSavedFormsDateOfPrequal(req, res);
});

router.get('/forms/savedformsfilter', function (req, res) {
  formController.getSavedFormsFilters(req, res);
});

router.put('/forms/savedforms', function (req, res) {
  formController.updateSavedForm(req, res);
});

router.post('/forms', function (req, res) {
  formController.createForm(req, res);
});

router.put('/forms', function (req, res) {
  formController.createForm(req, res);
});

router.delete('/forms', function (req, res) {
  formController.deleteForms(req, res);
});

router.post('/formssections', function (req, res) {
  formController.createFormsSections(req, res);
});

router.put('/formssections', function (req, res) {
  formController.createFormsSections(req, res);
});

router.delete('/formssections', function (req, res) {
  formController.deleteFormsSections(req, res);
});

router.post('/formssectionsfields', function (req, res) {
  formController.createFormsSectionsFields(req, res);
});

router.put('/formssectionsfields', function (req, res) {
  formController.createFormsSectionsFields(req, res);
});

router.delete('/formssectionsfields', function (req, res) {
  formController.deleteFormsSectionsFields(req, res);
});

router.get('/forms/users', function (req, res) {
  formController.getFormsUsers(req, res);
});

router.get('/forms/scsentto', function (req, res) {
  formController.getFormsSCSentTo(req, res);
});

router.get('/forms/discreetaccounts', function (req, res) {
  formController.getFormDiscreetAccounts(req, res);
});

router.post('/forms/discreetAccount', function (req, res) {
  formController.saveFormDiscreetAccount(req, res);
});

router.post('/forms/copySubmission', function (req, res) {
  formController.saveCopySubmission(req, res);
});

router.post('/forms/hiddenScorecardFields', function (req, res) {
  formController.saveHiddenScorecardsFields(req, res);
});

// -- FUNCTIONS --
router.get('/functions', function (req, res) {
  functionsController.getFunctions(req, res);
});

router.get('/functions/authorization', function (req, res) {
  functionsController.getFunctionAuthorization(req, res);
});

  router.get('/functions/check', function (req, res) {
  functionsController.checkFunctionPermission(req, res);
});

// -- FORM FIELDS TYPES --
router.get('/formfieldstypes', function (req, res) {
  formFieldsTypesController.getFormFieldsTypes(req, res);
});

// -- HIRING CLIENTS list --
router.get('/hiringclients', function (req, res) {
  hiringClientsController.getHiringClients(req, res);
});

router.get('/hiringclients/unlinkedusers', function (req, res) {
  hiringClientsController.getHC_UnlinkedUsers(req, res);
});

// -- HIRING CLIENT detail --
router.get('/hiringclientdetail', function (req, res) {
  hiringClientsController.getHiringClientDetail(req, res);
});

// -- HIRING CLIENTS create --
router.post('/hiringclients', function (req, res) {
  hiringClientsController.createHiringClient(req, res);
});

// -- HIRING CLIENTS update name
router.post('/hiringclients/updateName', function (req, res) {
  hiringClientsController.updateHiringClientName(req, res);
});

// -- HIRING CLIENTS related users--
router.get('/hiringclients/users', function (req, res) {
  hiringClientsController.getHiringClientsUsers(req, res);
});

// -- HIRING CLIENTS count --
router.get('/hiringclients/count', function (req, res) {
  hiringClientsController.getHiringClientsCount(req, res);
});

// -- HIRING CLIENTS create user relation--
router.post('/hiringclients/userrelation', function (req, res) {
  hiringClientsController.linkHiringClientAndUser(req, res);
});

router.put('/hiringclients/userrelation', function (req, res) {
  hiringClientsController.updateHiringClientUserRelation(req, res);
});

router.post('/hiringclients/logo', function (req, res) {
  hiringClientsController.uploadLogo(req, res);
});

router.get('/hiringclients/subcontractor', function (req, res) {
  hiringClientsController.getHiringClientsBySubContractor(req, res);
});

router.get('/hiringclients/forms', function (req, res) {
  hiringClientsController.getFormByHiringClients(req, res);
});

router.get('/hiringclients/submissions', function (req, res) {
  hiringClientsController.getSubmissionByFormId(req, res);
});

// -- SUB CONTRACTORS --
router.post('/subcontractors/register', function (req, res) {
  subContractorsController.registerSC(req, res);
});

router.put('/subcontractors/updatebasicdata', function (req, res) {
  subContractorsController.updateBasicSCData(req, res);
});

router.post('/subcontractors/search', function (req, res) {
  subContractorsController.searchSubcontractors(req, res);
});

router.post('/subcontractors/forms', function (req, res) {
  subContractorsController.fetchHCforms(req, res);
});

router.post('/subcontractors/hcOfficeLocation', function (req, res) {
  subContractorsController.updateHCofficeLocation(req, res);
});

router.post('/subcontractors/updateName', function (req, res) {
  subContractorsController.updateSCname(req, res);
});

router.post('/subcontractors/changeTieRate', function (req, res) {
  subContractorsController.setSCTieRate(req, res);
});

router.get('/subcontractors', function (req, res) {
  subContractorsController.getSubContractors(req, res);
});

router.get('/subcontractors/popover', function (req, res) {
  subContractorsController.getSubContractorsForPopover(req, res);
});

router.get('/subcontractors_by_keyword', function (req, res) {
  subContractorsController.getSubContractorsByKeyword(req, res);
});

router.get('/subcontractors/brief', function (req, res) {
  subContractorsController.getSubContractorBrief(req, res);
});

router.get('/subcontractors/headerdetails', function (req, res) {
  subContractorsController.getSubContractorsHeaderDetails(req, res);
});

router.get('/subcontractors/statesAndCountries', function (req, res) {
  subContractorsController.getSubContractorsStatesAndCountries(req, res);
});

router.get('/subcontractors/locations', function (req, res) {
  subContractorsController.getSubContractorsLocations(req, res);
});

router.post('/subcontractors/location', function (req, res) {
  subContractorsController.createOrUpdateSubContractorLocation(req, res);
});

router.delete('/subcontractors/location/delete', function (req, res) {
  subContractorsController.deleteSubContractorLocation(req, res);
});

router.post('/subcontractors', function (req, res) {
  subContractorsController.addSubContractor(req, res);
});

router.put('/subcontractors/userrelation', function (req, res) {
  subContractorsController.updateSubContractorUserRelations(req, res);
});

// -- Upload and validate subcontractor data
router.post('/subcontractors/upload_validate', function (req, res) {
  subContractorsUploaderController.validateSCFile(req, res);
});

// ------------------- Customer EPs -------------------
// -- Get list frmo JSON and validate subcontractor data
router.post('/subcontractors/add_bulk', function (req, res) {
  subContractorsUploaderController.saveSCList(req, res);
});

router.get('/subcontractors/completed', function (req, res) {
  subContractorsController.getSubContractorsCompleted(req, res);
});

router.get('/subcontractors/all', function (req, res) {
  subContractorsController.getSubContractorsCompletedAll(req, res);
});

router.get('/subcontractors/summary', function (req, res) {
  subContractorsController.getSubContractorsSummary(req, res);
});

router.get('/subcontractors/submissions', function (req, res) {
  subContractorsController.getSubContractorsSubmissions(req, res);
});
// ------------------- Customer EPs -------------------

// -- Get list frmo JSON and validate subcontractor data
router.post('/subcontractors/list_validate_save', function (req, res) {
  subContractorsUploaderController.saveSCList(req, res);
});

router.post('/subcontractors/sendsubmission', function (req, res) {
  subContractorsController.sendSubContractorSubmission(req, res);
});

router.get('/subcontractors/submission', function (req, res) {
  subContractorsController.getSubContractorSubmission(req, res);
});

router.get('/subcontractors/submissionlink', function (req, res) {
  subContractorsController.getSubContractorSubmissionLink(req, res);
});

router.get('/subcontractors/hiringclients', function (req, res) {
  subContractorsController.getHiringClientsBySubContractor(req, res);
});

router.get('/subcontractors/status', function (req, res) {
  subContractorsController.getSubcontractorsStatus(req, res);
});

router.post('/subcontractors/status', function (req, res) {
  subContractorsController.getSubcontractorsStatusWithCounts(req, res);
});

router.get('/subcontractors/tierates', function (req, res) {
  subContractorsController.getSubContractorTieRates(req, res);
});


// -- EMAIL WEBHOOKS --
router.post('/communications/emails/webhooks', function (req, res) {
  emailsController.trackEmail(req, res);
});

router.post('/communications/emails/sender', function (req, res) {
  emailsController.sendEmail(req, res);
});

// -- LOG EVENTS --
router.post('/getLog', function (req, res) {
  logController.getLogEvents(req, res);
});

router.get('/log/users', function (req, res) {
  logController.getLogUsers(req, res);
});

router.get('/log/modules', function (req, res) {
  logController.getSystemModules(req, res);
});

router.post('/log', function (req, res) {
  logController.addLogEntry(req, res);
});

// -- TEMPLATES --
router.get('/communications/templates/', function (req, res) {
  templatesController.getTemplates(req, res);
});

router.get('/communications/placeholders/', function (req, res) {
  templatesController.getPlaceholders(req, res);
});


router.post('/communications/templates/', function (req, res) {
  templatesController.postTemplate(req, res);
});

// -- LANGUAGES --
router.post('/languages/files/', function (req, res) {
  languagesController.generatefiles(req, res);
});

router.post('/languages/clone', function (req, res) {
  languagesController.clone(req, res);
});

router.get('/languages/urls', function (req, res) {
  languagesController.getUrls(req, res);
});

router.get('/languages/keys', function (req, res) {
  languagesController.getKeys(req, res);
});

router.put('/languages/values', function (req, res) {
  languagesController.updateValues(req, res);
});

// -- PROJECTS --
router.get('/projects', function (req, res) {
  projectsController.getProjects(req, res);
});

router.get('/projects/status', function (req, res) {
  projectsController.getProjectsStatus(req, res);
});

router.post('/projects', function (req, res) {
  projectsController.createProject(req, res);
});

router.put('/projects', function (req, res) {
  projectsController.updateProject(req, res);
});

// --REFERENCES --
router.get('/references', function (req, res) {
  referencesController.getReferences(req, res);
});

router.post('/references', function (req, res) {
  referencesController.createReference(req, res);
});

router.put('/references', function (req, res) {
  referencesController.updateReference(req, res);
});

router.post('/references/questions', function (req, res) {
  referencesController.createReferenceQuestion(req, res);
});

router.put('/references/questions', function (req, res) {
  referencesController.updateReferenceQuestion(req, res);
});

router.get('/references/responses', function (req, res) {
  referencesController.getReferenceResponses(req, res);
});

router.post('/references/responses', function (req, res) {
  referencesController.createReferenceResponse(req, res);
});

// --Contracts--
router.get('/contracts', function (req, res) {
  contractsController.getContracts(req, res);
});

router.post('/contracts', function (req, res) {
  contractsController.createContract(req, res);
});

router.put('/contracts', function (req, res) {
  contractsController.updateContract(req, res);
});

router.post('/contracts/list', function (req, res) {
  contractsController.createContracts(req, res);
});

router.put('/contracts/list', function (req, res) {
  contractsController.updateContracts(req, res);
});

// -- TASKS --
router.post('/tasks', function (req, res) {
  tasksController.createOrUpdateTask(req, res);
});

router.put('/tasks', function (req, res) {
  tasksController.createOrUpdateTask(req, res);
});

router.get('/tasks', function (req, res) {
  tasksController.getTasks(req, res);
});

router.get('/notifications', function (req, res) {
  tasksController.getNotifications(req, res);
});

router.post('/notifications', function (req, res) {
  tasksController.addNotification(req, res);
});

// -- FINANCIALS --
router.post('/finances/accounts', function (req, res) {
  financesController.createAccount(req, res);
});

router.get('/finances/accounts', function (req, res) {
  financesController.getAccounts(req, res);
});

router.put('/finances/accounts', function (req, res) {
  financesController.updateAccount(req, res);
});

router.get('/finances/scorecards', function (req, res) {
  financesController.getScorecards(req, res);
});

router.post('/finances/scorecards', function (req, res) {
  financesController.addOrUpdateScorecards(req, res);
});

router.post('/finances/workingCapital', function (req, res) {
  financesController.getWorkingCapital(req, res)
})

router.get('/finances/scorecardsconcepts', function (req, res) {
  financesController.getScorecardConcepts(req, res);
});

// --WORKFLOWS--
router.get('/workflows', function (req, res) {
  workflowsController.getWorkflows(req, res);
});

router.get('/workflows/components', function (req, res) {
  workflowsController.getWorkflowComponents(req, res);
});

router.post('/workflows', function (req, res) {
  workflowsController.addWorkflow(req, res);
});

router.post('/workflows/components', function (req, res) {
  workflowsController.addWorkflowSteps(req, res);
});

router.put('/workflows', function (req, res) {
  workflowsController.addWorkflow(req, res);
});

router.get('/workflows/component/parameters', function (req, res) {
  workflowsController.getComponentParameters(req, res);
});

router.post('/workflows/changescstatus', function (req, res) {
  workflowsController.setWfSCStatusById(req, res);
});


// States
router.get('/geo/states', function (req, res) {
  geoController.getUSAStates(req, res);
});

// Files

router.get('/filesForForm', function (req, res) {
  filesController.getFilesForSavedForms(req, res);
})

router.get('/files', function (req, res) {
  filesController.getFiles(req, res);
});

// -- Upload and validate subcontractor data
router.post('/files', function (req, res) {
  filesController.addDocumentFile(req, res);
});

// -- Upload and validate subcontractor data
router.get('/files/download', function (req, res) {
  filesController.downloadFile(req, res);
});

router.get('/viewFileLink', function (req, res) {
  filesController.viewFileLink(req, res)
})

// -- VIDEOS

router.get('/videos', function (req, res) {
  videosController.getVideos(req, res)
})

router.get('/videoImages', function (req, res) {
  videosController.getVideoImages(req, res)
})

// -- EXAGO

router.post('/get-exago-session', function (req, res) {
  exagoController.getSession(req, res);
})

router.post('/set-exago-parameter', function (req, res) {
  exagoController.setParameter(req, res);
})

router.post('/set-exago-parameter2', function (req, res) {
  exagoController.setParameter2(req, res);
})

router.post('/EmbeddedReportsInfo', function (req, res) {
  exagoController.fetchEmbeddedReportsInfo(req, res)
})


// -- SUBCONTRACTORS APPLICATIONS
router.get('/subcontractors/applications', function (req, res) {
  scApplicationsController.getSCApplications(req, res);
});

router.delete('/subcontractors/applications', function (req, res) {
  scApplicationsController.removeSCApplications(req, res);
});

router.post('/subcontractors/applications/approve', function (req, res) {
  scApplicationsController.approveSCApplications(req, res);
});

router.post('/subcontractors/applications/decline', function (req, res) {
  scApplicationsController.declineSCApplications(req, res);
});

module.exports = router;
