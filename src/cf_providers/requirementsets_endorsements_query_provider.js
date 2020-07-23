exports.generateRequirementSetsEndorsementsQuery = (params) => {	
	let query = `SELECT 
		RSE.*
		, RS.Id
		, RS.Name AS RequirementSetName
		, RS.HolderId
		, E.Id AS EndorsementId
		, E.Name AS EndorsementName
		, E.AlwaysVisible
		, (select count(s_e.Id) from Endorsements s_e, RequirementSets_Endorsements re, ProjectRequirementSets prs, Projects p 
				where s_e.HolderId = e.HolderId 
				and s_e.Id = e.Id 
				and re.EndorsementID = s_e.Id
				and prs.RequirementSetID = re.RequirementSetID
				and prs.ProjectID = p.Id
				and p.Archived = 0
			) as totalActiveProyects
		FROM dbo.RequirementSets_Endorsements RSE 		
		INNER JOIN dbo.RequirementSets RS ON RS.Id = RSE.RequirementSetID
		INNER JOIN dbo.Endorsements E ON E.Id = RSE.EndorsementID	
		WHERE 1=1`;
 	
	if(params.requirementSetId)
		query += ` AND RSE.RequirementSetID = ${params.requirementSetId}`;
	if(params.endorsementId)
		query += ` AND RSE.EndorsementID = ${params.endorsementId}`;

	if(params.orderBy) {
		query += ` ORDER BY ${params.orderBy} `;
		
		if(params.orderDirection){
			query += ` ${params.orderDirection} `;
		}
	}

	if(params.pageSize && !params.getTotalCount) {
		let pageNumber = (params.pageNumber) ? (params.pageNumber) : 1;
		query += ` OFFSET ${params.pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${params.pageSize} ROWS ONLY`;		
	}

	console.log('generateRequirementSetsEndorsementsQuery: ', query);
	return query;
}

exports.generateRequirementSetsEndorsementsInsertQuery = (params) => {
	let query = `INSERT INTO dbo.RequirementSets_Endorsements (
		RequirementSetID
		, EndorsementID
	) VALUES (
		${params.requirementSetId}
		, ${params.endorsementId}
	)`;

	console.log(query);	
	return query;
}

exports.generateRequirementSetsEndorsementsDeleteQuery = (params) => {
	let query = `DELETE dbo.RequirementSets_Endorsements 
		WHERE RequirementSet_EndorsementID = ${params.requirementSetEndorsementId}`;

	return query;
}