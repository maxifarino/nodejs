exports.generateProjectInsuredDeficienciesQuery = (params) => {
	
	let query = `SELECT * FROM dbo.ProjectInsuredDeficiencies WHERE 1=1`;
 	
	if(params.projectInsuredDeficiencyId)
		query += ` AND ProjectInsuredDeficiencyID = ${params.projectInsuredDeficiencyId}`;
	if(params.deficiencyText)
		query += ` AND DeficiencyText LIKE '%${params.deficiencyText}%'`;
	if(params.deficiencyTypeId)
		query += ` AND DeficiencyTypeID = ${params.deficiencyTypeId}`;
	if(params.deficiencyStatusId)
		query += ` AND DeficiencyStatusID = ${params.deficiencyStatusId}`;
	if(params.ruleId)
		query += ` AND RuleID = ${params.ruleId}`;
	if(params.createdDate)
		query += ` AND CreatedDate = ${params.createdDate}`;
	if(params.modifiedDate)
		query += ` AND ModifiedDate = ${params.modifiedDate}`;
	if(params.modifiedById)
		query += ` AND ModifiedByID = ${params.modifiedById}`;

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

exports.generateProjectInsuredDeficienciesInsertQuery = (params) => {
	
	let query = `INSERT INTO dbo.ProjectInsuredDeficiencies (
		DeficiencyText
		, DeficiencyTypeID
		, DeficiencyStatusID
		, ProjectInsuredID
		, RuleID
		, CreatedDate
		, ModifiedDate
		, ModifiedByID
	) VALUES (
		'${params.deficiencyText}'
		,${params.deficiencyTypeId}
		,${params.deficiencyStatusId}
		,${params.projectInsuredId}
		,${params.ruleId}
		,getDate()
		,${params.modifiedDate}
		,${params.modifiedById}
	)`;

	return query;
}

exports.generateProjectInsuredDeficienciesDeleteQuery = (params) => {

	let query = `DELETE dbo.ProjectInsuredDeficiencies WHERE ProjectInsuredDeficiencyID = ${params.projectInsuredDeficiencyId}`;

	returnPquery;
}

exports.generateProjectInsuredDeficienciesUpdateQuery = (params) => {
	
	let query = `UPDATE dbo.ProjectInsuredDeficiencies SET `;
	
	query += `ModifiedDate = getDate(),`;	
	query += `ModifiedByID = ${params.modifiedById},`;	

	if(params.deficiencyText)
		query += `DeficiencyText = ${params.deficiencyText},`;
	
	if(params.deficiencyTypeID)
		query += `DeficiencyTypeID = ${params.deficiencyTypeId},`;

	if(params.deficiencyStatusId)
		query += `DeficiencyStatusID = ${params.deficiencyStatusId},`;

	// remove last comma.
	query = query.slice(0, -1);

	query += ` WHERE ProjectInsuredDeficiencyID = ${params.projectInsuredDeficiencyId}`;

	console.log('QUERY', query);
	return query;
}