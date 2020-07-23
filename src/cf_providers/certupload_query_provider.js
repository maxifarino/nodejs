exports.generateValidateHashQuery = (params) => {
	
	let query = `SELECT
		PRI.ProjectInsuredID AS projectInsuredId
		, PRI.ProjectID AS projectId
		, PRI.InsuredID AS insuredId
    , P.Name AS projectName
    , SC.Name AS insuredName
    , HC.Id AS holderId
    , HC.Name AS holderName
    , PRIC.ProjectInsuredComplianceStatusID AS complianceStatusId
		, PRIC.StatusName AS complianceStatus
		, (SELECT TOP 1 RequirementSetId FROM dbo.ProjectRequirementSets PRS WHERE PRS.ProjectID = PRI.ProjectID ORDER BY ProjectRequirementSetID DESC) AS reqSetId
		FROM dbo.ProjectsInsureds PRI
    INNER JOIN dbo.Projects P ON P.Id = PRI.ProjectID
    INNER JOIN dbo.SubContractors SC ON SC.Id = PRI.InsuredID
    INNER JOIN dbo.HiringClients HC ON HC.Id = P.HiringClientId
    INNER JOIN dbo.ProjectInsured_ComplianceStatus PRIC ON PRIC.ProjectInsuredComplianceStatusID = PRI.ComplianceStatusID
		WHERE 
		CONVERT(VARCHAR(64), HashBytes('SHA2_256', 
			CONCAT(
				CAST(ProjectInsuredID AS VARCHAR(10)),
				CAST(ProjectID AS VARCHAR(10)),
				CAST(InsuredID AS VARCHAR(10))
			)
		), 2) = '${params.hash}'`;
 			
	console.log('QUERY', query);
	return query;
}

// exports.generateAgenciesQuery = (params) => {	
// 	let query = `SELECT * FROM dbo.Agencies WHERE 1=1`;
 	
// 	if(params.agencyId)
// 		query += ` AND AgencyId = ${params.agencyId}`;
// 	if(params.name)
//     query += ` AND Name LIKE '%${params.name}%'`;
//   if(params.city)
// 		query += ` AND City LIKE '%${params.city}%'`;
// 	if(params.state)
// 		query += ` AND State LIKE '%${params.state}%'`;
	
// 	if(params.orderBy) {
// 		query += ` ORDER BY ${params.orderBy} `;
		
// 		if(params.orderDirection){
// 			query += ` ${params.orderDirection} `;
// 		}
// 	}

// 	if(params.pageSize && !params.getTotalCount) {
// 		let pageNumber = (params.pageNumber) ? (params.pageNumber) : 1;
// 		query += ` OFFSET ${params.pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${params.pageSize} ROWS ONLY`;		
// 	}

// 	//console.log('QUERY', query);
// 	return query;
// }

// exports.generateAgenciesInsertQuery = (params) => {

// 	let query = `INSERT INTO dbo.Agencies (
//     Name
//     , City
// 		, State
// 	) VALUES (
//     '${params.name}'
// 		,'${params.city}'
// 		,'${params.state}' 
// 	)`;
	
//   //console.log(query)
// 	return query;
// }

// exports.generateAgenciesUpdateQuery = (params) => {

// 	let query = `UPDATE dbo.Agencies SET `;
	  
//   if(params.name)
// 		query += `Name = '${params.name}',`;

// 	if(params.city)
//     query += `City = '${params.city}',`;
    
// 	if(params.state)
// 		query += `State = '${params.state}',`;

//   // remove last comma.
// 	query = query.slice(0, -1);

// 	query += ` WHERE AgencyId = ${params.agencyId}`;

// 	//console.log('QUERY', query);
// 	return query;
// }

// exports.generateAgenciesDeleteQuery = (params) => {

// 	let query = `DELETE dbo.Agencies WHERE AgencyId = ${params.agencyId}`;
// 	console.log(query)
// 	return query;
// }