exports.generateLogsQuery = function(queryParams) {

  let {
    getTotalCount,
    eventType,
    userId,
    payload,
    timeStamp,
    searchTerm,
    systemModuleId,
    orderBy,
    orderDirection,
    pageSize,
    pageNumber,

  } = queryParams

	let query = `SELECT EL.id, 
						EL.eventType, 
						ET.description, 
						ET.readableDescription, 
						EL.userId, 
						US.firstName + ' ' + US.lastName as name, 
						EL.payload, 
						EL.timeStamp `;

	if(getTotalCount == true) {
		query = `SELECT COUNT(*) totalCount `;
	}						

	query += ` FROM EventsLog EL, LogEventTypes ET, Users US `;

	query += ` WHERE US.ID = EL.UserId AND ET.ID = EL.EventType `;

	if(eventType != null)
		query += ` AND EL.EventType=` + eventType;
	
	if(userId != null)
		query += ` AND EL.UserId=` + userId;

	if(payload != null)
		query += ` AND EL.Payload=` + payload;

	if(timeStamp != null)
		query += ` AND EL.TimeStamp=` + timeStamp;

	if(searchTerm != null)
		query += ` AND (ET.ReadableDescription like '%${searchTerm}%' 
						OR US.FirstName like '%${searchTerm}%'
						OR US.LastName like '%${searchTerm}%'
						OR (US.FirstName + ' ' + US.LastName) like '%${searchTerm}%'
						)`;

	if(systemModuleId != null)
		query += ` AND EventType in 
						(select id from LogEventTypes where ModuleId = ${systemModuleId}) `;

	if(getTotalCount == false) {
		if(orderBy != null)
			query += ` ORDER BY ` + orderBy;

		if(orderBy != null && orderDirection != null)
			query += ` ` + orderDirection;

		if(orderBy == null || orderDirection == null)
			query += ` ORDER BY EL.Id DESC `;
	}

	if(pageNumber && getTotalCount == false) {
		query += ` OFFSET ${pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${pageSize} ROWS ONLY`;
  }
  
  console.log('logs! '.repeat(20))
  console.log('\n' + queryParams)
  console.log('\n' + query)

	return query;
}

exports.generateLogInsertQuery = function(queryParams) {
	let query = ` INSERT INTO EventsLog 
	  (	EventType,
	  	UserId,
	  	Payload)
	VALUES (
		'${queryParams.EventType}',
		'${queryParams.UserId}',
		'${queryParams.Payload}'
	)`;

	return query;
}

exports.generateLogEventTypeIdQuery = function(queryParams) {
	let query = `SELECT Id
		FROM LogEventTypes
		WHERE Description = '${queryParams.eventDescription}'`;

	return query;
}

exports.generateLogUsersQuery = function(queryParams) {
	return  ` SELECT id, firstName + ' ' + lastName name FROM Users WHERE Id IN 
				(SELECT UserId FROM EventsLog)
				ORDER BY name ASC `;
}

exports.generateModulesQuery = function(queryParams) {
	return  ` SELECT id, name FROM Modules ORDER BY name ASC `;
}
