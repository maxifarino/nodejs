const sql = require('mssql');
const { bucket, apiVersion } = require('../helpers/aws_helper')
const sql_helper = require('../mssql/mssql_helper');
const HiringClients = require('../mssql/hiring_clients')
const error_helper = require('../helpers/error_helper');
const transforms = require('../helpers/transforms');
const query_provider = require('../providers/query_provider');
const _ = require('underscore')
const AWS = require('aws-sdk');
const { writeLog } = require('../utils')
const { sanitizeQuotesForDB, addDoubleQuotes } = require('../helpers/utils')

exports.createHiringClient = async function (req, res) {

	let invalidData = false;
	let params = req.body;

	if (!params) {
		invalidData = true;
	}
	else {
		if (!params.name || !params.country || !params.phone || !params.fax
			|| !params.address1 || !params.city || !params.state || !params.zipCode) {
			invalidData = true;
		}

		if (params.hiringClientId && (parseInt(params.hiringClientId) <= 0 || isNaN(parseInt(params.hiringClientId)))) invalidData = true;
	}

	if (invalidData == true) {
		const error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	let method = req.method;
	let originalUrl = req.originalUrl;
	params.userId = req.currentUser.Id;
	params.eventDescription = method + '/' + originalUrl;

	// Create HC
	await HiringClients.createHiringClient(params, async function (err, result, hcId) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}

		// Clone WF, Scorecard rules and trades
		if (!params.hiringClientId) {
			await HiringClients.cloneHiringClientInitialConfigs(hcId, function (err) {
				if (err) {
					console.log(err);
					error = error_helper.getSqlErrorData(err);
					return res.send(error);
				}
			});
		}

		let locHiringClientId = hcId;
		if (params.hiringClientId)
			locHiringClientId = params.hiringClientId;

		return res.status(200).json({ success: true, data: { hcId: locHiringClientId } });
	});
};

exports.updateHiringClientName = async (req, res) => {
	const body = req.body;
	let invalidData = false;
	let {
		hcId,
		newHCname
	} = body
	body.newHCname = addDoubleQuotes(newHCname)

	if (!body) {
		invalidData = true;
	} else {


		if (!hcId) invalidData = true;
		if (!newHCname) invalidData = true;
	}

	if (invalidData) {
		const error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		console.log(error);
		return res.status(500).send(error);
	}

	try {
		const logParams = {};
		logParams.userId = req.currentUser.Id;
		logParams.eventDescription = req.method + '/' + req.originalUrl;

		await HiringClients.updateHiringClientName(body, logParams, async function (err) {

			if (err) {
				console.log(err);
				error = error_helper.getSqlErrorData(err);
				return res.status(500).send(error);
			}
		});

		return res.status(200).json({ success: true });
	}
	catch (err) {
		console.log('err in /api = ', err)
		return res.status(500).send(err);
	}
}

exports.getHC_UnlinkedUsers = async function (req, res) {
	const params = {};
	let retVal = {};
	let invalidData = false

	if (!req.query)
		invalidData = true;

	if (req.query.hiringClientId && (parseInt(req.query.hiringClientId) <= 0 || isNaN(parseInt(req.query.hiringClientId)))) invalidData = true;
	if (invalidData) {
		let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	if (req.query.hiringClientId) {
		params.hiringClientId = req.query.hiringClientId;
	}

	await HiringClients.getHC_UnlinkedUsers(params, function (err, result) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		if (!result) {
			error = error_helper.getErrorData(error_helper.CODE_HIRING_CLIENT_NOT_FOUND, error_helper.MSG_HIRING_CLIENT_NOT_FOUND);
			console.log(error);
			return res.send(error);
		}

		return res.status(200).json({ success: true, data: result });
	});
};

