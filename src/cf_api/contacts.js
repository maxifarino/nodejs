const error_helper = require('../helpers/error_helper');
const contacts = require('../cf_mssql/contacts');

exports.getContacts = async function(req, res) {
	const params = {};
	let retVal = {};
	let invalidData = false

  if(req.query.holderId && (parseInt(req.query.holderId) <= 0 || isNaN(parseInt(req.query.holderId)))) invalidData = true;
  if(req.query.insuredId && (parseInt(req.query.insuredId) <= 0 || isNaN(parseInt(req.query.insuredId)))) invalidData = true;
	if(req.query.pageSize && (parseInt(req.query.pageSize) <= 0 || isNaN(parseInt(req.query.pageSize)))) invalidData = true;
  if(req.query.orderBy && (req.query.orderBy !== 'contactId'
              && req.query.orderBy !== 'firstName'
		 					&& req.query.orderBy !== 'lastName'
		 					&& req.query.orderBy !== 'phoneNumber'
		 					&& req.query.orderBy !== 'mobileNumber'
		 					&& req.query.orderBy !== 'emailAddress')) invalidData = true;

	if(req.query.orderDirection && (req.query.orderDirection !== "ASC" && req.query.orderDirection !== "DESC")) invalidData = true;
  if(req.query.pageNumber && (parseInt(req.query.pageNumber) <= 0 || isNaN(parseInt(req.query.pageNumber)))) invalidData = true;

	params.pageSize = parseInt(req.query.pageSize);
	params.pageNumber = parseInt(req.query.pageNumber);
	params.orderBy = req.query.orderBy;
	params.orderDirection = req.query.orderDirection;
	params.firstNameTerm = req.query.firstNameTerm;
	params.lastNameTerm = req.query.lastNameTerm;
	params.entityTerm = req.query.entityTerm;	
	params.holderId = req.query.holderId;
	params.insuredId = req.query.insuredId;
	params.typeId = req.query.typeId;
	params.summary = req.query.summary;


  contacts.getContacts(params, async function(err, result, totalRowsCount) {
    if(err) {
      return res.send(err);
    }
    
    if(!result.contacts) {
			let error = error_helper.getErrorData(error_helper.CODE_CONTACTS_NOT_FOUND, error_helper.MSG_CONTACTS_NOT_FOUND);
			error.data.contactsTypesPossibleValues = result.contactsTypesPossibleValues;
      return res.send(error);
		}
		
		retVal = result;
		retVal.totalCount = totalRowsCount;

		if (params.entityTerm) {			
			retVal.contacts = await filterByEntityTerm(params.entityTerm, result.contacts);
			retVal.totalCount = retVal.length;
		}
    return res.status(200).json( { success: true, data: retVal });
  });
}

const filterByEntityTerm = async (entityTerm, data) => (		
	data.filter((el) => (el.entity) && (el.entity.toLowerCase().indexOf(entityTerm.toLowerCase()) >= 0))
);

exports.createContact = async function(req, res) {

	let invalidData = false;
	let params = req.body;

	if(!params) {
		invalidData = true;
	}
	else {
	  if (!params.firstName || !params.lastName || !params.phoneNumber ) {
		  	invalidData = true;
		  }

		if(params.contactId && (parseInt(params.contactId) <= 0 || isNaN(parseInt(params.contactId)))) invalidData = true;
  }

  if (invalidData == true) {
    const error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    return res.send(error);
  }

  let method = req.method;
  let originalUrl = req.originalUrl;
  params.userId = req.currentUser.Id;
  params.eventDescription = method + '/' + originalUrl;

  await contacts.createContact(params, async function(err, result, cId) {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}

	  let locContactId = cId;
	  if(params.contactId)
	  	locContactId = params.contactId;

  	return res.status(200).json({ success: true, data: { cId: locContactId } });
  });
};


exports.linkContactAndHolder = async function(req, res) {

	let invalidData = false;
	if (_.isEmpty(req.body)) {
		const error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  const params = req.body;
	const holderId = req.body.holderId;
	const contactId = req.body.contactId;

	if (!holderId)	invalidData = true;
	if (!contactId)	invalidData = true;

	if(invalidData) {
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  await contacts.linkContactAndHolder(params, function(err, result) {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}
  	return res.status(200).json({ success: true });
  });
};

exports.linkContactAndInsured = async function(req, res) {

	let invalidData = false;
	if (_.isEmpty(req.body)) {
		const error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  const params = req.body;
	const insuredId = req.body.insuredId;
	const contactId = req.body.contactId;

	if (!insuredId)	invalidData = true;
	if (!contactId)	invalidData = true;

	if(invalidData) {
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  await contacts.linkContactAndInsured(params, function(err, result) {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}
  	return res.status(200).json({ success: true });
  });
};


exports.unlinkContactAndHolder = async function(req, res) {

	let invalidData = false;
	if (_.isEmpty(req.body)) {
		const error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  const params = req.body;
	const holderId = req.body.holderId;
	const contactId = req.body.contactId;

	if (!holderId)	invalidData = true;
	if (!contactId)	invalidData = true;

	if(invalidData) {
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  await contacts.unlinkContactAndHolder(params, function(err, result) {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}
  	return res.status(200).json({ success: true });
  });
};

exports.unlinkContactAndInsured = async function(req, res) {

	let invalidData = false;
	if (_.isEmpty(req.body)) {
		const error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  const params = req.body;
	const insuredId = req.body.insuredId;
	const contactId = req.body.contactId;

	if (!insuredId)	invalidData = true;
	if (!contactId)	invalidData = true;

	if(invalidData) {
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  await contacts.unlinkContactAndInsured(params, function(err, result) {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
  	}
  	return res.status(200).json({ success: true });
  });
};
