### POST Get client token

Resource URL: /braintree/get-client-token

Headers:

* x-access-token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJZCI6MywiRmlyc3ROYW1lIjoiTHVpcyIsIkxhc3ROYW1lIjoiVGVzdGVyMiIsIk1haWwiOiJsdWlzLnBhcmFkZWxhQGFjY2Vsb25lLmNvbSIsIlJvbGVJRCI6MSwiSXNFbmFibGVkIjoxLCJJc0NvbnRhY3QiOjEsIlRpdGxlSWQiOjAsIlBob25lIjoiNDY0NjQ2NDY0NjQ2IiwiQ2VsbFBob25lIjpudWxsLCJUaW1lWm9uZUlkIjo5LCJNdXN0UmVuZXdQYXNzIjowLCJNdXN0VXBkYXRlUHJvZmlsZSI6MCwiVGltZVN0YW1wIjoiMjAxNy0xMS0xM1QxNDoyNToyMS40NjBaIiwiUm9sZSI6eyJJZCI6MSwiTmFtZSI6IlBRIEFkbWluIiwiVGltZVN0YW1wIjoiMjAxNy0xMS0xM1QxNDoyMzo1MS4yNTdaIn0sIlRpbWVab25lIjp7IklkIjo5LCJWYWx1ZSI6IlBhY2lmaWMgRGF5bGlnaHQgVGltZSIsIkRlc2NyaXB0aW9uIjoiKFVUQy0wODowMCkgUGFjaWZpYyBUaW1lIChVUyAmIENhbmFkYSkiLCJUaW1lU3RhbXAiOiIyMDE3LTExLTMwVDE1OjQ5OjUxLjA2MFoifSwiVGl0bGUiOnsiSWQiOjAsIlRpdGxlIjoiTm9uZSIsIlRpbWVTdGFtcCI6IjIwMTctMTEtMjlUMTE6NTU6MzMuNDQ3WiJ9LCJpYXQiOjE1MjQxNzIyOTEsImV4cCI6MTUzNDE3MjI5MH0.tGeOBO-4Za1Yu4mPqJpcZ_jWTKbX8sTDaKd7S92WdcU"

Query Parameters:

* customerId

Example response OK:

{
    "success": true,
    "data": {
        "clientToken": "eyJ2ZXJzaW9uIjoyLCJhdXRob3JpemF0aW9uRmluZ2VycHJpbnQiOiI0Y2RmZjllYzZkZmU5NGIwYmUyNDkzNWMyOTQ2MDI0ZGIwMmJhYmVjODRiY2YxNzJjZGE4ZGEyNmRlNjlmNDJjfGNyZWF0ZWRfYXQ9MjAxOC0wNi0xOVQyMDo1Mjo0Ni4yMzM1Mjk1MTkrMDAwMFx1MDAyNm1lcmNoYW50X2lkPXd2anBiZ244eWRjNWtqa2JcdTAwMjZwdWJsaWNfa2V5PTlkNmJ3M3k3dDlzcHd5YnkiLCJjb25maWdVcmwiOiJodHRwczovL2FwaS5zYW5kYm94LmJyYWludHJlZWdhdGV3YXkuY29tOjQ0My9tZXJjaGFudHMvd3ZqcGJnbjh5ZGM1a2prYi9jbGllbnRfYXBpL3YxL2NvbmZpZ3VyYXRpb24iLCJjaGFsbGVuZ2VzIjpbXSwiZW52aXJvbm1lbnQiOiJzYW5kYm94IiwiY2xpZW50QXBpVXJsIjoiaHR0cHM6Ly9hcGkuc2FuZGJveC5icmFpbnRyZWVnYXRld2F5LmNvbTo0NDMvbWVyY2hhbnRzL3d2anBiZ244eWRjNWtqa2IvY2xpZW50X2FwaSIsImFzc2V0c1VybCI6Imh0dHBzOi8vYXNzZXRzLmJyYWludHJlZWdhdGV3YXkuY29tIiwiYXV0aFVybCI6Imh0dHBzOi8vYXV0aC52ZW5tby5zYW5kYm94LmJyYWludHJlZWdhdGV3YXkuY29tIiwiYW5hbHl0aWNzIjp7InVybCI6Imh0dHBzOi8vb3JpZ2luLWFuYWx5dGljcy1zYW5kLnNhbmRib3guYnJhaW50cmVlLWFwaS5jb20vd3ZqcGJnbjh5ZGM1a2prYiJ9LCJ0aHJlZURTZWN1cmVFbmFibGVkIjp0cnVlLCJwYXlwYWxFbmFibGVkIjp0cnVlLCJwYXlwYWwiOnsiZGlzcGxheU5hbWUiOiJQcmVxdWFsVVNBIiwiY2xpZW50SWQiOm51bGwsInByaXZhY3lVcmwiOiJodHRwOi8vZXhhbXBsZS5jb20vcHAiLCJ1c2VyQWdyZWVtZW50VXJsIjoiaHR0cDovL2V4YW1wbGUuY29tL3RvcyIsImJhc2VVcmwiOiJodHRwczovL2Fzc2V0cy5icmFpbnRyZWVnYXRld2F5LmNvbSIsImFzc2V0c1VybCI6Imh0dHBzOi8vY2hlY2tvdXQucGF5cGFsLmNvbSIsImRpcmVjdEJhc2VVcmwiOm51bGwsImFsbG93SHR0cCI6dHJ1ZSwiZW52aXJvbm1lbnROb05ldHdvcmsiOnRydWUsImVudmlyb25tZW50Ijoib2ZmbGluZSIsInVudmV0dGVkTWVyY2hhbnQiOmZhbHNlLCJicmFpbnRyZWVDbGllbnRJZCI6Im1hc3RlcmNsaWVudDMiLCJiaWxsaW5nQWdyZWVtZW50c0VuYWJsZWQiOnRydWUsIm1lcmNoYW50QWNjb3VudElkIjoicHJlcXVhbHVzYSIsImN1cnJlbmN5SXNvQ29kZSI6IlVTRCJ9LCJtZXJjaGFudElkIjoid3ZqcGJnbjh5ZGM1a2prYiIsInZlbm1vIjoib2ZmIn0="
    }
}

