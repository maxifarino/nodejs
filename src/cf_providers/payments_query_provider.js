exports.generatePaymentsQuery = (params) => {
	
	let query = `SELECT 
		PaymentID
		,	PaymentDate
		, PaymentAmount
		, InsuredID
		, VoidFlag
		, PaymentMethodID
		, CheckNumber
		, CardTypeID
		, CreditCardShortNumber 
		FROM dbo.Payments 
		WHERE 1=1`;
 	
	if(params.paymentId)
		query += ` AND PaymentId = ${params.paymentId}`;
	if(params.paymentDate)
    query += ` AND PaymentDate = '%${params.paymentDate}%'`;
	if(params.insuredId)
		query += ` AND InsuredID = ${params.insuredId}`;
	
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

exports.generatePaymentsInsertQuery = (params) => {

	let query = `INSERT INTO dbo.Payments (
    PaymentDate
    , PaymentAmount
		, InsuredID
		, VoidFlag
		, PaymentMethodID
		, CheckNumber
		, CardTypeID
		, CreditCardShortNumber
	) VALUES (
    getDate()
		, ${params.paymentAmount}
		, ${params.insuredId}
		, ${params.voidFlag || 0}
		, ${params.paymentMethodId}
		, ${params.checkNumber}
		, ${params.cardTypeId}
		, ${params.creditCardShortNumber}
	)`;
	
  //console.log(query)
	return query;
}

exports.generatePaymentsDeleteQuery = (params) => {

	let query = `DELETE dbo.Payments WHERE PaymentId = ${params.paymentId}`;
	//console.log(query)
	return query;
}