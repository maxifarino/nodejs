const sql_helper = require('../mssql/mssql_helper');
const departmentsQueryProvider = require('../cf_providers/departments_query_provider')

exports.createDepartment = async (params, callback) => {
  let query = departmentsQueryProvider.generateSaveDepartment(params);
  query = sql_helper.getLastIdentityQuery(query, departmentsQueryProvider.tableName);

  await sql_helper.createTransaction(query, (err, result, insertId) => {
    if (err) {
      return callback(err);
    }
    callback(null, result, insertId);
  });
}

exports.updateDepartment = async (params, callback) => {
  let query = departmentsQueryProvider.generateUpdateDepartment(params);

  await sql_helper.createTransaction(query, (err) => {
    if (err) {
      return callback(err);
    }
    callback();
  });
}

exports.updateDepartmentStatus = async (params, callback) => {
  try {
    const connection = await sql_helper.getConnection();
    let queryDepartmentStatus = departmentsQueryProvider.generateUpdateDepartmentStatus(params);
    let resultDepartmentStatus = await connection.request().query(queryDepartmentStatus);

    let queryDepartmentUsersStatus = departmentsQueryProvider.generateUpdateDepartmentUsersStatus(params);
    let resultDepartmentUsersStatus = await connection.request().query(queryDepartmentUsersStatus);

    connection.close();

    callback(null, resultDepartmentStatus.rowsAffected);
  } catch (err) {
    callback(err, null);
  }
}

exports.getDepartments = async (params, callback) => {
  try {
    const connection = await sql_helper.getConnection();

    // GET DEPARTMENTS LIST
    let query = departmentsQueryProvider.generateGetDepartments(params);
    let result = await connection.request().query(query);

    // GET DEPARTMENTS ROLES
    let queryRoles = departmentsQueryProvider.generateGetDepartmentsRoles();
    let resultRoles = await connection.request().query(queryRoles);

    let queryTotalCount = departmentsQueryProvider.generateDepartmentsTotalCount(params);
    let resultTotal = await connection.request().query(queryTotalCount);
    connection.close();

    callback(null, result.recordset, resultTotal.recordset[0].count, resultRoles.recordset);
  } catch (err) {
    callback(err, null);
  }
}

exports.removeDepartmentUser = async (params, callback) => {
  try {
    const connection = await sql_helper.getConnection();

    let query = departmentsQueryProvider.generateRemoveDepartmentUser(params.departmentId, params.userId);
    let result = await connection.request().query(query);
    connection.close();

    callback(null, result.rowsAffected);
  } catch (err) {
    callback(err, null);
  }
}


exports.addDepartmentUser = async (params, callback) => {


  const connection = await sql_helper.getConnection();
  let queryClearUser = departmentsQueryProvider.generateClearUserDepartments(params.userId);
  await connection.request().query(queryClearUser);

  let query = departmentsQueryProvider.generateInsertDepartmentUser(params.departmentId, params.userId);
  // query = sql_helper.getLastIdentityQuery(query,departmentsQueryProvider.departmentsUsersTableName);

  await sql_helper.createTransaction(query, (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
}

exports.getDepartmentUsers = async (params, callback) => {
  try {
    const connection = await sql_helper.getConnection();

    let queryUsers = departmentsQueryProvider.generateGetDepartmentUsers(params);
    let resultUsers = await connection.request().query(queryUsers);

    let queryHolderUsers = departmentsQueryProvider.generateGetDepartmentHoldersUsers(params);
    let resultHolderUsers = await connection.request().query(queryHolderUsers);
    connection.close();

    callback(null, resultHolderUsers.recordset, resultUsers.recordset);
  } catch (err) {
    callback(err, null);
  }
}