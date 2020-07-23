exports.generateInsurersQuery = (params) => {
	console.log('ACA ', params);	
	
	let query = `SELECT * FROM dbo.Insurers WHERE 1=1`;
 	
	if(params.insurerId)
		query += ` AND InsurerID = ${params.insurerId}`;
	if(params.insurerName)
		query += ` AND InsurerName LIKE '%${params.insurerName}%'`;
	if(params.AMBestCompanyNumber)
		query += ` AND AMBestCompanyNumber = ${params.AMBestCompanyNumber}`;
	if(params.NAICCompanyNumber)
		query += ` AND NAICCompanyNumber = ${params.NAICCompanyNumber}`;
	if(params.filterTerm)
		query += ` AND (InsurerName LIKE '%${params.filterTerm}%' OR NAICCompanyNumber LIKE '%${params.filterTerm}%')`;

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

	console.log('generateInsurersQuery: ', query);
	return query;
}

exports.generateInsurersInsertQuery = (params) => {

	let query = `INSERT INTO dbo.Insurers (
		InsurerName
		, AMBestCompanyNumber
		, NAICCompanyNumber
	) VALUES (
		'${params.insurerName}'
		,${params.AMBestCompanyNumber || 0}
		,${params.NAICCompanyNumber || 0}
	)`;
	console.log('generateInsurersInsertQuery: ', query)
	return query;
}

exports.generateInsurersDeleteQuery = (params) => {

	let query = `DELETE dbo.Insurers WHERE InsurerID = ${params.insurerId}`;

	return query;
}

exports.generateInsurersFromAMBestQuery = (params) => {
	
	let query = `SELECT * FROM dbo.AMBest WHERE 1=1`;
 	
	if(params.insurerName)
		query += ` AND Company_Group_Name LIKE '%${params.insurerName}%'`;
	if(params.AMBestCompanyNumber)
		query += ` AND AM_Best_Company_Number = ${params.AMBestCompanyNumber}`;
	if(params.NAICCompanyNumber)
		query += ` AND NAIC_Company_Number = ${params.NAICCompanyNumber}`;

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

	console.log('generateInsurersAMBestQuery: ', query);
	return query;
}