Example response ERROR:

{
    "success": false,
    "data": {
        "errorCode": 10080,
        "description": "Braintree error.",
        "error": {}
    }
}

Possible error codes:

* 10000 = Backend error
* 10001 = MSSQL error (uncategorized error)
* 10003 = Invalid Data (missing or wrong parameters)
* 10005 = No token provided
* 10006 = Failed to authenticate token
* 10007 = The token is expired


### POST Checkout

Resource URL: /braintree/Checkout

Headers:

* x-access-token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJZCI6MywiRmlyc3ROYW1lIjoiTHVpcyIsIkxhc3ROYW1lIjoiVGVzdGVyMiIsIk1haWwiOiJsdWlzLnBhcmFkZWxhQGFjY2Vsb25lLmNvbSIsIlJvbGVJRCI6MSwiSXNFbmFibGVkIjoxLCJJc0NvbnRhY3QiOjEsIlRpdGxlSWQiOjAsIlBob25lIjoiNDY0NjQ2NDY0NjQ2IiwiQ2VsbFBob25lIjpudWxsLCJUaW1lWm9uZUlkIjo5LCJNdXN0UmVuZXdQYXNzIjowLCJNdXN0VXBkYXRlUHJvZmlsZSI6MCwiVGltZVN0YW1wIjoiMjAxNy0xMS0xM1QxNDoyNToyMS40NjBaIiwiUm9sZSI6eyJJZCI6MSwiTmFtZSI6IlBRIEFkbWluIiwiVGltZVN0YW1wIjoiMjAxNy0xMS0xM1QxNDoyMzo1MS4yNTdaIn0sIlRpbWVab25lIjp7IklkIjo5LCJWYWx1ZSI6IlBhY2lmaWMgRGF5bGlnaHQgVGltZSIsIkRlc2NyaXB0aW9uIjoiKFVUQy0wODowMCkgUGFjaWZpYyBUaW1lIChVUyAmIENhbmFkYSkiLCJUaW1lU3RhbXAiOiIyMDE3LTExLTMwVDE1OjQ5OjUxLjA2MFoifSwiVGl0bGUiOnsiSWQiOjAsIlRpdGxlIjoiTm9uZSIsIlRpbWVTdGFtcCI6IjIwMTctMTEtMjlUMTE6NTU6MzMuNDQ3WiJ9LCJpYXQiOjE1MjQxNzIyOTEsImV4cCI6MTUzNDE3MjI5MH0.tGeOBO-4Za1Yu4mPqJpcZ_jWTKbX8sTDaKd7S92WdcU"

Query Parameters:

* hiringClientId
* subcontractorId
* payment_method_nonce

Example response OK:

