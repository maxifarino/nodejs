exports.generateProjectRequirementSetsQuery = (params) => {
	
	let query = `SELECT PRS.*, RS.Name 
		FROM dbo.ProjectRequirementSets PRS 
		INNER JOIN dbo.RequirementSets RS ON RS.Id = PRS.RequirementSetID
		WHERE 1=1`;
 	
	if(params.projectId)
		query += ` AND PRS.ProjectID = ${params.projectId}`;
	if(params.requirementSetId)
		query += ` AND PRS.RequirementSetID = ${params.requirementSetId}`;
	if(params.requirementSetName)
		query += ` AND RS.Name LIKE '%${params.requirementSetName}%'`;

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

	//console.log('QUERY', query);
	return query;
}

exports.generateProjectRequirementSetsInsertQuery = (params) => {

	let query = `DECLARE @exists INT;
		SELECT @exists = COUNT(*) FROM dbo.ProjectRequirementSets 
		WHERE ProjectID = ${params.projectId}
		IF @exists = 0
			BEGIN
				INSERT INTO dbo.ProjectRequirementSets (
					ProjectID
					, RequirementSetID
				) VALUES (
					${params.projectId}
					,${params.requirementSetId}
				)			
			END
		ELSE
			BEGIN
				UPDATE dbo.ProjectRequirementSets 
					SET RequirementSetID = ${params.requirementSetId}
					WHERE ProjectID = ${params.projectId}
			END
		`;

	return query;
}

exports.generateProjectRequirementSetsDeleteQuery = (params) => {

	let query = `DELETE dbo.ProjectRequirementSets 
		WHERE ProjectID = ${params.projectId} AND RequirementSetID = ${params.requirementSetId}`;

	return query;
}