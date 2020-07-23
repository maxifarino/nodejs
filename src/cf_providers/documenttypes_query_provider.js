

exports.generateDocTypesQuery = function(queryParams) {

	let documentTypeName = queryParams.documentTypeName;
	let documentTypeId = queryParams.documentTypeId;
  let expireAmount = queryParams.expireAmount;
	let expirePeriod = queryParams.expirePeriod;
  let archived = queryParams.archived;
  let holderId = queryParams.holderId;
  let searchTerm = queryParams.searchTerm;
  let orderBy = queryParams.orderBy;
	let orderDirection = queryParams.orderDirection;
	let pageNumber = queryParams.pageNumber;
	let pageSize = queryParams.pageSize;
	let getTotalCount= queryParams.getTotalCount;

	let query = ` SELECT
          documentTypeID, 
					documentTypeName, 
          expireAmount, 
          expirePeriod,
          archived,
          holderId
          `;

	query +=  `FROM DocumentTypes
						WHERE holderId = ${holderId} `;

  if(searchTerm)
    query += ` AND Name like '%${searchTerm}%'`;
       
	if(documentTypeName)
    query += ` AND documentTypeName like '%${documentTypeName}%'`;

	if(typeof archived !== 'undefined')
    query += ` AND archived = ${archived}`;

  if(expirePeriod)
    query += ` AND expirePeriod like '%${expirePeriod}%'`;
   
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

  console.log('DOCUMENT TYPES QUERY', query);
	return query;
}


exports.generateDocTypesInsertQuery = function(params) {

	let query = `INSERT INTO DocumentTypes
				( `;

	if(params.documentTypeName)
		query += ` documentTypeName`;

	if(params.holderId)
		query += `, holderId `;

	if(params.expireAmount)
		query += `, expireAmount `;

  if(params.expirePeriod)
		query += `, expirePeriod `;

	if(typeof params.archived !== 'undefined')
		query += `, archived `;

	query += `)
				VALUES
			  ( `;

	if(params.documentTypeName)
		query += ` '${params.documentTypeName}'`;

	if(params.holderId)
		query += ` , ${params.holderId}`;

	if(params.expireAmount)
		query += ` , ${params.expireAmount}`;

  if(params.expirePeriod)
		query += ` , '${params.expirePeriod}'`;


  if(typeof params.archived !== 'undefined')
		query += ` , ${params.archived}`;

	query += `)`;

  console.log('QUERY', query);
	return query;
}


exports.generateDocTypesUpdateQuery = function(params) {

  let query = `UPDATE DocumentTypes SET `;
	if(params.documentTypeName)
		query += `documentTypeName = '${params.documentTypeName}',`;

	if(params.holderId)
		query += `holderId = ${params.holderId},`;

	if(params.expireAmount)
		query += `expireAmount = ${params.expireAmount},`;

  if(params.expirePeriod)
    query += `expirePeriod = '${params.expirePeriod}',`;

	if(typeof params.archived !== 'undefined')
		query += `archived = ${params.archived},`;

    // remove last comma.
	query = query.slice(0, -1);

	query += ` WHERE documentTypeId = ${params.documentTypeId}`;

  console.log('QUERY', query);
	return query;
}