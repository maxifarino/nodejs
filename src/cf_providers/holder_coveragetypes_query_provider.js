exports.generateHolderCoverageTypesQuery = (params) => {

	let query = `SELECT
		HCT.HolderCoverageTypeID
		, HCT.HolderID
		, HCT.CoverageTypeID
		, HCT.DisplayOrder
		, HCT.Archived
		, CT.Name
		, CT.Code
		, CT.DeficiencyMessage
		, CT.DeficiencyCode,
		(
		select count(p.Id) from Projects p, ProjectRequirementSets prs, RuleGroups rg, CoveragesTypes s_ct 
		where p.Archived = 0
			and prs.ProjectID = p.Id 
			and rg.RequirementSetID =prs.RequirementSetID 
			and s_ct.CoverageTypeID = rg.CoverageTypeID 
			and p.HiringClientId = HCT.HolderID 
			and s_ct.CoverageTypeID = CT.CoverageTypeID 
		) as totalActiveProyects	
		FROM dbo.HolderCoveragesTypes HCT
		INNER JOIN CoveragesTypes CT ON CT.CoverageTypeID = HCT.CoverageTypeID
		WHERE 1=1`;

	if(params.coverageTypeId)
		query += ` AND HCT.CoverageTypeID = ${params.coverageTypeId}`;
	if(params.holderId && params.holderId !== 'undefined')
		query += ` AND HCT.HolderID = ${params.holderId}`;
	if(params.name)
		query += ` AND CT.Name LIKE '%${params.name}%'`;
	if(params.archived)
		query += ` AND HCT.Archived = ${params.archived}`;
	if(params.code)
		query += ` AND CT.Code LIKE '%${params.code}%'`;

	if(params.orderBy) {
		query += ` ORDER BY ${params.orderBy} `;

		if(params.orderDirection){
			query += ` ${params.orderDirection} `;
		}
	}
	else {
		query += ` ORDER BY DisplayOrder`;
	}

	if(params.pageSize && !params.getTotalCount) {
		let pageNumber = (params.pageNumber) ? (params.pageNumber) : 1;
		query += ` OFFSET ${params.pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${params.pageSize} ROWS ONLY`;
	}

	console.log('generateHolderCoverageTypesQuery: ', query);
	return query;
}

exports.generateHolderCoverageTypesInsertQuery = (params) => {

	let query = `INSERT INTO dbo.HolderCoveragesTypes (
		HolderID
		, CoverageTypeID
		, DisplayOrder
		, Archived
	) VALUES (
		${params.holderId}
		, ${params.coverageTypeId}
		, ${params.displayOrder}
		, 0
  )`;

	console.log('generateHolderCoverageTypesInsertQuery: ', query);
	return query;
}


exports.generateHolderCoverageTypesUpdateQuery = (params) => {

	let query = `UPDATE dbo.HolderCoveragesTypes SET `;

  if(params.displayOrder)
    query += `DisplayOrder = ${params.displayOrder},`;

  if(typeof params.archived !== 'undefined')
      query += `Archived = ${params.archived},`;

  // remove last comma.
	query = query.slice(0, -1);

	query += ` WHERE HolderID = ${params.holderId} AND CoverageTypeID = ${params.coverageTypeId}`;

	console.log('UPDATE HOLDERCOVERAGETYPE', query);
	return query;
}

exports.generateHolderCoverageTypesDeleteQuery = (params) => {

	let query = `DELETE dbo.HolderCoveragesTypes WHERE
								HolderID = ${params.holderId} AND CoverageTypeID = ${params.coverageTypeId}`;

	return query;
}