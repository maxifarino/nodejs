exports.generateDocumentsQuery = (params) => {
	
	let query = `select D.*, DS.DocumentStatus, SC.Name 'insuredName', PI.ProjectInsuredID 'projectInsuredId' from Documents D
         INNER JOIN dbo.DocumentStatus DS ON DS.DocumentStatusID = D.DocumentStatusID
         INNER JOIN dbo.SubContractors SC ON SC.Id = D.SubcontractorID
         INNER JOIN dbo.Projects PR ON PR.Id = D.ProjectID
         INNER JOIN dbo.ProjectsInsureds PI ON PI.ProjectID = PR.Id AND PI.InsuredID = SC.Id
         WHERE 1=1`;
 	
	if(params.documentId)
		query += ` AND DocumentID = ${params.documentId}`;			
	if(params.name)
		query += ` AND FileName LIKE '%${params.name}%'`;	
	if(params.documentTypeId)
		query += ` AND DocumentTypeID = ${params.documentTypeId}`;
	if(params.dateCreated)
		query += ` AND DateCreated = '${params.dateCreated}'`;

	if(params.orderBy) {
		query += ` ORDER BY ${params.orderBy} `;
		
		if(params.orderDirection){
			query += ` ${params.orderDirection} `;
		}
	}

	if(params.pageSize && !params.getTotalCount && !params.getOne) {
		let pageNumber = (params.pageNumber) ? (params.pageNumber) : 1;
		query += ` OFFSET ${params.pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${params.pageSize} ROWS ONLY`;		
	}

	console.log('generateDocumentsQuery: ', query);
	return query;
}

exports.generateDocumentsPageQuery = (params) => {	
	let query = `SELECT 
		D.DocumentID
		, D.FileName
		, D.DocumentTypeId
		, D.FirstName
		, D.LastName
		, D.Email
		, D.Phone
		, D.DocumentStatusID
		, D.GarbageFlag
		, D.UrgentFlag
		, D.UrgentUserID
		, D.UrgentDateMarked
		, D.DateCreated
		, D.UploadedByUserID
		, HC.Id AS HolderID
		, HC.Name AS HolderName
		, SC.Id AS InsuredID
		, SC.Name AS InsuredName
		, PR.Id AS ProjectID
		, PR.Name AS ProjectName
		, PI.ProjectInsuredID
		, DS.DocumentStatus
		, (SELECT TOP 1 CertificateId FROM dbo.CertificateOfInsurance WHERE DocumentId = D.DocumentID) AS CertificateID
		FROM dbo.Documents D
		INNER JOIN dbo.HiringClients HC ON HC.Id = D.HiringClientID
		INNER JOIN dbo.SubContractors SC ON SC.Id = D.SubcontractorID
		INNER JOIN dbo.Projects PR ON PR.Id = D.ProjectID
		INNER JOIN dbo.ProjectsInsureds PI ON PI.ProjectID = PR.Id AND PI.InsuredID = SC.Id
		INNER JOIN dbo.DocumentStatus DS ON DS.DocumentStatusID = D.DocumentStatusID
		WHERE 1 = 1`;
 	
	if(params.documentId)
		query += ` AND D.DocumentID = ${params.documentId}`;			
	if(params.name)
		query += ` AND D.FileName LIKE '%${params.name}%'`;	
	if(params.documentStatusId)
		query += ` AND D.DocumentStatusID = ${params.documentStatusId}`;	
	if(params.documentTypeId)
		query += ` AND D.DocumentTypeID = ${params.documentTypeId}`;
	if(params.dateCreated)
		query += ` AND D.DateCreated = '${params.dateCreated}'`;
	
	if(params.holderId)
		query += ` AND HC.Id = ${params.holderId}`;
	if(params.insuredId)
		query += ` AND SC.Id = ${params.insuredId}`;
	if(params.projectId)
		query += ` AND PR.Id = ${params.projectId}`;
	if(typeof params.urgent !== 'undefined')
		query += ` AND D.UrgentFlag = ${params.urgent}`;	
	if(typeof params.garbage !== 'undefined')
		query += ` AND D.GarbageFlag = ${params.garbage}`;

	if (params.availableHCs && params.availableHCs.length > 0) {
		query += ` AND HC.Id IN (${params.availableHCs})`;
	}

	if (params.documentsPage) {
		if (!params.queueId) {
			query += ` AND D.DocumentID NOT IN (
				SELECT DocumentId FROM dbo.Document_Queue
			)`;
		} else {
			query += ` AND D.DocumentID IN (
				SELECT DocumentId FROM dbo.Document_Queue WHERE QueueId = ${params.queueId}
			)`;
		}
		
		if (params.isDataEntryClerk) {
			query += ` AND D.DocumentID IN (
				SELECT DocumentId FROM dbo.Document_Queue WHERE QueueId IN (
					SELECT QueueId FROM Users_Document_Queue WHERE UserId = ${params.userId}
				) AND QueueId <> 1
			)
			AND D.DocumentStatusID = 4 AND D.DocumentTypeId <> 0`;
		}
	}

	if(params.orderBy) {
		if (params.orderBy === 'UrgentFlag') {
			query += ` ORDER BY UrgentFlag DESC, DateCreated DESC`;
		} else if (params.orderBy === 'GarbageFlag') {
			query += ` ORDER BY GarbageFlag DESC, DateCreated DESC`;
		}	else {
			query += ` ORDER BY ${params.orderBy} `;
			
			if(params.orderDirection){
				query += ` ${params.orderDirection} `;
			}
		}
	}

	if(params.pageSize && !params.getTotalCount) {
		let pageNumber = (params.pageNumber) ? (params.pageNumber) : 1;
		query += ` OFFSET ${params.pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${params.pageSize} ROWS ONLY`;		
	}

	console.log('generateDocumentsPageQuery: ', query);
	return query;
}

