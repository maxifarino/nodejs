exports.generateCoverageTypesQuery = (params) => {

	let query = `SELECT
		CoverageTypeID
		, Name
		, Code
		, DeficiencyMessage
		, DeficiencyCode,
		(SELECT COUNT(*)
			FROM CoveragesTypes  ct,
					RuleGroups  rg,
					RequirementSets rs,
					ProjectRequirementSets prs,
					Projects p
			WHERE  ct.CoverageTypeID = rg.CoverageTypeID AND
					rg.RequirementSetID = rs.Id AND
					rs.Id = prs.RequirementSetID AND
						p.Id = prs.ProjectID AND
						p.Archived = 0 AND
						ct.CoverageTypeID = dbo.CoveragesTypes.CoverageTypeID) as totalActiveProyects
		FROM dbo.CoveragesTypes
		WHERE 1=1`;

	if(params.coverageTypeId)
		query += ` AND CoverageTypeID = ${params.coverageTypeId}`;
	if(params.name)
    query += ` AND Name LIKE '%${params.name}%'`;
  if(params.code)
		query += ` AND Code LIKE '%${params.code}%'`;

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

	console.log('QUERY', query);
	return query;
}

exports.generateCoverageTypesInsertQuery = (params) => {

	let query = `INSERT INTO dbo.CoveragesTypes (
    Name
    , Code
    , DeficiencyMessage
		, DeficiencyCode
	) VALUES (
    '${params.name}'
    ,'${params.code}'
    ,'${params.deficiencyMessage}'
    ,'${params.deficiencyCode}'
	)`;

  console.log(query)
	return query;
}


exports.generateCoverageTypesUpdateQuery = (params) => {

	let query = `UPDATE dbo.CoveragesTypes SET `;

  if(params.name)
		query += `Name = '${params.name}',`;

	if(params.code)
    query += `Code = '${params.code}',`;

  if(params.deficiencyMessage)
    query += `DeficiencyMessage = '${params.deficiencyMessage}',`;

  if(params.deficiencyCode)
    query += `DeficiencyCode = '${params.deficiencyCode}',`;

  // remove last comma.
	query = query.slice(0, -1);

	query += ` WHERE CoverageTypeID = ${params.coverageTypeId}`;

	//console.log('QUERY', query);
	return query;
}

exports.generateCoverageTypesDeleteQuery = (params) => {

	let query = `DELETE dbo.CoveragesTypes WHERE CoverageTypeID = ${params.coverageTypeId}`;

	return query;
}