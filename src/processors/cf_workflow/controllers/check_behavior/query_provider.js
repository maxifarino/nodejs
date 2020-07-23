exports.getStatusCheckQuery = (config, projectInsured) => {
    query = `SELECT * 
             FROM vw_MasterCoverageAttributesStatus
             WHERE ProjectInsuredId = ${projectInsured}`

    if(config.documentStatus !== 'NULL'){
        query += ` AND DocumentStatusID = ${config.documentStatus}`
    }
    
    if(config.coverageAttributeStatus !== 'NULL'){
        query += ` AND CoverageStatusID = ${config.coverageAttributeStatus}`
    }
    
    if(config.complianceStatus !== 'NULL'){
        query += ` AND ComplianceStatusID = ${config.complianceStatus}`
    }

    return query
}