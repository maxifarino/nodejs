exports.generateEndorsementsQuery = (params) => {

	let query = `
		SELECT *, (
			select count(s_e.Id) from Endorsements s_e, RequirementSets_Endorsements re, ProjectRequirementSets prs, Projects p 
				where s_e.HolderId = e.HolderId 
				and s_e.Id = e.Id 
				and re.EndorsementID = s_e.Id
				and prs.RequirementSetID = re.RequirementSetID
				and prs.ProjectID = p.Id
				and p.Archived = 0
			) as totalActiveProyects
		FROM dbo.Endorsements e
		WHERE 1=1`;
 	
	if(params.endorsementId)
		query += ` AND e.Id = ${params.endorsementId}`;
	if(params.holderId)
		query += ` AND e.HolderId = ${params.holderId}`;
	if(params.name)
		query += ` AND e.Name LIKE '%${params.name}%'`;
	if(params.url)
		query += ` AND e.URL LIKE '%${params.url}%'`;
	if(params.code)
		query += ` AND e.Code LIKE '%${params.code}%'`;
	if(params.alwaysVisible)
		query += ` AND e.AlwaysVisible = ${params.alwaysVisible}`;

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
	
	console.log('ENDORSEMENT QUERY', query);
	return query;
}

exports.generateEndorsementsInsertQuery = (params) => {

	if (!params.url) params.url = '';

	let query = `INSERT INTO dbo.Endorsements (
		HolderId
		, Name
		, URL		
		, Code
		, AlwaysVisible
	) VALUES (
		${params.holderId}
		,'${params.name}'
		,'${params.url}'
		,'${params.code}'
		,${(params.alwaysVisible) ? 1 : 0}
	)`;

	return query;
}


exports.generateEndorsementsUpdateQuery = (params) => {

	let query = `UPDATE dbo.Endorsements SET `;
	
	if(params.holderId)
		query += `HolderId = ${params.holderId},`;
	
	if(params.name)
		query += `Name = '${params.name}',`;

	if(params.url)
		query += `URL = '${params.url}',`;
	
	if(params.displayOrder)
		query += `DisplayOrder = ${params.displayOrder},`;	

	if(params.code)
		query += `Code = '${params.code}',`;

	if(typeof params.alwaysVisible !== 'undefined')
		query += `AlwaysVisible = ${(params.alwaysVisible) ? 1 : 0},`;

	// remove last comma.
	query = query.slice(0, -1);

	query += ` WHERE Id = ${params.endorsementId}`;

	//console.log('QUERY', query);
	return query;
}

exports.generateEndorsementsDeleteQuery = (params) => {

	let query = `DELETE dbo.Endorsements WHERE Id = ${params.endorsementId}`;

	return query;
}