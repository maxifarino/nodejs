exports.generateAgentsQuery = (params) => {
	
	let query = `SELECT 
		*,
		CONCAT(FirstName, ' ', LastName) AS FullName
		FROM dbo.Agents 
		WHERE 1=1`;
 	
	if(params.agentId)
		query += ` AND AgentID = ${params.agentId}`;
	if(params.firstName)
    query += ` AND FirstName LIKE '%${params.firstName}%'`;
  if(params.lastName)
		query += ` AND LastName LIKE '%${params.lastName}%'`;
	if(params.agencyId)
		query += ` AND AgencyID = ${params.agencyId}`;
	
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

exports.generateAgentsInsertQuery = (params) => {

	let query = `INSERT INTO dbo.Agents (
    FirstName
    , LastName
		, MobileNumber
		, PhoneNumber
		, EmailAddress
		, AgencyID
	) VALUES (
    '${params.firstName}'
		,'${params.lastName}'
		,'${params.mobileNumber}'
		,'${params.phoneNumber}'
		,'${params.emailAddress}'
		, ${params.agencyId}
	)`;
	
  //console.log(query)
	return query;
}

exports.generateAgentsUpdateQuery = (params) => {

	let query = `UPDATE dbo.Agents SET `;
	  
  if(params.firstName)
		query += `FirstName = '${params.firstName}',`;

	if(params.lastName)
    query += `LastName = '${params.lastName}',`;
    
	if(params.mobileNumber)
		query += `MobileNumber = '${params.mobileNumber}',`;

	if(params.phoneNumber)
		query += `PhoneNumber = '${params.phoneNumber}',`;
	
	if(params.emailAddress)
		query += `EmailAddress = '${params.emailAddress}',`;
	
	if(params.agencyId)
		query += `AgencyID = ${params.agencyId},`;	

  // remove last comma.
	query = query.slice(0, -1);

	query += ` WHERE AgentID = ${params.agentId}`;

	//console.log('QUERY', query);
	return query;
}

exports.generateAgentsDeleteQuery = (params) => {

	let query = `DELETE dbo.Agents WHERE AgentID = ${params.agentId}`;
	//console.log(query)
	return query;
}