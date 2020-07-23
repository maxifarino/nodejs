exports.generateCustomFieldsQuery = (params) => {
	
	let query = `SELECT * FROM dbo.CustomFields WHERE 1=1`;
 	
	if(params.customFieldId)
		query += ` AND CustomFieldId = ${params.customFieldId}`;
	if(params.holderId)
		query += ` AND HolderId = ${params.holderId}`;
	if(params.customFieldName)
		query += ` AND CustomFieldName LIKE '%${params.customFieldName}%'`;
	if(params.fieldTypeId)
		query += ` AND FieldTypeId = ${params.fieldTypeId}`;
	if(params.archived)
		query += ` AND Archived = ${params.archived}`;	

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

exports.generateCustomFieldsInsertQuery = (params) => {

	let query = `INSERT INTO dbo.CustomFields (
		HolderId
		, CustomFieldName
		, FieldTypeId`;

	if(params.fieldLookupTableName)
		query += `, FieldLookupTableName`;

	if(params.fieldOptions)
		query += `, FieldOptions `;
	
	if(typeof params.archived !== 'undefined')
		query += `, Archived `;

	if(params.displayOrder)
		query += `, DisplayOrder `;	

	query += `)	VALUES (
		${params.holderId}
		,'${params.customFieldName}'
		, ${params.fieldTypeId} `;

	if(params.fieldLookupTableName)
		query += `, '${params.fieldLookupTableName}'`;

	if(params.fieldOptions)
		query += `, '${params.fieldOptions}'`;
	
	if(typeof params.archived !== 'undefined')
		query += `, ${params.archived}`;

	if(params.displayOrder)
		query += `, ${params.displayOrder}`;	

	query += `)`;

	return query;
}


exports.generateCustomFieldsUpdateQuery = (params) => {

	let query = `UPDATE dbo.CustomFields SET `;
	
	if(params.customFieldName)
		query += `CustomFieldName = '${params.customFieldName}',`;

	if(params.fieldTypeId)
		query += `FieldTypeId = ${params.fieldTypeId},`;

	if(params.fieldLookupTableName)
		query += `FieldLookupTableName = '${params.fieldLookupTableName}',`;

	if(params.fieldOptions)
			query += `FieldOptions = '${params.fieldOptions}',`;
	
	if(typeof params.archived !== 'undefined')
			query += `Archived = ${params.archived},`;
	
	if(params.displayOrder)
			query += `DisplayOrder = ${params.displayOrder},`;		

  // remove last comma.
	query = query.slice(0, -1);

	query += ` WHERE CustomFieldId = ${params.customFieldId}`;

	//console.log('QUERY', query);
	return query;
}

exports.generateCustomFieldsDeleteQuery = (params) => {

	let query = `DELETE dbo.CustomFields WHERE CustomFieldId = ${params.customFieldId}`;

	return query;
}