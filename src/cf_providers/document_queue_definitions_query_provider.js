exports.generateDocumentQueueDefinitionsQuery = (params) => {
	let query = `SELECT
		QueueId
		, Name
		, TimeStamp
		, Archived
		, IsDefault
		FROM dbo.Document_Queue_Definitions
		WHERE 1=1`;

	if(params.queueId)
		query += ` AND QueueId = ${params.queueId}`;
	if(params.name)
    query += ` AND Name LIKE '%${params.name}%'`;
  if(typeof params.archived !== 'undefined')
		query += ` AND Archived = ${params.archived}`;
	if(typeof params.isDefault !== 'undefined')
		query += ` AND IsDefault = ${params.isDefault}`;	
	
	if (params.documentsPage) {
		if (params.userCFRoleId !== 8) {	// Admin Role
			query += ` AND IsDefault = 1 OR QueueId IN (
				SELECT QueueId FROM dbo.Users_Document_Queue WHERE UserId = ${params.userId}
			)`;
		}		
	}	
	
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
  
	console.log('generateDocumentQueueDefinitionsQuery: ', query);
	return query;
}

exports.generateDocumentQueueDefinitionsInsertQuery = (params) => {
	let query = `INSERT INTO dbo.Document_Queue_Definitions (
    Name
    , TimeStamp
    , Archived
	) VALUES (
    '${params.name}'
    , getDate()
    ,0
  )`;
  
  console.log(query)
	return query;
}

exports.generateDocumentQueueDefinitionsUpdateQuery = (params) => {
	let query = `UPDATE dbo.Document_Queue_Definitions SET `;

  if(params.name)
		query += `Name = '${params.name}',`;

  if(typeof params.archived !== undefined)
    query += `Archived = ${params.archived},`;

  // remove last comma.
	query = query.slice(0, -1);

	query += ` WHERE QueueId = ${params.queueId}`;

	console.log('QUERY', query);
	return query;
}

exports.generateDocumentQueueDefinitionsDeleteQuery = (params) => {
	let query = `DELETE dbo.Document_Queue_Definitions WHERE QueueId = ${params.queueId}`;
  return query;
}

/* Document Queue Users */
exports.generateDocumentQueueUsersQuery = (params) => {
	let query = `SELECT
		UD.QueueId
		, U.Id AS UserId
		, CONCAT(U.FirstName ,' ', U.LastName) AS UserName
		FROM dbo.Users_Document_Queue UD
		INNER JOIN dbo.Users U ON U.Id = UD.UserId
		WHERE 1=1`;

	if(params.queueId)
		query += ` AND UD.QueueId = ${params.queueId}`;
	if(params.userId)
		query += ` AND UD.UserId = ${params.userId}`;

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
  
	console.log('generateDocumentQueueUsersQuery: ', query);
	return query;
}

exports.generateDocumentQueueUsersInsertQuery = (params) => {
	let query = `INSERT INTO dbo.Users_Document_Queue (
		QueueId
		, UserId
	) VALUES (
		${params.queueId}
		, ${params.userId}
  )`;
  
  console.log('generateDocumentQueueUsersInsertQuery: ', query);	
	return query;
}

exports.generateDocumentQueueUsersDeleteQuery = (params) => {
	let query = `DELETE dbo.Users_Document_Queue 
		WHERE QueueId = ${params.queueId} AND UserId = ${params.userId}`;

	console.log('generateDocumentQueueUsersDeleteQuery: ', query);	
  return query;
}

exports.generateAvailableUsersPerRoleQuery = (params) => {	
	let query = `SELECT
		U.Id AS UserId
		, CONCAT(U.FirstName ,' ', U.LastName) AS UserName
		FROM dbo.Users U
		WHERE U.CFRoleId = '${params.userRoleId}'`;
	
	console.log('generateDocumentQueueAvailableUsersPerRoleQuery: ', query);
	return query;
}
