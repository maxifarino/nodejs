const tableName = 'dbo.ProjectsUsers';

/**
 * Build query to fetch the list of users related to a project
 * @param params {Object} Parameters to be applied to the query
 * @param params.projectId {number} ID of the project to fetch users list
 * @param params.orderBy {string} Field to apply the order, possible values are Name, Phone, Mail, PQRole, CFRole
 * @param params.orderDirection {string} Direction of the order, possible values are ASC, DESC
 * @param params.PQRoleId {number} ID of the PQ role to filter by Role field
 * @param params.CFRoleId {number} ID of the CF role to filter by CFRole field
 * @param params.searchTerm {string} Free text to search in user's first name or last name as text contained
 * @param params.archived {Boolean} 0 to fetch un archived users, 1 to fetch archived ones
 * @returns {string} Query to be executed
 */
exports.generateGetProjectUsersQuery = (params) => {

  const {orderBy, orderDirection, projectId, pageNumber, pageSize, archived} = params;

  let queryFields = `pu.UserId,
    CONCAT(u.FirstName,' ', u.LastName) as Name, 
    u.Phone, 
    u.Mail, 
    (select Name from Roles r where r.Id = u.RoleID ) 'PQRole', 
    (select Name from Roles r where r.Id = u.CFRoleId) 'CFRole', 
    pu.Archived`;
  let querySelect = `select ${queryFields} from ProjectsUsers pu, Users u`;
  let queryWhere = `where u.IsEnabled = 1 and pu.ProjectId = ${projectId} and u.Id = pu.UserId`;
  let queryOrder = `order by ${orderBy} ${orderDirection}`;

  if (params.PQRoleId) {
    queryWhere += ` and u.RoleId = ${params.PQRoleId}`
  }
  if (params.CFRoleId) {
    queryWhere += ` and u.CFRoleId = ${params.CFRoleId}`
  }
  if (params.searchTerm) {
    queryWhere += ` and (u.FirstName like '%${params.searchTerm}%' OR u.LastName like '%${params.searchTerm}%')`
  }
  if (!isNaN(parseInt(params.Archived)) ) {
    queryWhere += ` and Archived = ${parseInt(params.Archived)}`
  }

  let query = `${querySelect} ${queryWhere}`;
  if (orderBy && orderDirection) query += ` ${queryOrder}`;
  if (pageSize && pageNumber) query += ` OFFSET ${pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${pageSize} ROWS ONLY `;
  return query;
};

/**
 * Build query to insert a new user for a project
 * @param params {object}
 * @param params.projectId {integer} Project ID
 * @param params.userId {integer} User ID
 * @returns {string} Query to be executed
 */
exports.generateSaveProjectUserQuery = (params) => {
  const {projectId, userId} = params;
  let query = `INSERT INTO ${tableName} (
		ProjectId, UserId
  )	VALUES (
		${projectId}, ${userId}
  )`;
  return query;
};

/**
 * Build query to check if the user is already associated to the project
 * @param params {object}
 * @param params.projectId {Number} Project ID to be checked
 * @param params.userId {Number} User ID to be checked
 * @returns {string} Query to be executed
 */
exports.checkIfProjectUserExists = (params) => {
  const {projectId, userId} = params;
  let query = `SELECT ProjectsUsersId FROM ${tableName} where ProjectId = ${projectId} and UserId = ${userId}`;
  console.log(query);
  return query;
}

/**
 * Build query to calculate the total amount of users for the given project
 * @param params {Object} Object with parameters to be used
 * @param params.projectId {Number} ID of the project
 * @param params.PQRoleId {number} ID of the PQ role to filter by Role field
 * @param params.CFRoleId {number} ID of the CF role to filter by CFRole field
 * @param params.searchTerm {string} Free text to search in user's first name or last name as text contained
 * @returns {string}
 */
exports.generateGetProjectUsersCount = (params) => {
  let queryFields = `count(*) totalCount`;
  let querySelect = `select ${queryFields} from ProjectsUsers pu, Users u`;
  let queryWhere = `where u.IsEnabled = 1 and pu.ProjectId = ${params.projectId} and u.Id = pu.UserId`;

  if (params.PQRoleId) {
    queryWhere += ` and u.RoleId = ${params.PQRoleId}`
  }
  if (params.CFRoleId) {
    queryWhere += ` and u.CFRoleId = ${params.CFRoleId}`
  }
  if (params.searchTerm) {
    queryWhere += ` and (u.FirstName like '%${params.searchTerm}%' OR u.LastName like '%${params.searchTerm}%')`
  }
  if (!isNaN(parseInt(params.Archived)) ) {
    queryWhere += ` and Archived = ${parseInt(params.Archived)}`
  }

  let queryGroupBy = `GROUP BY pu.ProjectId`;

  return `${querySelect} ${queryWhere} ${queryGroupBy}`;
};

exports.generateToggleProjectUserStatus = (projectId, userId) => {
  let updateFields = `Archived = ~Archived`
  let updateQuery = `UPDATE ${tableName} SET ${updateFields}`;
  let updateWhere = `WHERE ProjectId = ${projectId} AND UserId = ${userId}`;

  return `${updateQuery} ${updateWhere}`
};