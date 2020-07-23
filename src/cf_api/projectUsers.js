const projectUsers = require("../cf_mssql/projectUsers");
const error_helper = require('../helpers/error_helper');

/**
 * Returns a response with a default error message (invalid data)
 * @param res {Response} Response object
 * @returns {Response} Response with default error message
 */
const invalidDataResponse = (res) => {
  //FIXME this function should be general
  let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
  return res.send(error);
};

/**
 * Associate a user to a project
 * @param req {Request} Request object
 * @param req.body {Object} POST request data
 * @param req.body.projectId {Number} Project ID
 * @param req.body.userId {Number} User ID to associate to the project
 * @param res {Response} Response Object
 * @returns {Promise<Response>} Resolves the promise with the response status.
 */
exports.saveProjectUser = async (req, res) => {
  let queryParams = req.body || {};

  let invalidData = false;
  if (isNaN(parseInt(queryParams.projectId)) || queryParams.projectId && (parseInt(queryParams.projectId) <= 0)) invalidData = true;
  if (isNaN(parseInt(queryParams.userId)) || queryParams.userId && (parseInt(queryParams.userId) <= 0)) invalidData = true;

  if (invalidData) return invalidDataResponse(res);

  await projectUsers.saveProjectUser(queryParams, (err, result, insertId) => {
    if (err) {
      let error = {};
      switch (err) {
        case 'invalidProject':
          error = error_helper.getErrorData(error_helper.CODE_PROJECT_PPROJECT_IVALID, error_helper.MSG_PROJECT_PPROJECT_IVALID, err);
          break;
        case 'invalidUser':
          error = error_helper.getErrorData(error_helper.CODE_PROJECT_USER_IVALID, error_helper.MSG_PROJECT_USER_IVALID, err);
          break;
        case 'exists':
          error = error_helper.getErrorData(error_helper.CODE_PROJECT_USER_EXISTS, error_helper.MSG_PROJECT_USER_EXISTS, err);
          break;
        default:
          error = error_helper.getSqlErrorData(err);
          break;
      }
      return res.send(error);
    }

    return res.status(200).json({ success: true, projectUserId: insertId });
  });

};

/**
 * Fetch users list for a project
 * @param req {Request} Request Object
 * @param req.body {Object} Object with parameters to be applied to the query
 * @param req.body.searchTerm {String} Text to be searched as text contained in user's first name of last name
 * @param req.body.userType {Number} ID of PQ Role
 * @param req.body.CFUserType {Number} ID of CF Role
 * @param req.body.pageSize {Number} Amount of items per page
 * @param req.body.pageNumber {Number} Page number
 * @param req.body.orderBy {String} Field name to apply the sort order
 * @param req.body.orderDirection {String} Direction of sort order
 * @param res {Response} Response Object
 * @returns {Promise<Response>}
 */
exports.getProjectUsers = async (req, res) => {
  let queryParams = req.query || {};
  // queryParams.archived = (!req.query.archived)? '0' : '1';

  let invalidData = false;

  if(queryParams.pageSize && (parseInt(queryParams.pageSize) <= 0 || isNaN(parseInt(queryParams.pageSize)))) invalidData = true;
  if(queryParams.pageNumber && (parseInt(queryParams.pageNumber) <= 0 || isNaN(parseInt(queryParams.pageNumber)))) invalidData = true;
  if (isNaN(parseInt(queryParams.projectId)) || queryParams.projectId && (parseInt(queryParams.projectId) <= 0)) invalidData = true;

  if(!(
    queryParams.orderBy == 'Name' ||
    queryParams.orderBy == 'Phone' ||
    queryParams.orderBy == 'Mail' ||
    queryParams.orderBy == 'PQRole' ||
    queryParams.orderBy == 'CFRole' ||
    queryParams.orderBy == 'Archived'
  )) invalidData = true;

  if (invalidData) return invalidDataResponse(res);

  // GET THE TOTAL ROWS FOR THE QUERY
  let totalCount = 0;
  await projectUsers.getProjectUsersCount(queryParams)
    .then( response => {
      totalCount = response;
    })
    .catch( error => {
      return Promise.reject(error);
    });

  return await projectUsers.getProjectUsers(queryParams)
    .then( (result) => {
      let data = {
        success: true,
        totalCount,
        users: result,
      };
      return res.status(200).json({ success: true, data: data });
    })
    .catch( (err) => {
      let error = error_helper.getSqlErrorData (err);
      return res.send(error);
    });

};

/**
 * Toggle the user status for the given project
 * @param req {Request} Request Object
 * @param req.body {Object} Parameters to be used in body request because it's a PUT request
 * @param req.body.projectId {Number} ID of the project to filter the user
 * @param req.body.userId {Number} ID of the user to toggle its status
 * @param res {Response} Response Object
 * @returns {Promise<Response>}
 */
exports.toggleProjectUserStatus = async (req, res) => {

  let queryParams = req.body || {};

  let invalidData = false;

  if (isNaN(parseInt(queryParams.projectId)) || queryParams.projectId && (parseInt(queryParams.projectId) <= 0)) invalidData = true;
  if (isNaN(parseInt(queryParams.userId)) || queryParams.userId && (parseInt(queryParams.userId) <= 0)) invalidData = true;

  if (invalidData) return invalidDataResponse(res);
  return await projectUsers.changeProjectUserStatus(queryParams)
    .then( response => {
      let data = {
        statusChanged: response,
      };
      return res.status(200).json({ success: true, data });
    })
    .catch( error => {
      let errorMsg = error_helper.getSqlErrorData(error);
      return res.send(errorMsg);
    })

};