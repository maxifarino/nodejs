exports.generateProjectInsuredComplianceStatusQuery = (params) => {
	
	let query = `SELECT * FROM dbo.ProjectInsured_ComplianceStatus WHERE 1=1`;
 	
	if(params.projectInsuredComplianceStatusId)
		query += ` AND ProjectInsuredComplianceStatusID = ${params.projectInsuredComplianceStatusId}`;
	if(params.statusName)
		query += ` AND StatusName LIKE '%${params.statusName}%'`;

	if(params.orderBy) {
		query += ` ORDER BY ${params.orderBy} `;
		
		if(params.orderDirection){
			query += ` ${params.orderDirection} `;
		}
	}

	return query;
}