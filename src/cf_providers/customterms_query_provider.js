exports.generateCustomTermsQuery = (params) => {
	
	let query = `SELECT 
		CT.CustomTermId
		, CT.HolderId
		, CT.OriginalTerm
		, CT.CustomTerm
		, HC.Name AS HolderName
		FROM dbo.CustomTerms CT 
		INNER JOIN dbo.HiringClients HC ON HC.Id = CT.HolderId
		WHERE 1=1`;
 	
	if(params.customTermId)
		query += ` AND CT.CustomTermId = ${params.customTermId}`;
	if(params.holderId)
		query += ` AND CT.HolderId = ${params.holderId}`;
	if(params.originalTerm)
		query += ` AND CT.OriginalTerm LIKE '%${params.originalTerm}%'`;
	if(params.customTerm)
		query += ` AND CT.CustomTerm LIKE '%${params.customTerm}%'`;
	if(params.holderName)
		query += ` AND HC.Name LIKE '%${params.holderName}%'`;

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

exports.generateCustomTermsInsertQuery = (params) => {

	let query = `INSERT INTO dbo.CustomTerms (
		HolderId
		, CustomTerm
		, OriginalTerm`;

	query += `)	VALUES (
		${params.holderId}
		,'${params.customTerm}'
		,'${params.originalTerm}' `;

	query += `)`;
	
	return query;
}


exports.generateCustomTermsUpdateQuery = (params) => {

	let query = `UPDATE dbo.CustomTerms SET `;

	if(params.holderId)
		query += `HolderId = ${params.holderId},`;
	
	if(params.customTerm)
		query += `CustomTerm = '${params.customTerm}',`;

	if(params.originalTerm)
		query += `OriginalTerm = '${params.originalTerm}',`;

  // remove last comma.
	query = query.slice(0, -1);

	query += ` WHERE CustomTermId = ${params.customTermId}`;

	return query;
}

exports.generateCustomTermsDeleteQuery = (params) => {

	let query = `DELETE dbo.CustomTerms WHERE CustomTermId = ${params.customTermId}`;

	return query;
}