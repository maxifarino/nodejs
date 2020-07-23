exports.generateInsertTRXInLogQuery = function (params) {
	let query = ` INSERT INTO BTIntegrationLog (SubcontractorId, HiringClientId, UserId, Amount, CardType, 
								CardHolderName, CardLastFour, CardExpirationMonth,	CardExpirationYear, btStatus, btId) VALUES (`;
  query += ` ${params.subcontractorId}, ${params.hiringClientId}, ${params.userId}, ${params.amount}, '${params.cardType}', 
								'${params.cardHolderName}', '${params.cardLastFour}', '${params.cardExpirationMonth}',
								'${params.cardExpirationYear}', '${params.btStatus}', '${params.btId}' );`;								

	console.log(query);

	return query;								
}


