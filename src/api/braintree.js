const axios = require('axios');
const braintree = require('braintree');
const error_helper = require('../helpers/error_helper');
const workflows_query_provider = require('../providers/workflows_query_provider');
const bt_query_provider = require('../providers/bt_query_provider');
const hiringClients_mssql = require('../mssql/hiring_clients')
const sql_helper = require('../mssql/mssql_helper');

const Sandbox = braintree.Environment.Sandbox;
const Production = braintree.Environment.Production;
const gateway = braintree.connect({
  environment: process.env.BRAINTREE_ENV === 'sandbox'? Sandbox:Production,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY
});

exports.getClientToken = function (req, res) {
	let params = {};
	if(req.body.customerId){
		params.customerId = req.body.customerId;
	}

	gateway.clientToken.generate(params, function (err, response) {
		if (err || !response.clientToken) {
			console.log(err);
			const error = error_helper.getErrorData(error_helper.CODE_BRAINTREE_ERROR, error_helper.MSG_BRAINTREE_ERROR);
			return res.send(error);
		}

		return res.status(200).json({ success: true, data: { clientToken: response.clientToken } });
	});
}

exports.checkout = async function (req, res) {
  try  {
  	let error;
  	let invalidData = false;
  	let body = req.body;

  	if(!body) {
  		invalidData = true;
  	}
  	else{
  		if(!body.payment_method_nonce) invalidData = true;
  		if(!body.hiringClientId) invalidData = true;
  		let hiringClientId = body.hiringClientId;
  		let subcontractorId = body.subcontractorId;
  		if(hiringClientId && (parseInt(hiringClientId) <= 0 || isNaN(parseInt(hiringClientId)))) invalidData = true;
  		if(subcontractorId && (parseInt(subcontractorId) <= 0 || isNaN(parseInt(subcontractorId)))) invalidData = true;
  	}

  	if (invalidData) {
  		error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
  		return res.send(error);
  	}

  	let hiringClientName = '';
    let subcontractorName = '';
  	let subcontractorFee = 0.0;

    // Get HC values
    
  	await hiringClients_mssql.getHiringClientSummaryWithFormFeesQuery(body.hiringClientId, body.subcontractorId, async function(err, result) {
  		if (err) {
  			error = error_helper.getSqlErrorData(err);
        return res.status(200).json({ success: false, data: error });
  		}

  		let entries = []

  		if (result.length > 0) {
  			hiringClientName = result[0].name;
  			subcontractorFee = result[0].subcontractorFee;
        subcontractorName = result[0].scName;
        
  		}			
  	});

  	// Gateway params
  	const params = {
  		amount: subcontractorFee,
  		paymentMethodNonce: body.payment_method_nonce,
  		options: {
  			submitForSettlement: true
  		},
  		customFields: {
  			hiring_client: hiringClientName,
  			vendor_name: subcontractorName
  		}
    };
    

    let btResponse = null;

    // Execute transaction
    await gateway.transaction.sale(params, async function (err, response) {
      if (err) {
        console.log(err);
        error = error_helper.getErrorData(error_helper.CODE_BRAINTREE_ERROR, error_helper.MSG_BRAINTREE_ERROR);
          return res.status(200).json({ success: false, data: error });
      }

      btResponse = response;

      console.log(btResponse);

      // Something went wrong with the payment process
      if(!btResponse.success) {
        return res.status(200).json({ success: false, data: btResponse });
      }
      else {
        let btTransaction = btResponse.transaction;

        // if response confirm transaction then unset the mustPay field to mark the payment as paid with a 0
        if(btTransaction.processorResponseText.toLowerCase() == 'approved') {
        let hc_sc_pair = {};
            hc_sc_pair.hiringClientId = body.hiringClientId;
            hc_sc_pair.subcontractorId = body.subcontractorId;

          // If Paid, the Sub does not need to pay any more
        let query = workflows_query_provider.generateSetMustPayQuery(hc_sc_pair, 0);

        await sql_helper.createTransaction(query, function(err, result, resultId) {
            if(err) {
              console.log(err);
              return res.status(200).json({ success: false, data: err });
            }
        });
        }

        // Add transaction (TRX) into BTIntegrationLog table
        const trxParams = {};
        trxParams.subcontractorId = body.subcontractorId;
        trxParams.userId = req.currentUser.Id;
        trxParams.hiringClientId = body.hiringClientId;
        trxParams.amount = btTransaction.amount;
        trxParams.cardType = btTransaction.creditCard.cardType;
        trxParams.cardHolderName = btTransaction.creditCard.cardholderName;
        trxParams.cardLastFour = btTransaction.creditCard.last4;
        trxParams.cardExpirationMonth = btTransaction.creditCard.expirationMonth;
        trxParams.cardExpirationYear = btTransaction.creditCard.expirationYear;
        trxParams.btStatus = btTransaction.status;
        trxParams.btId = btTransaction.id;

        const query = bt_query_provider.generateInsertTRXInLogQuery(trxParams);

        await sql_helper.createTransaction(query, function(err, result, resultId) {
            if(err) {
              console.log(err);
              return res.status(200).json({ success: false, data: err });
            }
        });

        return res.status(200).json({ success: true, data: response });    
      }

    });
  }
  catch(err) {
    console.log(err);
    return res.status(500).send(err);
  }
}