{
    "success": true,
    "data": {
        "transaction": {
            "id": "5tjxtqbj",
            "status": "submitted_for_settlement",
            "type": "sale",
            "currencyIsoCode": "USD",
            "amount": "9.99",
            "merchantAccountId": "prequalusa",
            "subMerchantAccountId": null,
            "masterMerchantAccountId": null,
            "orderId": null,
            "createdAt": "2018-06-20T15:26:03Z",
            "updatedAt": "2018-06-20T15:26:03Z",
            "customer": {
                "id": null,
                "firstName": null,
                "lastName": null,
                "company": null,
                "email": null,
                "website": null,
                "phone": null,
                "fax": null
            },
            "billing": {
                "id": null,
                "firstName": null,
                "lastName": null,
                "company": null,
                "streetAddress": null,
                "extendedAddress": null,
                "locality": null,
                "region": null,
                "postalCode": null,
                "countryName": null,
                "countryCodeAlpha2": null,
                "countryCodeAlpha3": null,
                "countryCodeNumeric": null
            },
            "refundId": null,
            "refundIds": [],
            "refundedTransactionId": null,
            "partialSettlementTransactionIds": [],
            "authorizedTransactionId": null,
            "settlementBatchId": null,
            "shipping": {
                "id": null,
                "firstName": null,
                "lastName": null,
                "company": null,
                "streetAddress": null,
                "extendedAddress": null,
                "locality": null,
                "region": null,
                "postalCode": null,
                "countryName": null,
                "countryCodeAlpha2": null,
                "countryCodeAlpha3": null,
                "countryCodeNumeric": null
            },
            "customFields": {
                "hiringClient": "Base Hiring Client",
                "vendorName": "Prequal"
            },
            "avsErrorResponseCode": null,
            "avsPostalCodeResponseCode": "I",
            "avsStreetAddressResponseCode": "I",
            "cvvResponseCode": "I",
            "gatewayRejectionReason": null,
            "processorAuthorizationCode": "38NB0H",
            "processorResponseCode": "1000",
            "processorResponseText": "Approved",
            "additionalProcessorResponse": null,
            "voiceReferralNumber": null,
            "purchaseOrderNumber": null,
            "taxAmount": null,
            "taxExempt": false,
            "creditCard": {
                "token": null,
                "bin": "411111",
                "last4": "1111",
                "cardType": "Visa",
                "expirationMonth": "12",
                "expirationYear": "2021",
                "customerLocation": "US",
                "cardholderName": null,
                "imageUrl": "https://assets.braintreegateway.com/payment_method_logo/visa.png?environment=sandbox",
                "prepaid": "Unknown",
                "healthcare": "Unknown",
                "debit": "Unknown",
                "durbinRegulated": "Unknown",
                "commercial": "Unknown",
                "payroll": "Unknown",
                "issuingBank": "Unknown",
                "countryOfIssuance": "Unknown",
                "productId": "Unknown",
                "uniqueNumberIdentifier": null,
                "venmoSdk": false,
                "maskedNumber": "411111******1111",
                "expirationDate": "12/2021"
            },
            "statusHistory": [
                {
                    "timestamp": "2018-06-20T15:26:03Z",
                    "status": "authorized",
                    "amount": "9.99",
                    "user": "sfein@PrequalUSA.com",
                    "transactionSource": "api"
                },
                {
                    "timestamp": "2018-06-20T15:26:03Z",
                    "status": "submitted_for_settlement",
                    "amount": "9.99",
                    "user": "sfein@PrequalUSA.com",
                    "transactionSource": "api"
                }
            ],
            "planId": null,
            "subscriptionId": null,
            "subscription": {
                "billingPeriodEndDate": null,
                "billingPeriodStartDate": null
            },
            "addOns": [],
            "discounts": [],
            "descriptor": {
                "name": null,
                "phone": null,
                "url": null
            },
            "recurring": false,
            "channel": null,
            "serviceFeeAmount": null,
            "escrowStatus": null,
            "disbursementDetails": {
                "disbursementDate": null,
                "settlementAmount": null,
                "settlementCurrencyIsoCode": null,
                "settlementCurrencyExchangeRate": null,
                "fundsHeld": null,
                "success": null
            },
            "disputes": [],
            "authorizationAdjustments": [],
            "paymentInstrumentType": "credit_card",
            "processorSettlementResponseCode": "",
            "processorSettlementResponseText": "",
            "threeDSecureInfo": null,
            "shipsFromPostalCode": null,
            "shippingAmount": null,
            "discountAmount": null,
            "paypalAccount": {},
            "coinbaseAccount": {},
            "applePayCard": {},
            "androidPayCard": {},
            "visaCheckoutCard": {},
            "masterpassCard": {}
        },
        "success": true
    }
}
Example response ERROR:

{
    "success": false,
    "data": {
        "errors": {
            "validationErrors": {},
            "errorCollections": {
                "transaction": {
                    "validationErrors": {
                        "paymentMethodNonce": [
                            {
                                "attribute": "payment_method_nonce",
                                "code": "91564",
                                "message": "Cannot use a payment_method_nonce more than once."
                            }
                        ]
                    },
                    "errorCollections": {}
                }
            }
        },
        "params": {
            "transaction": {
                "amount": "9.99",
                "paymentMethodNonce": "tokencc_bc_dyq54k_7xkkhb_yx7hkf_bmjs8m_yf4",
                "options": {
                    "submitForSettlement": "true"
                },
                "customFields": {
                    "hiringClient": "Base Hiring Client",
                    "vendorName": "Prequal"
                },
                "type": "sale"
            }
        },
        "message": "Cannot use a payment_method_nonce more than once.",
        "success": false
    }
}
	Possible error codes:

	* 10000 = Backend error
	* 10001 = MSSQL error (uncategorized error)
	* 10003 = Invalid Data (missing or wrong parameters)
	* 10005 = No token provided
	* 10006 = Failed to authenticate token
	* 10007 = The token is expired

