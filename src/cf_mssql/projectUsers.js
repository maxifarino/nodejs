const sql_helper = require('../mssql/mssql_helper');
const projectUsersQueryProvider = require("../cf_providers/projectusers_query_provider");

/**
 * Insert user and project IDs into dbo.projectsUsers table
 * @param params {Object} Object with the required data
 * @param params.projectId {Number} Project ID
 * @param params.userId {Number} User ID to associate to the given project
 * @param callback {Function} Function to be executed as callback
 * @returns {Promise<function>} Callback execution
 */
exports.saveProjectUser = async (params, callback) => {
  //Check if the user has been already associated to that project
  const connection = await sql_helper.getConnection();
  let query = projectUsersQueryProvider.checkIfProjectUserExists(params);
  let result = await connection.request().query(query);

  if (result.recordset.length > 0) {
    return callback('exists');
  }

  //TODO check if the project exists and if it's not archived

  // return callback('invalidProject');

  //TODO check if the user exists and if it's related to the holder (and it's enabled)

  // return callback('invalidUser');

  query = projectUsersQueryProvider.generateSaveProjectUserQuery(params);
  query = sql_helper.getLastIdentityQuery(query, 'ProjectsUsers');

  await sql_helper.createTransaction(query, (err, result, insertId) => {
    if (err) {
      return callback(err);
    }
    callback(null, result, insertId);
  });
};

/**
 * Fetch users list for a project
 * @param params {Object} Parameter to be used at the query
 * @param params.projectId {Number} ID of the project to fetch users list
 * @param params.searchTerm {string} Text to search inside the users name
 * @returns {Promise<Object>} User list for the project
 */
exports.getProjectUsers = async (params) => {
  const connection = await sql_helper.getConnection();
  let query = projectUsersQueryProvider.generateGetProjectUsersQuery(params);
  return await connection.request().query(query)
    .then( res => {
      return res.recordset;
    })
    .catch( error => {
      return Promise.reject(error);
    })
};

/**
 * Calculates the total rows of users for the given project
 */
exports.getProjectUsersCount = async (params) => {
  const connection = await sql_helper.getConnection();
  let query = projectUsersQueryProvider.generateGetProjectUsersCount(params);
  return await connection.request().query(query)
    .then( res => {
      if (res.recordset[0]) {
        return res.recordset[0].totalCount
      }
      return 0;
    })
    .catch( error => {
      return Promise.reject(error);
    })
};

exports.changeProjectUserStatus = async (params) => {
  const connection = await sql_helper.getConnection();
  const {projectId, userId} = params;
  let query = projectUsersQueryProvider.generateToggleProjectUserStatus(parseInt(projectId), parseInt(userId));
  return await connection.request().query(query)
    .then( res => {
      return res.rowsAffected[0] >= 1;
    })
    .catch( error => {
      return Promise.reject(error);
    })
};