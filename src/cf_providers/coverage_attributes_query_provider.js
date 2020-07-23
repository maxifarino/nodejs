exports.generateCoverageAttributesQuery = (params) => {
	
	let query = `SELECT * FROM dbo.CoverageAttributes WHERE 1=1`;
 	
	if(params.coverageId)
		query += ` AND CoverageID = ${params.coverageId}`;
	if(params.attributeID)
		query += ` AND AttributeID = ${params.attributeId}`;

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

exports.generateCoverageAttributesInsertQuery = (params) => {

	let query = `INSERT INTO dbo.CoverageAttributes (
		CoverageID
		, AttributeID
		, AttributeValue
	) VALUES (
		${params.coverageId}
		,${params.attributeId}
		,'${params.attributeValue}'
	)`;
	//console.log(query)
	return query;
}

exports.generateCoverageAttributesDeleteQuery = (params) => {

	let query = `DELETE dbo.CoverageAttributes 
		WHERE CoverageID = ${params.coverageId} AND AttributeID = ${params.attributeId}`;

	return query;
}
