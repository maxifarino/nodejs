exports.generateAddTradeQuery = function(params) {
	return `INSERT INTO Trades (value, description, orderIndex, hiringClientId) Values 
				('${params.value}', '${params.description}', ${params.orderIndex}, ${params.hiringClientId}); `;
}

exports.generateUpdateTradeQuery = function(params) {
	let query = `UPDATE Trades SET orderIndex = ${params.orderIndex} `;
		
		if(params.description)
			query +=	`, description = '${params.description}' `;

		query +=	`	WHERE id = ${params.id}; `;

	return query;
}

exports.generateGetTradesByHCIdQuery = function(params) {
	let query = `SELECT id, value, description, orderIndex `;
	
	if (params.pageSize && params.getTotalCount == true)
		query = `SELECT COUNT(*) totalCount `;

		query += ` FROM Trades `;
	if (params.justAvailableInlist == true || params.justAvailableInlist == 'true') {
		query += ` WHERE id IN (
			SELECT
				TradeId
			FROM
				HiringClients_Subcontractors
			WHERE
				hiringClientId = ${params.hiringClientId}
		) `;
	} else {
		query += ` WHERE hiringClientId = ${params.hiringClientId}  `;
	}

	if (params.pageSize && params.getTotalCount == false) {
		query +=  ` ORDER BY orderIndex `;
		let pageSize = params.pageSize;
		let pageNumber = params.pageNumber;
		query += ` OFFSET ${pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${pageSize} ROWS ONLY`;
	}

	return query;
}

exports.generateGetTradesBySCIdQuery = function(params) {

	let query = `SELECT id, value, description, orderIndex `;
	
	if(params.pageSize && params.getTotalCount == true)
		query = `SELECT COUNT(*) totalCount `;

	query += ` FROM Trades WHERE hiringClientId IN 
							(SELECT top 1 hiringClientId FROM Users_HiringClients WHERE userId = ${params.userId}) `;

	if(params.pageSize && params.getTotalCount == false) {
		query +=  ` ORDER BY orderIndex `;
		let pageSize = params.pageSize;
		let pageNumber = params.pageNumber;
		query += ` OFFSET ${pageSize} * (${pageNumber} - 1) ROWS FETCH NEXT ${pageSize} ROWS ONLY`;
	}

	return query;
}
