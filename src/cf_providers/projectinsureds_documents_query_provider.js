exports.generateProjectInsuredDocumentsQuery = (params) => {	
	let query = `SELECT 
		D.DocumentID
		, D.FileName
		, D.DocumentTypeID
		, D.DateCreated
		, D.FirstName
		, D.LastName
		, D.Email
		, D.Phone
		, D.DocumentStatusID
		,	PI.InsuredID
		,	P.Id AS ProjectID
		, P.Name AS ProjectName
		,	HC.Id AS HolderID
		, HC.Name AS HolderName
		, DS.DocumentStatus
		, DT.DocumentTypeName AS DocumentType
		, COALESCE(CONCAT(U.FirstName,' ', U.LastName), NULL) AS UploadedByUser
		FROM dbo.Documents D
		INNER JOIN dbo.ProjectInsureds_Documents PID ON PID.DocumentID = D.DocumentID
		INNER JOIN dbo.ProjectsInsureds PI ON PI.ProjectInsuredID = PID.ProjectInsuredID
		INNER JOIN dbo.Projects P ON P.Id = PI.ProjectID
		INNER JOIN dbo.HiringClients HC ON HC.Id = P.HiringClientId
		LEFT JOIN dbo.DocumentStatus DS ON DS.DocumentStatusID = D.DocumentStatusID
		LEFT JOIN dbo.DocumentTypes DT ON DT.DocumentTypeID = D.DocumentTypeId
		LEFT JOIN dbo.Users U ON U.Id = D.UploadedByUserID
		WHERE 1=1`;
	 
	// if(params.projectInsuredDocumentId)
	// 	query += ` AND RSD.ProjectInsured_DocumentID = ${params.projectInsuredDocumentId}`;
	if(params.documentId)
		query += ` AND D.DocumentID = ${params.documentId}`;			
	if(params.projectInsuredId)
		query += ` AND PI.ProjectInsuredID = ${params.projectInsuredId}`;			
	if(params.fileName)
		query += ` AND D.FileName LIKE '%${params.fileName}%'`;	
	if(params.documentTypeId)
		query += ` AND D.DocumentTypeID = ${params.documentTypeId}`;
	if(params.dateCreated)
		query += ` AND D.DateCreated = '${params.dateCreated}'`;
	if(params.insuredId)
		query += ` AND D.SubcontractorID = ${params.insuredId}`;				
	if(params.projectId)
		query += ` AND D.ProjectID = ${params.projectId}`;					
	if(params.holderId)
		query += ` AND D.HiringClientID = ${params.holderId}`;						

	if(params.orderBy) {
		query += ` ORDER BY ${params.orderBy} `;
		
		if(params.orderDirection){
			query += ` ${params.orderDirection} `;
		}
	} else {
		query += ` ORDER BY D.DateCreated DESC`;
	}

	if(params.pageSize && !params.getTotalCount) {
		let pageNumber = (params.pageNumber) ? (params.pageNumber) : 1;
		query += ` OFFSET ${params.pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${params.pageSize} ROWS ONLY`;		
	}

	console.log('generateProjectInsuredDocumentsQuery: ', query);
	return query;
}

exports.generateProjectInsuredDocumentsInsertQuery = (params) => {
	let query = `DECLARE @exists INT;
		SELECT @exists = COUNT(*) FROM dbo.ProjectInsureds_Documents 
		WHERE DocumentID = ${params.documentId} 
		AND ProjectInsuredID = ${params.projectInsuredId}	
		IF @exists = 0
		BEGIN
			INSERT INTO dbo.ProjectInsureds_Documents (
				DocumentID
				, ProjectInsuredID
				, Status
			) VALUES (
				${params.documentId}
				,${params.projectInsuredId}
				,'${params.status}'
			)
		END`;

	console.log('generateProjectInsuredDocumentsInsertQuery: ', query);	
	return query;
}

exports.generateProjectInsuredDocumentsDeleteQuery = (params) => {	
	let query = `DELETE dbo.ProjectInsureds_Documents
		WHERE DocumentID = ${params.documentId} AND ProjectInsuredID = ${params.projectInsuredId}`;

	return query;
}