exports.getHiringClientDetail = async function (req, res) {
	try {
		const params = {};
		let retVal = {};
		let invalidData = false

		if (req.query.hiringClientId && (parseInt(req.query.hiringClientId) <= 0 || isNaN(parseInt(req.query.hiringClientId)))) invalidData = true;
		if (invalidData) {
			let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
			return res.send(error);
		}

		if (req.query.hiringClientId) {
			params.hiringClientId = req.query.hiringClientId;
		}

		if (req.query.hiringClientName) {
			params.hiringClientName = req.query.hiringClientName;
		}

		await HiringClients.getHiringClientDetail(params, async function (err, result) {
			if (err) {
				console.log(err);
				error = error_helper.getSqlErrorData(err);
			}

			if (!result || result.length == 0) {
				error = error_helper.getErrorData(error_helper.CODE_HIRING_CLIENT_NOT_FOUND, error_helper.MSG_HIRING_CLIENT_NOT_FOUND);
				console.log(error);
				return res.send(error);
			}

			let entries = []
			result[0].logo = '';
			entries.push(result[0]);
			if (params.hiringClientId) {
				await _getLogo(params.hiringClientId, function (err, resultLogo) {
					if (err) {
						console.log(err);
					}
					else {
						result[0].logo = resultLogo;
					}
					return res.status(200).json({ success: true, data: entries });
				});
			} else {
				return res.status(200).json({ success: true, data: entries });
			}
		});
	}
	catch (err) {
		console.log(err);
		return res.status(500).send(err);
	}
};

exports.getHiringClients = async function (req, res) {
	const params = {};
	let retVal = {};
	let invalidData = false

	if (req.query.pageSize && (parseInt(req.query.pageSize) <= 0 || isNaN(parseInt(req.query.pageSize)))) invalidData = true;
	if (req.query.subcontractorId && (parseInt(req.query.subcontractorId) <= 0 || isNaN(parseInt(req.query.subcontractorId)))) invalidData = true;
	if (req.query.onlyParents && (req.query.onlyParents !== 'true' && req.query.onlyParents !== 'false')) invalidData = true;

	if (req.query.orderBy && (req.query.orderBy !== 'id' && req.query.orderBy !== 'name'
		&& req.query.orderBy !== 'registrationUrl'
		&& req.query.orderBy !== 'country'
		&& req.query.orderBy !== 'phone'
		&& req.query.orderBy !== 'contactName'
		&& req.query.orderBy !== 'state'
		&& req.query.orderBy !== 'ParentHiringClient'
		&& req.query.orderBy !== 'CFPortalURL')
	) invalidData = true;

	if (req.query.orderDirection && (req.query.orderDirection !== "ASC" && req.query.orderDirection !== "DESC")) invalidData = true;
	if (req.query.pageNumber && (parseInt(req.query.pageNumber) <= 0 || isNaN(parseInt(req.query.pageNumber)))) invalidData = true;
	if (invalidData) {
		let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		console.log('ERROR 223 '.repeat(50))
		return res.send(error);
	}

	if (req.query.userId) {
		params.userId = req.query.userId;
	}

	if (!req.query.userId)
		params.userId = req.currentUser.Id;

	params.pageSize = parseInt(req.query.pageSize);
	params.pageNumber = parseInt(req.query.pageNumber);
	params.onlyParents = (req.query.onlyParents == 'true');
	params.orderBy = req.query.orderBy;
	params.orderDirection = req.query.orderDirection;
	params.searchTerm = req.query.searchTerm;
	params.nameTerm = req.query.nameTerm;
	params.contactNameTerm = req.query.contactNameTerm;
	params.subcontractorId = req.query.subcontractorId;
	params.summary = req.query.summary;
	params.system = req.query.system;

	let roleId = 0;
	let CFRoleId = 0;
	if (params.userId) {
		const connection = await sql_helper.getConnection();
		query = query_provider.generateRoleByUserQuery(params);
		result = await connection.request().query(query);
		roleId = result.recordset[0].roleId;
		CFRoleId = result.recordset[0].CFRoleId;
	}
	console.log('USER ROLES', roleId, CFRoleId);
	params.roleId = roleId;
	params.CFRoleId = CFRoleId;

	let checkSCQuery = false;
	await HiringClients.getHiringClients(params, async function (err, result, totalRowsCount) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}

		if (!result) {
			// No records were found, check query for SC
			console.log("Get HC for SC user")
			if (params.subcontractorId) {
				checkSCQuery = true;
			}
			else {
				// No SC id was provided
				error = error_helper.getErrorData(error_helper.CODE_HIRING_CLIENT_NOT_FOUND, error_helper.MSG_HIRING_CLIENT_NOT_FOUND);
				console.log(error);
				console.log('ERROR 274 '.repeat(50))
				console.log('params =', params)
				return res.send(error);
			}
		}

		// Records were found
		if (!checkSCQuery) {
			retVal.totalCount = totalRowsCount;
			retVal.hiringClients = result;
			return res.status(200).json({ success: true, data: retVal });
		}
	});

	if (checkSCQuery) {
		await HiringClients.getHiringClientsForSC(params, function (err, result, totalRowsCount) {
			if (err) {
				error = error_helper.getSqlErrorData(err);
			}
			if (!result) {
				error = error_helper.getErrorData(error_helper.CODE_HIRING_CLIENT_NOT_FOUND, error_helper.MSG_HIRING_CLIENT_NOT_FOUND);
				console.log(error);
				return res.send(error);
			}

			retVal.totalCount = totalRowsCount;
			retVal.hiringClients = result;
			return res.status(200).json({ success: true, data: retVal });
		});
	}

};

