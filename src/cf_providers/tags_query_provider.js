
exports.generateTagsQuery = function(queryParams) {

  let tagName = queryParams.tagName;
	let tagId = queryParams.tagId;
  let CFHolderId = queryParams.CFHolderId;
	let CFdisplayOrder = queryParams.CFdisplayOrder;
	let CFdeletedFlag = queryParams.CFdeletedFlag;
  let searchTerm = queryParams.searchTerm;
  let orderBy = queryParams.orderBy;
	let orderDirection = queryParams.orderDirection;
	let pageNumber = queryParams.pageNumber;
	let pageSize = queryParams.pageSize;
	let getTotalCount= queryParams.getTotalCount;

	let query = ` SELECT
					id, 
					Name as tagName, 
          CFHolderId, 
          CFdisplayOrder,
          CFdeletedFlag,
          `;
  query += ` timeStamp `;

	query +=  `FROM Tags
						WHERE CFHolderId = ${CFHolderId} `;

  if(searchTerm)
    query += ` AND Name like '%${searchTerm}%'`;
       
	if(tagName)
    query += ` AND Name like '%${tagName}%'`;

	if(typeof CFdeletedFlag !== 'undefined')
    query += ` AND CFdeletedFlag = ${CFdeletedFlag}`;


	if(orderBy && getTotalCount == false){
		query += ` ORDER BY ${orderBy} `;
		if(orderDirection){
			query += ` ${orderDirection} `;
		}
	}
	else {
		if(getTotalCount == false)
			query += ` ORDER BY timeStamp DESC `;
	}

	if(pageNumber && getTotalCount == false) {
		query += ` OFFSET ${pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${pageSize} ROWS ONLY`;
	}

  console.log('generateTagsQuery: ', query);
	return query;
}


exports.generateTagsInsertQuery = function(params) {

	let query = `INSERT INTO Tags
				( `;

	if(params.tagName)
		query += ` name`;

	if(params.CFHolderId)
		query += `, CFHolderId `;

	if(typeof params.CFdisplayOrder !== 'undefined')
		query += `, CFdisplayOrder `;

	if(typeof params.CFdeletedFlag !== 'undefined')
		query += `, CFdeletedFlag `;

	query += `)
				VALUES
			  ( `;

	if(params.tagName)
		query += ` '${params.tagName}'`;

	if(params.CFHolderId)
		query += ` , ${params.CFHolderId}`;

	if(typeof params.CFdisplayOrder !== 'undefined')
		query += ` , ${params.CFdisplayOrder}`;

	if(typeof params.CFdeletedFlag !== 'undefined')
		query += ` , ${params.CFdeletedFlag}`;

	query += `)`;
	
	//console.log('generateTagsInsertQuery: ', query);
	return query;
}


exports.generateTagsUpdateQuery = function(params) {

	let query = `UPDATE Tags SET `;
	if(params.tagName)
		query += `name = '${params.tagName}',`;

	if(params.CFHolderId)
		query += `CFHolderId = ${params.CFHolderId},`;

	if(typeof params.CFdisplayOrder !== 'undefined')
		query += `CFdisplayOrder = ${params.CFdisplayOrder},`;

	if(typeof params.CFdeletedFlag !== 'undefined')
		query += `CFdeletedFlag = ${params.CFdeletedFlag},`;

    // remove last comma.
	query = query.slice(0, -1);

	query += ` WHERE Id = ${params.tagId}`;

	//console.log('generateTagsUpdateQuery: ', query);
	return query;
}