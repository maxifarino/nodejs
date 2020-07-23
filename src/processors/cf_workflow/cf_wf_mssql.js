const sql_helper = require('../../mssql/mssql_helper');
const qry_provider = require('./cf_wf_query_provider');

/*
exports.templateFunc = () => {
    try {
        const connection = await sql_helper.getConnection();
        const query = qry_provider.providerFunc();
        const result = await connection.request().query(query);
        connection.close();

        callback(null, result.recordset);   
    }
    catch(err){
        callback(err, null);
    }
}
*/


exports.getActiveWorkflows = async (callback) => {
    try {
        const connection = await sql_helper.getConnection();
        const query = qry_provider.getActiveWorkflowsQuery();
        const result = await connection.request().query(query);
        connection.close();

        callback(null, result.recordset);   
    }
    catch(err){
        callback(err, null);
    }
}

exports.getWfStepComponent = async (wfConfigId, step) => {
    try {
        const connection = await sql_helper.getConnection();
        const query = qry_provider.getStepComponentQuery(wfConfigId, step);
        //console.log(query)
        const result = await connection.request().query(query);
        connection.close();

        return result.recordset;
    }
    catch(err){
        return err;
    }
}

exports.getComponentConfigValues = async (compId) => {
    try {
        const connection = await sql_helper.getConnection();
        const query = qry_provider.getComponentConfigsQuery(compId);
        //console.log(query)
        const result = await connection.request().query(query);
        connection.close();

        return result.recordset;
    }
    catch(err){
        return err;
    }
}

exports.incrementWorkflowStep = async (wId) => {
    try {
        const query = qry_provider.getIncrementStepQuery(wId);
        //console.log(query)
        const connection = await sql_helper.getConnection();
        const result = await connection.request().query(query);
        connection.close();

        return result.recordset;
    }
    catch(err){
        return err;
    }
}


exports.incrementWorkflowIteration = async (wId) => {
    try {
        const query = qry_provider.getIncrementIterationQuery(wId);
        //console.log(query)
        const connection = await sql_helper.getConnection();
        await connection.request().query(query);
        connection.close();
    }
    catch(err){
        return err;
    }
}

exports.getWfMaxStepIndex = async (wfConfigId) => {
    try {
        const query = qry_provider.getMaxStepIndexQuery(wfConfigId);
        const connection = await sql_helper.getConnection();
        const result = await connection.request().query(query);
        connection.close();

        return result.recordset[0].MaxStep
    }
    catch(err){
        return err;
    }
}

exports.updateWorkflowStatus = async (wId, status) => {
    try {
        const query = qry_provider.getUpdateWorkflowStatusQuery(wId, status);
        const connection = await sql_helper.getConnection();
        await connection.request().query(query);
        connection.close();

        return 'Success'
    }
    catch(err){
        return err
    }
}

exports.createWfInstance = async (wfType, holderId, projectInsuredId, ruleGroupId, ruleId, certId) => {
    try {
        const wfConfigId = await this.getWfConfigByHolderId(holderId, wfType)
        
        const query = qry_provider.getCreateWfInstanceQuery(wfConfigId, wfType, holderId, projectInsuredId, ruleGroupId, ruleId, certId);
        //console.log(query)
        const connection = await sql_helper.getConnection()
        await connection.request().query(query)
        connection.close()

        return 'Success'
    }
    catch(err){
        return err;
    }
}

exports.getWfConfigByHolderId = async (holderId, wfType) => {
    try {
        const query = qry_provider.getWorkflowConfigByHolderIdQuery(holderId, wfType)
        //console.log(query)
        const connection = await sql_helper.getConnection()
        result = await connection.request().query(query)
        connection.close()
        
        const wfConfigId = result.recordset[0].Id
        //console.log(wfConfigId)

        if (wfConfigId === null){
            console.log('[CF Wrokflow] No configurations found for holderId: ',holderId,' wfType:',wfType)
        }
        else{
            return wfConfigId
        }
        
    }
    catch(err){
        return err;
    }
}