exports.getHiringClientsUsers = async function (req, res) {
	const params = {};
	let retVal = {};

	if (req.query.hiringClientId) {
		params.hiringClientId = req.query.hiringClientId;
	}
	else {
		let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	await HiringClients.getHiringClientsUsers(params, function (err, result) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}

		if (!result) {
			error = error_helper.getErrorData(error_helper.CODE_USER_NOT_FOUND, error_helper.MSG_USER_NOT_FOUND);
			console.log(error);
			return res.send(error);
		}

		let entries = []

		if (result != null)
			for (let i = 0; i < result.length; i++) {
				let entry = {}
				entry.id = result[i].Id;
				entry.firstName = result[i].FirstName;
				entry.lastName = result[i].LastName;
				entry.mail = result[i].Mail;
				entries.push(entry);
			}

		return res.status(200).json({ success: true, data: entries });
	});
};

exports.getHiringClientsCount = async function (req, res) {
	HiringClients.getHiringClientsCount(function (err, result) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		if (!result) {
			error = error_helper.getErrorData(error_helper.CODE_HIRING_CLIENT_NOT_FOUND, error_helper.MSG_HIRING_CLIENT_NOT_FOUND);
			console.log(error);
			return res.send(error);
		}
		return res.status(200).json({ success: true, data: { totalCount: result } });
	});
};

