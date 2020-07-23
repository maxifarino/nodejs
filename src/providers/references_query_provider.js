exports.generateReferenceQuery = function(params) {
	let query = `SELECT R.id, 
											R.typeId, 
											RT.type, 
											R.companyName, 
											R.savedFormId, 
											R.contactName, 
											R.contactEmail, 
											R.contactPhone, 
											R.refDate `;

	if(params.getTotalCount == true) {
		query = `SELECT COUNT(*) totalCount `;
	}

	query +=  ` FROM [References] R, ReferencesTypes RT 
								WHERE R.typeId = RT.id `;

	if(params.referenceId) {
		query += ` AND R.id = ${params.referenceId} `;
	}

	if(params.typeId) {
		query += ` AND R.typeId = ${params.typeId} `;
	}

	if(params.subcontractorId) {
		query += ` AND R.savedFormId IN (SELECT id FROM SavedForms WHERE subcontractorId = ${params.subcontractorId}) `;
	}

	if (params.searchTerm) {
		query += ` AND (R.companyName LIKE '%${params.searchTerm}%' OR R.contactName LIKE '%${params.searchTerm}%') `;
	}

	if(params.getTotalCount == false) {
		if(params.orderBy) {
			query += ` ORDER BY ${params.orderBy} `;
			if(params.orderDirection) {
				query += ` ${params.orderDirection} `;
			}
		}
		else {
			query += ` ORDER BY id ASC `;
		}
	}

	if(params.pageSize && params.getTotalCount == false) {
		let pageSize = params.pageSize
		let pageNumber = params.pageNumber
		query += ` OFFSET ${pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${pageSize} ROWS ONLY`;
	}

	return query;
}

exports.generateReferencesTypesQuery = function() {
	return  ` select id, type from ReferencesTypes ORDER BY type `;
}

exports.generateReferenceInsertQuery = function(queryParams) {
	let isoDate = new Date(Date.now()).toISOString();
	let query = `INSERT INTO [References] (
		TypeId,
		CompanyName,
		SavedFormId,
		ContactName,
		ContactEmail,
		ContactPhone,
		RefDate)
	VALUES (
		${queryParams.typeId},
		'${queryParams.companyName}',
		${queryParams.savedFormId},
		'${queryParams.contactName}',
		'${queryParams.contactEmail}',
		'${queryParams.contactPhone}',
		'${isoDate}'
		)`;

	return query;
}

exports.generateReferenceUpdateQuery = function(queryParams) {
	let query = `UPDATE [References] SET `;

	if (queryParams.typeId) {
		query += `TypeId = ${queryParams.typeId},`;
	}
	if(queryParams.companyName) {
		query += `CompanyName = '${queryParams.companyName}',`;
	}
	if(queryParams.savedFormId) {
		query += `SavedFormId = ${queryParams.savedFormId},`;
	}
	if(queryParams.contactName) {
		query += `ContactName = '${queryParams.contactName}',`;
	}
	if(queryParams.contactEmail) {
		query += `ContactEmail = '${queryParams.contactEmail}',`;
	}
	if(queryParams.contactPhone) {
		query += `ContactPhone = '${queryParams.contactPhone}',`;
	}
	
	// remove last comma.
	query = query.slice(0, -1);

	query += `WHERE Id = ${queryParams.referenceId}`;

	return query;
}

exports.generateReferenceQuestionInsertQuery = function(queryParams) {
	let query = `INSERT INTO ReferenceQuestions (
		ReferenceTypeId,
		Question)
	VALUES (
		${queryParams.referenceTypeId},
		'${queryParams.question}'
	)`;

	return query;
}

exports.generateReferenceQuestionUpdateQuery = function(queryParams) {
	let query = `UPDATE ReferenceQuestions
		SET Question = '${queryParams.question}'
		WHERE Id = ${queryParams.questionId}`;

	return query;
}

exports.generateReferenceResponsesQuery =function(params) {
	let query = `SELECT 
									RQ.id,
									RQ.referenceTypeId, `;

	if(params.referenceId) {
		query += ` ${params.referenceId} referenceid, 
							(SELECT TOP 1 RR.response FROM ReferenceResponses RR WHERE RR.referenceId = ${params.referenceId} 
									AND RQ.id = RR.referenceQuestionId) response, 
							(SELECT TOP 1 RR.referenceQuestionId FROM ReferenceResponses RR WHERE RR.referenceId = ${params.referenceId} 
									AND RQ.id = RR.referenceQuestionId) referenceQuestionId,  `;
}
	else {
		query += ` null referenceid, 
							null response, 
							null referenceQuestionId,`;
	}

	query += ` RQ.question
						 FROM ReferenceQuestions RQ
						 ORDER BY id ASC `;

	return query;
}

exports.generateReferenceResponseInsertQuery = function(queryParams) {
	let query = `
	DELETE ReferenceResponses WHERE referenceId = ${queryParams.referenceId} AND referenceQuestionId = ${queryParams.referenceQuestionId};

	INSERT INTO ReferenceResponses (
		ReferenceId,
		ReferenceQuestionId,
		Response)
	VALUES (
		${queryParams.referenceId},
		${queryParams.referenceQuestionId},
		'${queryParams.response}'
	); `;

	return query;
}

exports.generateReferenceSubmissionsQuery = function(params) {
	let query = `SELECT sf.id, f.name, f.description,sf.timestamp sumissionDate  
							 FROM SavedForms sf, Forms f 
							 WHERE sf.subContractorId = ${params.subcontractorId} AND sf.formId = f.id `;

	return query;
}
