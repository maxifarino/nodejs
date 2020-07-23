const query_provider = require('../cf_providers/state_manager_query_provider')
const sql_helper = require('../mssql/mssql_helper')



exports.SetAcceptedStatus = async (covAttrId, projectInsuredId, ruleGroupId, ruleId, status) => {
    const connection = await sql_helper.getConnection();
    
    // first update the coverage attribute status
    const updateAttrStatusQry = query_provider.getUpdateAttrStatusQuery(projectInsuredId, ruleGroupId, ruleId, status)
    await connection.request().query(updateAttrStatusQry)

    // check if this is the last coverage attribute with status != accepted
    // if so, we need to update the coverage status for this coverage
    const attrStatusQuery = query_provider.getCheckAttrsStatusQuery(projectInsuredId, ruleGroupId, status)
    const attrStatusResult = await connection.request().query(attrStatusQuery)

    if (attrStatusResult.recordset[0].attrsLeft === 0){
      const updateCovStatusQry = query_provider.getUpdateCoverageStatusQuery(projectInsuredId, ruleGroupId, 3)
      await connection.request().query(updateCovStatusQry)
      
      // check if this is the last coverage with status != accepted
      // if so, we need to update the compliance status for the project insured
      const covStatusesQry = query_provider.getCheckCoveragesAcceptedQuery(projectInsuredId)
      const covStatusQryResult = await connection.request().query(covStatusesQry)

      if(covStatusQryResult.recordset[0].covsLeft === 0){
        const updateCompStatusQry = query_provider.getUpdateComplianceStatusQuery(projectInsuredId, 1)
        await connection.request().query(updateCompStatusQry)
      }
    }
    
    connection.close();
}



exports.SetRejectStatus = async (covAttrId, projectInsuredId, ruleGroupId, ruleId) => {
  const connection = await sql_helper.getConnection();
  
  // update the coverage attribute status to rejected
  const updateAttrStatusQry = query_provider.getUpdateAttrStatusQuery(covAttrId, projectInsuredId, ruleGroupId, ruleId, 5)
  await connection.request().query(updateAttrStatusQry)

  // update the coverage status for this coverage to rejected
  const updateCovStatusQry = query_provider.getUpdateCoverageStatusQuery(projectInsuredId, ruleGroupId, 5)
  await connection.request().query(updateCovStatusQry)
  
  // update the compliance status for the project insured to non-compliant
  const updateCompStatusQry = query_provider.getUpdateComplianceStatusQuery(projectInsuredId, 6)
  await connection.request().query(updateCompStatusQry)

  
  connection.close();
}



exports.SetEscalateStatus = async (projectInsuredId, ruleGroupId, ruleId, currentState) => {
  const connection = await sql_helper.getConnection();
  
  // update the coverage attribute status
  const updateAttrStatusQry = query_provider.getEscalateAttrQuery(projectInsuredId, ruleGroupId, ruleId, currentState)
  await connection.request().query(updateAttrStatusQry)

  // update the coverage status for this coverage to escalated
  const updateCovStatusQry = query_provider.getUpdateCoverageStatusQuery(projectInsuredId, ruleGroupId, 13)
  await connection.request().query(updateCovStatusQry)
  
  // update the compliance status for the project insured to escalated
  const updateCompStatusQry = query_provider.getUpdateComplianceStatusQuery(projectInsuredId, 2)
  await connection.request().query(updateCompStatusQry)

  
  connection.close();
}



exports.SetExpiryStatus = async (projectInsuredId, ruleGroupId, ruleId, currentState) => {
  const connection = await sql_helper.getConnection();
  
  // update the coverage attribute status
  const updateAttrStatusQry = query_provider.getExpiryAttrQuery(projectInsuredId, ruleGroupId, ruleId, currentState)
  await connection.request().query(updateAttrStatusQry)

  // update the coverage status for this coverage to expired
  const updateCovStatusQry = query_provider.getUpdateCoverageStatusQuery(projectInsuredId, ruleGroupId, 12)
  await connection.request().query(updateCovStatusQry)
  
  // update the compliance status for the project insured to non-compliant
  const updateCompStatusQry = query_provider.getUpdateComplianceStatusQuery(projectInsuredId, 6)
  await connection.request().query(updateCompStatusQry)

  
  connection.close();
}



exports.SetPendingStatus = async (projectInsuredId, ruleGroupId, ruleId, defType) => {
  const connection = await sql_helper.getConnection();
  
  // update the coverage attribute status to "Pending Review"
  const updateAttrStatusQry = query_provider.getUpdateAttrStatusQuery(projectInsuredId, ruleGroupId, ruleId, 2)
  await connection.request().query(updateAttrStatusQry)

  // update the coverage status for this coverage to "Pending Review"
  const updateCovStatusQry = query_provider.getUpdateCoverageStatusQuery(projectInsuredId, ruleGroupId, 2)
  await connection.request().query(updateCovStatusQry)
  
  // update the compliance status for the project insured depending on the deficiency type
  switch(defType){
    // if the def type is major, we should set the status as "non-compliant"
    case 1: 
      const updateCompStatusQry1 = query_provider.getUpdateComplianceStatusQuery(projectInsuredId, 6)
      await connection.request().query(updateCompStatusQry1)
      break
    
    // if the def type for this waive is minor, the status should be "accepted w/minor defs"
    case 2:
      const updateCompStatusQry2 = query_provider.getUpdateComplianceStatusQuery(projectInsuredId, 15)
      await connection.request().query(updateCompStatusQry2)
      break
    
    // escape goat because we have a def type "additional req"
    default:
      const updateCompStatusQry = query_provider.getUpdateComplianceStatusQuery(projectInsuredId, 6)
      await connection.request().query(updateCompStatusQry)
      break

  }
  
  connection.close();
}