exports.generateDocumentsInsertQuery = (params) => {
	
	let _query = `INSERT INTO dbo.Documents (`;

	if (params.name)
		_query += ` FileName`;

	if (!isNaN(params.documentTypeId))
		_query += `,DocumentTypeID`;

	_query += `,DateCreated`;

	if (params.firstName)
		_query += `,FirstName`;

	if (params.lastName)
		_query += `,LastName`;

	if (params.email)
		_query += `,Email`;

	if (params.phone)
		_query += `,Phone`;

	if (params.documentStatusId)
		_query += `,DocumentStatusID`;

	if (params.hiringClientId)
		_query += `,HiringClientID`;

	if (params.projectId)
		_query += `,ProjectID`;

	if (params.subcontractorId)
		_query += `,SubcontractorID`;

	if (params.userId)
		_query += `,UploadedByUserID`;

	_query += `) VALUES (`;

	if (params.name)
		_query += ` '${params.name}'`;

	if (!isNaN(params.documentTypeId))
		_query += ` ,'${params.documentTypeId}'`;


	_query += `,GETDATE()`;

	if (params.firstName)
		_query += ` ,'${params.firstName}'`;

	if (params.lastName)
		_query += ` ,'${params.lastName}'`;

	if (params.email)
		_query += ` ,'${params.email}'`;

	if (params.phone)
		_query += ` ,'${params.phone}'`;

	if (!isNaN(params.documentStatusId))
		_query += ` ,'${params.documentStatusId}'`;

	if (!isNaN(params.hiringClientId))
		_query += ` ,'${params.hiringClientId}'`;

	if (!isNaN(params.projectId))
		_query += ` ,'${params.projectId}'`;

	if (!isNaN(params.subcontractorId))
		_query += ` ,'${params.subcontractorId}'`;

	if (!isNaN(params.userId))
		_query += ` ,'${params.userId}'`;

	_query += `)`;

	console.log('_query', _query);

	return _query;
}

exports.generateDocumentsDeleteQuery = (params) => {

	let query = `DECLARE @deletedDocuments TABLE(FileName nvarchar(50));
		DELETE FROM dbo.Documents 
		OUTPUT DELETED.FileName INTO @deletedDocuments
		WHERE DocumentID = ${params.documentId};
		SELECT FileName FROM @deletedDocuments;`;

	return query;
}

exports.generateDocumentsUpdateQuery = (params) => {

	let query = `UPDATE dbo.Documents SET `;
		
  if(params.hiringClientId)
		query += ` HiringClientID = ${params.hiringClientId},`;
	if(params.projectId)
		query += ` ProjectID = ${params.projectId},`;
	if(params.subcontractorId)
		query += ` SubcontractorID = ${params.subcontractorId},`;
	if(params.documentTypeId)
		query += ` DocumentTypeID = ${params.documentTypeId},`;
	if(params.documentStatusId)
		query += ` DocumentStatusID = ${params.documentStatusId},`;
	if(typeof params.garbage !== 'undefined')
		query += ` GarbageFlag = ${params.garbage},`;
	if(typeof params.urgent !== 'undefined') {
		query += ` UrgentFlag = ${params.urgent},`;
		if (params.urgent === 1) {
			query += ` UrgentUserID = ${params.userId}, UrgentDateMarked = GETDATE() `;
		}
	}		

  // remove last comma.
	query = query.slice(0, -1);

	query += ` WHERE DocumentId = ${params.documentId}`;

	console.log('generateDocumentsUpdateQuery: ', query);
	return query;
}

exports.generateDocumentStatusQuery = (params) => {	
	let query = `SELECT * FROM dbo.DocumentStatus`;
	return query;
}

exports.generateDocumentTypesQuery = (params) => {	
	let query = `SELECT * FROM dbo.DocumentTypes`;
	return query;
}

exports.generateCheckAvailableHCPerUserQuery = (params) => {	
	let query = `DECLARE @UserID INT;
		SET @UserID = ${params.userId};
		SELECT DISTINCT STRING_AGG(CAST (HiringClientID AS INT), ',') AS availableHCs
		FROM Users_HiringClients
		WHERE UserID = @UserID;`;
	return query;
}

exports.generateDocumentQueueInsertQuery = (documentId, queueId) => {
	let query = `
		DELETE FROM dbo.Document_Queue 
			WHERE DocumentId = ${documentId} 
			AND QueueId = ${queueId};
		INSERT INTO dbo.Document_Queue (
			DocumentId
			, QueueId
			, TimeStamp
		) VALUES (
			${documentId}
			, ${queueId}
			, GETDATE()
		)`;
	console.log('generateDocumentQueueInsertQuery: ', query);	
	return query;
}