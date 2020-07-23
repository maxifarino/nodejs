exports.generateInsurersCoveragesQuery = (params) => {
	
	let query = `SELECT * FROM dbo.Insurers_Coverages WHERE 1=1`;
 	
	if(params.coverageId)
		query += ` AND CoverageID = ${params.coverageId}`;
	if(params.insurerId)
		query += ` AND InsurerID = ${params.insurerId}`;

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

exports.generateInsurersCoveragesInsertQuery = (params) => {

	let query = `INSERT INTO dbo.Insurers_Coverages (
		CoverageID
		, InsurerID
	) VALUES (
		,${params.coverageId}
		,${params.insurerId}
	)`;
	//console.log(query)
	return query;
}

exports.generateInsurersCoveragesDeleteQuery = (params) => {

	let query = `DELETE dbo.Insurers_Coverages 
		WHERE CoverageID = ${params.coverageId} AND InsurerID = ${params.insurerId}`;

	return query;
}