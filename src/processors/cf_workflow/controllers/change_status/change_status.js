const wf_utils = require('../../utils')
const sql_helper = require('../../../../mssql/mssql_helper')
const query_provider = require('./query_provider')

exports.ChangeStatus = async (config, workflow) => {
    if (config.complianceStatus !== 'NULL'){
        try {
            const query = query_provider.updateProjectInsuredComplianceStatus(workflow.ProjectInsuredId, config.complianceStatus)
            const connection = await sql_helper.getConnection()
            await connection.request().query(query)
            connection.close()
        }
        catch(err){
            return err
        }
    }
    /*
    if (config.coverageStatus !== 'NULL'){
        try {
            const query = query_provider.updateCoveragesStatus(workflow.ProjectInsuredId, config.complianceStatus)
            const connection = await sql_helper.getConnection()
            await connection.request().query(query)
            connection.close()
        }
        catch(err){
            return err
        }
    }*/
}