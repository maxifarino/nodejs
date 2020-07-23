exports.generateCoverageDocumentsQuery = (params) => {
	
	let query = `SELECT CD.*, D.FileName, D.DocumentTypeID, D.DateCreated 
		FROM dbo.Coverage_Documents CD
		INNER JOIN dbo.Documents D ON D.DocumentID = CD.DocumentID
		WHERE 1=1`;
	 
	if(params.coverageDocumentsId)
		query += ` AND CD.CoverageDocumentsID = ${params.coverageDocumentsId}`;
	if(params.documentId)
		query += ` AND CD.DocumentID = ${params.documentId}`;			
	if(params.coverageId)
		query += ` AND CD.CoverageID = ${params.coverageId}`;			
	if(params.fileName)
		query += ` AND D.FileName LIKE '%${params.fileName}%'`;	
	if(params.documentTypeId)
		query += ` AND D.DocumentTypeID = ${params.documentTypeId}`;
	if(params.dateCreated)
		query += ` AND D.DateCreated = '${params.dateCreated}'`;

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

exports.generateCoverageDocumentsInsertQuery = (params) => {

	let query = `DECLARE @exists INT;
		SELECT @exists = COUNT(*) FROM dbo.Coverage_Documents 
		WHERE DocumentID = ${params.documentId} 
		AND CoverageID = ${params.coverageId}	
		IF @exists = 0
		BEGIN
			INSERT INTO dbo.Coverage_Documents (
				DocumentID
				, CoverageID
			) VALUES (
				${params.documentId}
				,${params.coverageId}
			)
		END`;

	return query;
}

exports.generateCoverageDocumentsDeleteQuery = (params) => {
	
	let query = `DELETE dbo.Coverage_Documents 
		WHERE DocumentID = ${params.documentId} AND CoverageID = ${params.coverageId}`;

	return query;
}