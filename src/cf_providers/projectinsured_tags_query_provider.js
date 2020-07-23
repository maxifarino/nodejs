exports.generateAllTagsListQuery = (params) => {
	
	let query = `SELECT 
		T.Id
		, T.Name
		, T.Description
		, T.TimeStamp
		, T.CFHolderId
		, T.CFdisplayOrder
		, T.CFdeletedFlag
		, PI.ProjectID
		, PI.ProjectInsuredID
		FROM dbo.Tags T
		INNER JOIN dbo.Projects P ON P.HiringClientId = T.CFHolderId
		INNER JOIN dbo.ProjectsInsureds PI ON PI.ProjectID = P.Id
		WHERE 1=1`;
 	
	if(params.projectInsuredId)
		query += ` AND PI.ProjectInsuredID = ${params.projectInsuredId}`;
	if(params.insuredId)
		query += ` AND PI.InsuredID = ${params.insuredId}`;		
	if(params.tagId)
		query += ` AND T.TagID = ${params.tagId}`;

	if(params.orderBy) {
		query += ` ORDER BY ${params.orderBy} `;
		
		if(params.orderDirection){
			query += ` ${params.orderDirection} `;
		}
	} else {
		query += ` ORDER BY T.CFdisplayOrder `;
	}

	//console.log('QUERY', query);
	return query;
}

exports.generateProjectInsuredTagsQuery = (params) => {
	
	let query = `SELECT 
		T.Id
		, T.Name
		, T.Description
		, T.TimeStamp
		, T.CFHolderId
		, T.CFdisplayOrder
		, T.CFdeletedFlag
		, PI.ProjectID
		, PI.ProjectInsuredID
		FROM dbo.ProjectInsureds_Tags PIT
		INNER JOIN dbo.ProjectsInsureds PI ON PI.ProjectInsuredID = PIT.ProjectInsuredID
		INNER JOIN dbo.Tags T ON T.Id = PIT.TagID
		WHERE 1=1`;
 	
	if(params.projectInsuredId)
		query += ` AND PI.ProjectInsuredID = ${params.projectInsuredId}`;
	if(params.insuredId)
		query += ` AND PI.InsuredID = ${params.insuredId}`;		
	if(params.tagId)
		query += ` AND T.TagID = ${params.tagId}`;

	query += `GROUP BY 
		T.Id
		, T.Name
		, T.Description
		, T.TimeStamp
		, T.CFHolderId
		, T.CFdisplayOrder
		, T.CFdeletedFlag
		, PI.ProjectID
		, PI.ProjectInsuredID`;


	if(params.orderBy) {
		query += ` ORDER BY ${params.orderBy} `;
		
		if(params.orderDirection){
			query += ` ${params.orderDirection} `;
		}
	} else {
		query += ` ORDER BY T.CFdisplayOrder `;
	}

	//console.log('QUERY', query);
	return query;
}

exports.generateProjectInsuredTagsInsertQuery = (params) => {

	let query = `DECLARE @exists INT;
		SELECT @exists = COUNT(*) FROM dbo.ProjectInsureds_Tags 
		WHERE ProjectInsuredID = ${params.projectInsuredId} 
		AND TagID = ${params.tagId}	
		IF @exists = 0
		BEGIN
			INSERT INTO dbo.ProjectInsureds_Tags (
				ProjectInsuredID
				, TagID
				, AssignedByID
				, AssignedDate
			) VALUES (
				${params.projectInsuredId}
				, ${params.tagId}
				, ${params.assignedById}
				, getDate()
			)
		END`;

	//console.log(query)
	return query;
}

exports.generateProjectInsuredTagsDeleteQuery = (params) => {

	let query = `DELETE dbo.ProjectInsureds_Tags 
		WHERE ProjectInsuredID = ${params.projectInsuredId} AND TagID = ${params.tagId}`;

	return query;
}