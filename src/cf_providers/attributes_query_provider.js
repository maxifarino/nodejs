exports.generateAttributesQuery = (params) => {
	
	let query = `SELECT 
		A.AttributeID
		, A.AttributeName
		, A.AttributeDataTypeID
		, A.Archived
	FROM dbo.Attributes A
	INNER JOIN AttributeCoverageType ACT ON A.AttributeID = ACT.AttributeID
	INNER JOIN CoveragesTypes CT ON CT.CoverageTypeID = ACT.CoverageTypeID
	WHERE 1=1`;

	if(params.name) {
		query += ` AND A.AttributeName LIKE '%${params.name}%'`;
	}
	if(params.coverageTypeId) {
		query += ` AND CT.CoverageTypeID = ${params.coverageTypeId}`;
	}
	
	query += ` ORDER BY A.AttributeName`;
	
	console.log('generateAttributesQuery: ', query);
	return query;
}

exports.generateAttributesByCoverageTypeQuery = (params) => {
	
	let query = `SELECT 
		A.AttributeID
		, A.AttributeName
		, A.Archived
	FROM dbo.Attributes A
	INNER JOIN AttributeCoverageType ACT ON A.AttributeID = ACT.AttributeID
	WHERE 1=1`;

	if(params.name) {
		query += ` AND A.AttributeName LIKE '%${params.name}%'`;
	}
	if(typeof params.archived !== 'undefined') {
		query += ` AND A.Archived = ${params.archived}`;
	}
	if(params.coverageTypeId) {
		query += ` AND ACT.CoverageTypeID = ${params.coverageTypeId}`;
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
	
	console.log('generateAttributesByCoverageTypeQuery: ', query);
	return query;
}

exports.generateAttributesInsertQuery = (params) => {

	let query = `DECLARE @lastInsertedAttribute AS INT; 
		INSERT INTO dbo.Attributes (
			AttributeName,
			AttributeDataTypeID
		) VALUES (
			'${params.attributeName}',
			0
		); 
		SET @lastInsertedAttribute = SCOPE_IDENTITY(); 
		INSERT INTO dbo.AttributeCoverageType (
			AttributeID,
			CoverageTypeID
		) VALUES (
			@lastInsertedAttribute,
			${params.coverageTypeId}
		);`;
	
  console.log('generateAttributesInsertQuery: ', query);
	return query;
}

exports.generateAttributesUpdateQuery = (params) => {

	let query = `UPDATE dbo.Attributes SET `;
	  
	if(params.attributeName)
		query += `AttributeName = '${params.attributeName}',`;
	
	if(typeof params.archived !== 'undefined')
		query += `Archived = ${params.archived},`;

  // remove last comma.
	query = query.slice(0, -1);

	query += ` WHERE AttributeID = ${params.attributeId}`;

	//console.log('QUERY', query);
	return query;
}

exports.generateAttributesDeleteQuery = (params) => {

	let query = `DELETE dbo.Attributes WHERE AttributeID = ${params.attributeId}`;
	//console.log(query)
	return query;
}