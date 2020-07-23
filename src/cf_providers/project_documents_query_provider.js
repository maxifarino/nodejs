exports.generateProjectDocumentsQuery = (params) => {
	
	let query = `SELECT RSD.*, D.FileName, D.DocumentTypeID, D.DateCreated 
		FROM dbo.Projects_Documents RSD
		INNER JOIN dbo.Documents D ON D.DocumentID = RSD.DocumentID
		WHERE 1=1`;
	 
	if(params.projectsDocumentId)
		query += ` AND RSD.ProjectsDocumentID = ${params.projectsDocumentId}`;
	if(params.documentId)
		query += ` AND RSD.DocumentID = ${params.documentId}`;			
	if(params.projectId)
		query += ` AND RSD.ProjectID = ${params.projectId}`;			
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

exports.generateProjectDocumentsInsertQuery = (params) => {

	let query = `DECLARE @exists INT;
		SELECT @exists = COUNT(*) FROM dbo.Projects_Documents 
		WHERE DocumentID = ${params.documentId} 
		AND ProjectID = ${params.projectId}	
		IF @exists = 0
		BEGIN
			INSERT INTO dbo.Projects_Documents (
				DocumentID
				, ProjectID
			) VALUES (
				${params.documentId}
				,${params.projectId}
			)
		END`;

	return query;
}

exports.generateProjectDocumentsDeleteQuery = (params) => {
	
	let query = `DELETE dbo.Projects_Documents 
		WHERE DocumentID = ${params.documentId} AND ProjectID = ${params.projectId}`;

	return query;
}