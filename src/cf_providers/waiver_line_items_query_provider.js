exports.generateWaiverLineItemsQuery = (params) => {
	
	let query = `SELECT * FROM dbo.WaiverLineItems WHERE 1=1`;
 	
	if(params.waiverLineItemId)
		query += ` AND WaiverLineItemID = ${params.waiverLineItemId}`;
	if(params.waiverId)
		query += ` AND WaiverID = ${params.waiverId}`;
	if(params.projectInsuredDeficiencyId)
		query += ` AND ProjectInsuredDeficiencyID = ${params.projectInsuredDeficiencyId}`;
	if(params.waiverStatusId)
		query += ` AND WaiverStatusID = ${params.waiverStatusId}`;
	if(params.actionDate)
		query += ` AND ActionDate = ${params.actionDate}`;
	if(params.actionById)
		query += ` AND ActionByID = ${params.actionById}`;

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

exports.generateWaiverLineItemsInsertQuery = (params) => {


	let query = `INSERT INTO dbo.WaiverLineItems (
		WaiverId
		, ProjectInsuredDeficiencyID `;

	if (params.waiverStatusID) 
		query += `, WaiverStatusID`;

	query += `) VALUES (
		${params.waiverId}
		,${params.projectInsuredDeficiencyId} `;

	if (params.waiverStatusID) 
		query += `, ${params.waiverStatusID}`;

	query += `)`;
	
	console.log('QUERY', query);
	return query;
}

exports.generateWaiverLineItemsUpdateQuery = (params) => {

	let query = `UPDATE dbo.WaiverLineItems SET `;

  if(params.projectInsuredDeficiencyId)
		query += `ProjectInsuredDeficiencyID = ${params.projectInsuredDeficiencyId},`;

	if(params.waiverStatusId)
    query += `WaiverStatusID = ${params.waiverStatusId},`;

  if(params.actionById)
    query += `ActionByID = ${params.actionById},`;

  // remove last comma.
	query = query.slice(0, -1);

	query += `, ActionDate = getDate() WHERE WaiverID = ${params.waiverId}`;

	console.log('QUERY', query);
	return query;
}

exports.generateWaiverLineItemsDeleteQuery = (params) => {

	let query = `DELETE dbo.WaiverLineItems WHERE WaiverLineItemID = ${params.waiverLineItemId}`;

	return query;
}

exports.generatewaiverLineItemsUpdateQuery = (params) => {

	let query = `UPDATE dbo.WaiverLineItems SET `;

	if(params.waiverStatusId)
		query += ` WaiverStatusID = ${params.waiverStatusId}`;
	if(params.actionDate)
		query += ` ActionDate = ${params.actionDate}`;
	if(params.actionById)
		query += ` ActionByID = ${params.actionById}`;

	if (params.customerUniqueId)
		query += `CustomerUniqueId = ${params.customerUniqueId},`;

	// remove last comma.
	query = query.slice(0, -1);

	query += ` WHERE WaiverLineItemID = ${params.waiverLineItemId} `;

	if(params.waiverStatusId)
		query += ` AND WaiverID = ${params.waiverId}`;
	if(params.projectInsuredDeficiencyId)
		query += ` AND ProjectInsuredDeficiencyID = ${params.projectInsuredDeficiencyId}`;

	console.log('QUERY', query);
	return query;
}
