exports.generateGetContractsQuery = function(id, projectId, projectName, subcontractorId, subcontractorName, 
							    orderBy, orderDirection) {

	let query = `SELECT
									c.id,
									c.projectId projectId,
									p.Name projectName,
									c.Name contractName,
								    c.subcontractorId subcontractorId,
									(SELECT s.name FROM Subcontractors s WHERE s.id = c.subcontractorId) subcontractorName,
									c.number number,
									c.amount amount,
									c.startDate startDate,
									c.endDate endDate,
									c.tradeId tradeId,
									(SELECT t.value FROM Trades t WHERE t.id = c.tradeId) tradeValue,
									(SELECT t.description FROM Trades t WHERE t.id = c.tradeId) tradeDescription,
									c.timeStamp timeStamp
							FROM    Contracts c,
							        Projects p
							WHERE   c.projectId = p.id `;

	if(id)
		query +=  ` AND c.id = ${id} `;				

	if(projectId)
		query +=  ` AND c.projectId = ${projectId} `;				

	if(projectName)
		query +=  ` AND p.name like '%${projectName}%' `;				

	if(subcontractorId)
		query +=  ` AND c.subcontractorId = ${subcontractorId} `;				

	if(subcontractorName)
		query +=  ` AND s.name like '%${subcontractorName}%' `;				

	if(orderBy){
		query += ` ORDER BY ${orderBy}`;
		if(orderDirection)
			query += ` ${orderDirection}`;
	}

	return query;
}

exports.generateContractInsertQuery = function(params) {

	let query = `INSERT INTO Contracts
				(
					projectId`;

	if(params.subcontractorId)
		query += ` , subcontractorId`;

	if(params.number)
		query += ` , number`;

	if(params.amount)
		query += ` , amount`;

	if(params.startDate)
		query += ` , startDate`;

	if(params.endDate)
		query += ` , endDate`;

	if(params.tradeId)
		query += ` , tradeId`;

	if(params.scopeOfWork)
		query += ` , scopeOfWork`;

	if(params.name)
		query += ` , name`;

	query += ` )
				VALUES
				(
					${params.projectId} `;

	if(params.subcontractorId)
		query += ` , ${params.subcontractorId}`;

	if(params.number)
		query += ` , '${params.number}'`;

	if(params.amount)
		query += ` , '${params.amount}'`;

	if(params.startDate)
		query += ` , '${params.startDate}'`;

	if(params.endDate)
		query += ` , '${params.endDate}'`;

	if(params.tradeId)
		query += ` , ${params.tradeId}`;

	if(params.scopeOfWork)
		query += ` , '${params.scopeOfWork}'`;
	
	if(params.name)
		query += ` , '${params.name}'`;

	query += `); `;

	return query;
}

exports.generateContractUpdateQuery = function(params) {

	let query = `UPDATE Contracts SET `;

	if(params.projectId)
		query += `projectId = ${params.projectId},`;

	if(params.subcontractorId)
		query += `subcontractorId = '${params.subcontractorId}',`;

	if(params.number)
		query += `number = '${params.number}',`;

	if(params.amount)
		query += `amount = '${params.amount}',`;

	if(params.startDate)
		query += `startDate = '${params.startDate}',`;

	if(params.endDate)
		query += `endDate = '${params.endDate}',`;

	if(params.tradeId)
		query += `tradeId = '${params.tradeId}',`;

	if(params.scopeOfWork)
		query += `scopeOfWork = '${params.scopeOfWork}',`;

	if(params.name)
		query += `name = '${params.name}',`;

	// remove last comma.
	query = query.slice(0, -1);

	query += ` WHERE Id = ${params.id}; `;

	return query;
}
