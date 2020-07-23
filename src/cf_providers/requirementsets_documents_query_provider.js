exports.generateRequirementSetsDocumentsQuery = (params) => {
	
	let query = `SELECT RSD.*, D.FileName, D.DocumentTypeID 
		FROM dbo.RequirementSets_Documents RSD
		INNER JOIN dbo.Documents D ON D.DocumentID = RSD.DocumentID
		WHERE 1=1`;
	 
	if(params.requirementSetsDocumentId)
		query += ` AND RSD.RequirementSetsDocumentID = ${params.requirementSetsDocumentId}`;
	if(params.documentId)
		query += ` AND RSD.DocumentID = ${params.documentId}`;			
	if(params.requirementSetId)
		query += ` AND RSD.RequirementSetID = ${params.requirementSetId}`;			
	if(params.fileName)
		query += ` AND D.FileName LIKE '%${params.fileName}%'`;	
	if(params.documentTypeId)
		query += ` AND D.DocumentTypeID = ${params.documentTypeId}`;

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

exports.generateRequirementSetsDocumentsInsertQuery = (params) => {

	let query = `DECLARE @exists INT;
		SELECT @exists = COUNT(*) FROM dbo.RequirementSets_Documents 
		WHERE DocumentID = ${params.documentId} 
		AND RequirementSetID = ${params.requirementSetId}	
		IF @exists = 0
		BEGIN
			INSERT INTO dbo.RequirementSets_Documents (
				DocumentID
			 , RequirementSetID
			) VALUES (
				${params.documentId}
			 , ${params.requirementSetId}
			)
		END`;

	return query;
}

exports.generateRequirementSetsDocumentsDeleteQuery = (params) => {
	
	let query = `DELETE dbo.RequirementSets_Documents 
		WHERE DocumentID = ${params.documentId} AND RequirementSetID = ${params.requirementSetId}`;
	
	return query;
}