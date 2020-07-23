exports.generateProjectCustomFieldsQuery = (params) => {
	
  let query = `SELECT PCF.ProjectCustomFieldId, PCF.ProjectId, PCF.CustomFieldId, PCF.FieldValue, CF.CustomFieldName 
              FROM dbo.ProjectCustomFields PCF
              INNER JOIN dbo.CustomFields CF ON CF.CustomFieldId = PCF.CustomFieldId`;
   
  if(params.projectCustomFieldId)
		query += ` AND PCF.ProjectCustomFieldId = ${params.projectCustomFieldId}`;
	if(params.projectId)
		query += ` AND PCF.ProjectId = ${params.projectId}`;

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

exports.generateProjectCustomFieldsInsertQuery = (params) => {
  let query = `DELETE FROM dbo.ProjectCustomFields
    WHERE ProjectId = ${params.projectId} 
    AND CustomFieldId = ${params.customFieldId} `;
  
  query += `INSERT INTO dbo.ProjectCustomFields (
		ProjectId
		, CustomFieldId
    , FieldValue
  )	VALUES (
		${params.projectId}
		, ${params.customFieldId}
    ,'${params.fieldValue}'
  )`;

	return query;
}

exports.generateProjectCustomFieldsQueryByProjectId = (params) => {
	
  let query = `SELECT PCF.ProjectCustomFieldId, PCF.ProjectId, PCF.CustomFieldId, PCF.FieldValue, 
              CF.CustomFieldName, CF.DisplayOrder, CF.Archived 
              FROM dbo.ProjectCustomFields PCF
              INNER JOIN dbo.CustomFields CF ON CF.CustomFieldId = PCF.CustomFieldId
              WHERE PCF.ProjectId = ${params.projectId}`;
   
	if(params.orderBy) {
		query += ` ORDER BY ${params.orderBy} `;
		
		if(params.orderDirection){
			query += ` ${params.orderDirection} `;
		}
  } 
  else {
    query += ` ORDER BY CF.DisplayOrder`;
  }

	if(params.pageSize && !params.getTotalCount) {
		let pageNumber = (params.pageNumber) ? (params.pageNumber) : 1;
		query += ` OFFSET ${params.pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${params.pageSize} ROWS ONLY`;		
	}

	//console.log('QUERY', query);
	return query;
}

exports.generateProjectCustomFieldsDeleteQuery = (projectId) => {

  let query = `DELETE FROM dbo.ProjectCustomFields
    WHERE ProjectId = ${projectId}`;

  return query;
}