exports.linkHiringClientAndUser = async function (req, res) {

	let invalidData = false;

	if (_.isEmpty(req.body)) {
		const error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	const params = req.body;
	const UserId = req.body.userId;
	const HiringClientId = req.body.hiringClientId;

	if (!UserId) {
		invalidData = true;
	}

	if (!HiringClientId) {
		invalidData = true;
	}

	if (invalidData) {
		let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	await HiringClients.linkHiringClientAndUser(params, function (err, result) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		return res.status(200).json({ success: true });
	});
};

exports.uploadLogo = async function (req, res) {
	try {
		let body = req.body;
		let logoFile = null;
		let hiringClientId = null;
		let invalidData = false;

		if (!body) {
			invalidData = true;
		}
		else {
			logoFile = req.files.logoFile;
			hiringClientId = req.body.hiringClientId;
			if (hiringClientId && (parseInt(hiringClientId) <= 0 || isNaN(parseInt(hiringClientId)))) invalidData = true;
		}

		if (invalidData) {
			let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
			return res.send(error);
		}

		let newFilename = hiringClientId.toString() + '.png'

		const s3 = new AWS.S3({ apiVersion: apiVersion, params: { Bucket: bucket } });
		console.log("Bucket object created");
		console.log("Bucket key:" + newFilename);

		params = { Bucket: bucket, Key: newFilename };
		s3.deleteObject(params, function (err, data) {
			if (err) {
				console.log(err)
				return res.status(500).send(error);
			} else {
				console.log("Object Successfully deleted from S3 Bucket");

				params = { Bucket: bucket, Key: newFilename, Body: logoFile.data };
				s3.upload(params, function (err, data) {
					if (err) {
						console.log(err)
						return res.status(500).send(error);
					} else {
						console.log("Successfully uploaded data to S3 Bucket");
						return res.status(200).json({ success: true });
					}
				});
			}
		});

	}
	catch (err) {
		console.log(err);
		return res.status(500).send(error);
	}
};

exports.updateHiringClientUserRelation = async function (req, res) {
	console.log('req.body = ', req.body)

	if (_.isEmpty(req.body) || !req.body.userId || !req.body.hiringClientIds) {
		let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	const params = {};
	let invalidData = false;


	if (parseInt(req.body.userId) <= 0 || isNaN(req.body.userId)) {
		invalidData = true;
	}

	if (req.body.hiringClientIds.length <= 0) {
		invalidData = true
	}

	if (invalidData) {
		let error = error_helper.getErrorData(error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	params.relations = Object.assign({}, req.body);
	params.userId = req.currentUser.Id;
	params.eventDescription = req.method + '/' + req.originalUrl;

	HiringClients.updateUserRelation(params, function (err, result) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		return res.status(200).json({ success: true, relationsUpdated: result });
	});
};

exports.getFirstHiringClientForUser = async function (user) {
	const params = {
		pageNumber: 1,
		pageSize: 1,
		roleId: user.RoleID,
		userId: user.Id
	};

	let hiringClient;

	await HiringClients.getHiringClients(params, function (err, result) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}

		if (!result) {
			error = error_helper.getErrorData(error_helper.CODE_HIRING_CLIENT_NOT_FOUND, error_helper.MSG_HIRING_CLIENT_NOT_FOUND);
			console.log(error);
			return error;
		}

		hiringClient = result.shift();
	});

	return hiringClient;
};

exports.getLogo = async function (hiringClientId, callback) {
	let logo = null;
	let fileName = hiringClientId.toString() + ".png";


	const s3 = new AWS.S3({ apiVersion: apiVersion, params: { Bucket: bucket } });

	console.log("Bucket object created");
	console.log("Bucket Key:" + fileName);

	let awsParams = { Bucket: bucket, Key: fileName };
	await s3.getObject(awsParams, function (err, data) {
		if (err) {
			console.log(err);
			logo = "";
			callback(err, null)
		}
		else {
			console.log("Successfully downloaded data from S3 Bucket");
			logo = data.Body.toString('base64')
			callback(null, logo)
		}
	});
}

_getLogo = async function (hiringClientId, callback) {
	let logo = null;
	let fileName = hiringClientId.toString() + ".png";

	const s3 = new AWS.S3({ apiVersion: apiVersion, params: { Bucket: bucket } });

	console.log("Bucket object created");
	console.log("Bucket Key:" + fileName);

	let awsParams = { Bucket: bucket, Key: fileName };
	await s3.getObject(awsParams, function (err, data) {
		if (err) {
			console.log(err);
			logo = "";
			//  writeLog('fileName = ', fileName)
			callback(err, null)
		}
		else {
			console.log("Successfully downloaded data from S3 Bucket");
			logo = data.Body.toString('base64')
			callback(null, logo)
		}
	});
}

exports.getHiringClientsBySubContractor = async function (req, res) {
	await HiringClients.getHiringClientsBySubContractor(req, function (err, result) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		return res.status(200).json({ success: true, data: result });
	});
}

exports.getFormByHiringClients = async function (req, res) {
	await HiringClients.getFormByHiringClients(req, function (err, result) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		return res.status(200).json({ success: true, data: result });
	});
}

exports.getSubmissionByFormId = async function (req, res) {
	await HiringClients.getSubmissionsByFormId(req, function (err, result) {
		if (err) {
			error = error_helper.getSqlErrorData(err);
			return res.send(error);
		}
		return res.status(200).json({ success: true, data: result });
	});
}