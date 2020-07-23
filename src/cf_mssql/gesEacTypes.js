const sql = require('mssql');
const sql_helper = require('../mssql/mssql_helper');
const logger = require('../mssql/log');
const gesEacTypes_query_provider = require('../cf_providers/gesEacTypes_query_provider.js');

exports.getRules = async (params, callback) => {

  try {
    const connection = await sql_helper.getConnection();
    let query = gesEacTypes_query_provider.generateTypesQuery();
    result = await connection.request().query(query);
    connection.close();
    callback(null, result.recordset);
  }
  catch(err) {
    console.log(err);
    callback(err, null);
  }
};