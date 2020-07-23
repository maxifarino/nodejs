const mssql = require('../../../../mssql/mssql_helper')
const qry_provider = require('./query_provider')

exports.getEmailTemplate = async (holderId, templateName) => {
    try {
        const connection = await mssql.getConnection();

        const query = qry_provider.getTemplateByNameQuery(hiringClientId, templateName);
        const result = await connection.request().query(query)
        connection.close();

        return result.recordset[0]
    }
    catch(err) {
        Error(err)
    }
}