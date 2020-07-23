const tableName = 'Departments';
const holdersTableName = 'HiringClients';
const rolesTableName = 'Roles';
const rolesFunctionsTableName = 'Roles_Functions';
const functionsTableName = 'Functions';
const departmentsUsersTableName = 'DepartmentUsers'
const userTableName = 'Users'

exports.tableName = tableName;
exports.departmentsUsersTableName = departmentsUsersTableName;

exports.generateSaveDepartment = (params) => {
  const {name} = params;
  const queryFields = 'DepartmentName'
  const query = `INSERT INTO ${tableName} (${queryFields}) VALUES ('${name}')`

  return query;
}

exports.generateUpdateDepartment = (params) => {
  const {name, archived, id} = params;
  const updateFields = [
    `DepartmentName = '${name}'`,
  ]
  const queryWhere = `ID = ${id}`;
  const query = `UPDATE ${tableName} SET ${updateFields.join(', ')} WHERE ${queryWhere}`
  return query;
}

exports.generateUpdateDepartmentStatus = (params) => {
  const {archived, id} = params;
  const updateFields = [
    `ArchivedFlag = ${archived}`,
  ]
  const queryWhere = `ID = ${id}`;
  const query = `UPDATE ${tableName} SET ${updateFields.join(', ')} WHERE ${queryWhere}`
  return query;
}

exports.generateUpdateDepartmentUsersStatus = (params) => {
  const {archived, id} = params;
  const updateFields = [
    `Archived = ${archived}`,
  ]
  const queryWhere = `DepartmentId = ${id}`;
  const query = `UPDATE ${departmentsUsersTableName} SET ${updateFields.join(', ')} WHERE ${queryWhere}`
  return query;
}

exports.generateGetDepartments = (params) => {
  const {orderBy, orderDirection, pageSize, pageNumber} = params;
  const fieldsList = [
    "ID as 'id'",
    "DepartmentName as 'name'",
    "ArchivedFlag as 'archived'",
    "TimeStamp as 'created'",
    "("+countDepartmentHolders()+") as 'activeHolders'",
  ]
  const queryFields = fieldsList.join(', ')

  const queryWhere =  buildQueryWhere(params);

  let queryOrderBy = `ORDER BY ${orderBy} ${orderDirection}`;

  let query = `SELECT ${queryFields} FROM ${tableName} ${queryWhere} ${queryOrderBy}`

  if (pageSize && pageNumber) query += ` OFFSET ${pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${pageSize} ROWS ONLY `

  return query;
}

exports.generateDepartmentsTotalCount = (params) => {
  const fieldsList = [
    "count(id) as 'count'",
  ]
  const queryFields = fieldsList.join(', ')

  const queryWhere =  buildQueryWhere(params);

  let query = `SELECT ${queryFields} FROM ${tableName} ${queryWhere}`

  return query;
}

/**
 * Build query to fetch all available CF Roles and Users that can be assigned as CF Account Manager for a department.
 *
 * @param params {Object} Object with parameters to be applied
 * @param params.departmentId {number} Department's ID to fetch the data.
 * @returns {string} Return the query to be executed.
 */
exports.generateGetDepartmentHoldersUsers = (params) => {
  const fieldsList = [
    "R.Id as 'value'",
    "R.Name as 'label'",
    `(select Id as 'value', concat(FirstName, ' ', LastName) as 'label' from Users where CFRoleId = R.Id and Id not in (select userId from DepartmentUsers) for json auto)  as 'users'`
  ];
  const queryFields = fieldsList.join(', ')

  const subQueryRoles = functionRoleAccess('can be assigned as CF Account Manager');
  const queryWhere = `RF.FunctionId = (${subQueryRoles})`;

  const joinRolesFunctions = `INNER JOIN ${rolesFunctionsTableName} RF on R.Id = RF.RoleId`;

  let query = `SELECT ${queryFields} FROM ${rolesTableName} R ${joinRolesFunctions} WHERE ${queryWhere} ORDER BY label ASC`;

  return query;
}

exports.generateGetDepartmentsRoles = () => {
  const fieldsList = [
    "R.Id",
    "R.Name as 'label'",
  ];
  const queryFields = fieldsList.join(', ')

  const subQueryRoles = functionRoleAccess('can be assigned as CF Account Manager');

  const joinRolesFunctions = `INNER JOIN ${rolesFunctionsTableName} RF on R.Id = RF.RoleId`;
  const queryWhere = `RF.FunctionId = (${subQueryRoles})`;

  let query = `SELECT ${queryFields} FROM ${rolesTableName} R ${joinRolesFunctions} WHERE ${queryWhere} ORDER BY label ASC`;

  return query;
}

exports.generateRemoveDepartmentUser = (departmentId, userId) => {
  const queryWhere = `departmentId = ${departmentId} and userId = ${userId}`
  return `DELETE FROM ${departmentsUsersTableName} WHERE ${queryWhere}`
}

exports.generateClearUserDepartments = (userId) => {
  const queryWhere = `userId = ${userId}`
  return `DELETE FROM ${departmentsUsersTableName} WHERE ${queryWhere}`
}

exports.generateInsertDepartmentUser = (departmentId, userId) => {
  const fields = [
    'departmentId',
    'userId'
  ];
  const fieldList = fields.join(', ');

  return `INSERT INTO ${departmentsUsersTableName} (${fieldList}) VALUES (${departmentId}, ${userId})`
}

const functionRoleAccess = (action) => {
  const fieldsList = [
    "Id",
  ]
  const queryFields = fieldsList.join(', ')

  const queryWhere = `Name = '${action}'`;
  return `select ${queryFields} from ${functionsTableName} where ${queryWhere}`;
}

/**
 * Build query to fetch all users of a department
 *
 * @param params {Object} Object with parameters to be applied
 * @param params.departmentId {number} Department's ID to fetch the data.
 * @returns {string} Return the query to be executed.
 */
exports.generateGetDepartmentUsers = (params) => {
  const fieldsList = [
    "U.Id",
    "U.FirstName",
    "U.LastName",
    "U.Mail",
    "R.Name as 'Role'",
    "CONCAT(U.FirstName, ' ', U.LastName) as 'Name'"
  ];
  const queryFields = fieldsList.join(', ');
  const joinUsers = `inner join ${userTableName} U on DU.userId = U.Id`;
  const joinRoles = `inner join ${rolesTableName} R on U.CFRoleId = R.Id`
  const queryWhere = `DU.departmentId = ${params.departmentId}`;
  return `select ${queryFields} from ${departmentsUsersTableName} DU ${joinUsers} ${joinRoles} where ${queryWhere} ORDER BY U.FirstName,U.LastName ASC`;
}

const countDepartmentHolders = () => {
  const queryWhere = 'Department = Departments.ID and Archive = 0';
  return `select count(Id) from ${holdersTableName} where ${queryWhere}`;
}

const buildQueryWhere = (params) => {
  const {name, archived} = params;
  let queryWhere = 'WHERE 1 = 1'
  if (name) {
    queryWhere += ` AND DepartmentName like '%${name}%'`;
  }
  if (archived) {
    queryWhere += ` AND ArchivedFlag = ${archived}`;
  }

  return queryWhere;
}