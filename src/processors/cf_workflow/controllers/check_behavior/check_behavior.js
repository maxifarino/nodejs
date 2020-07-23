const wf_utils = require('../../utils')
const sql_helper = require('../../../../mssql/mssql_helper');
const query_provider = require('./query_provider')


exports.CheckStatus = async (config, workflow) => {
    try {
        const query = query_provider.getStatusCheckQuery(config, workflow.ProjectInsuredId)
        //console.log(query)
        const connection = await sql_helper.getConnection()
        const result = await connection.request().query(query)
        connection.close()

        // if there are no results terminate the workflow as nothing matches the check condition(s)
        if (result.recordset.length === 0){
            await wf_utils.updateWorkflowStatus(workflow.InstanceId, 'Terminated')
        }
        
        else {
            // if iterations are maxed, then move to next step
            if (workflow.IterationCount >= config.iterations){
                await wf_utils.goToNextStep(workflow)
            }
            
            // increment the iteration count if 24 hs have passed fron last iteration
            else {
                const lastIterHours = Math.abs(new Date() - workflow.LastUpdate) / 36e5;
                if (lastIterHours >= 24){
                    await wf_utils.incrementIteration(workflow.InstanceId)
                }
            }
        }
    }
    catch(err){
        return err;
    }
}