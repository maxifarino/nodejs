const crypto = require('crypto');
const error_helper = require('../helpers/error_helper');
const scApplications = require('../mssql/subcontractorsApplications');

const createUser = (params) => {
	return new Promise((resolve, reject) => {
		scApplications.createUser(params, (err, result, userId) => {
			if(err) {
				reject(err);
			}
			console.log('User created! ', userId);
			resolve(userId);
		});
	});	
}

const checkUserExists = (params) => {
	return new Promise((resolve, reject) => {
		scApplications.checkUser(params, (err, result) => {
			if(err) {
				reject(err);
			}	
			resolve(result);
		});
	});
}

const associateUserSC = (scId, userId) => {
	return new Promise((resolve, reject) => {
		scApplications.associateUserSC({scId, userId}, (err, result, userScId) => {
			console.log("result user asoc", result, userScId);
			if(err) {
				reject(err);
			}
			console.log('user associated to SC! ', userScId);
			resolve(userScId);	
		});	
	});
}

const savedForms = (params) => {
	return new Promise((resolve, reject) => {
		scApplications.savedForms(params, (err, result, scId) => {
			if(err) {
				reject(err);
			}
			console.log('savedForm created! ', scId);
			resolve(scId);
		});
	});	
}

const createUserAndSavedForm = async (params, formId) => {
	// Check if User exists
	try {
		userExists = await checkUserExists(params);
	} catch (error) {
		console.log(error)
		return res.send(error);
	};
	console.log('userExists', userExists);	
		
	if (userExists.length === 0) {
		console.log('User NOT Exists');	
		try {
			params.userId = await createUser(params);
			params.userScId = await	associateUserSC(params.scId, params.userId);
		} catch(error) {
			console.log(error)
			return res.send(error);
		};
	} else {
		console.log('User Exists', userExists);	
		// has already been associated => Error
		let isUserAssociatedToSC = userExists.find((e) => e.SubContractorId === params.scId);
		if (isUserAssociatedToSC) {
			return res.send({success: false, data:{ errorCode: 10019 }});
		}
		else {
			params.userId = userExists[0].UserId;
			console.log('UserId', params.userId, 'scId', params.scId);	

			await	associateUserSC(params.scId, params.userId)
				.catch(error => {
					console.log(error)
					return res.send(error);
				});
		} 
	}
	
	// FormId and SavedForm
	try {
		console.log("FormId", formId)
		if (formId) {
			params.formId = formId;
			params.subcontractorId = params.scId;
			params.hiringClientId = params.hcId;
			let savedFormId = await savedForms(params) ;
			console.log("SavedForm",savedFormId);
		}
	} catch(error) {
		console.log("error:",error)
		return res.send(error);
	};
}

const getHCApplicationsConfig = (params) => {
	return new Promise((resolve, reject) => {
		scApplications.getHCConfig(params, (err, result) => {
			console.log("result", result);
			if(err) {
				reject(err);
			}			
			resolve(result[0]);
		});	
	});
};

const checkSCExists = (params) => {
	return new Promise((resolve, reject) => {
		scApplications.checkSC(params, (err, result) => {
			if(err) {
				reject(err);
			}	
			resolve(result);
		});
	});
}	

const createSC = (params) => {
	return new Promise((resolve, reject) => {
		scApplications.createSC(params, (err, result, scId) => {
			if(err) {
				reject(err);
			}
			console.log('SC created! ', scId);
			resolve(scId);
		});
	});	
}

const createSClocation = (params) => {
	return new Promise((resolve, reject) => {
		scApplications.createSClocation(params, (err, result, locationId) => {
			if(err) {
				reject(err);
			}
			console.log('location created! ', locationId);
			resolve(locationId);
		});
	});	
}

const associateSC = (params) => {
	return new Promise((resolve, reject) => {
		// console.log("assoc SC 1", params);
		scApplications.associateSC(params, (err, result, hcScId) => {
			// console.log("assoc SC 2", result, hcScId);
			if(err) {
				reject(err);
			}
			console.log('SC associated to HC! ', hcScId);
			resolve(hcScId);	
		});	
	});
}	

const createSCAnswers = (params) => {
	return new Promise((resolve, reject) => {
		scApplications.createSCApplications(params, (err, result, scApplicationId) => {
			if(err) {
				reject(err);
			}
			console.log('Created SC Applications! ', scApplicationId);
			resolve(scApplicationId);
		});	
	});
}

const getDefaultForm = (params) => {
	return new Promise((resolve, reject) => {
		scApplications.getDefaulForm(params, (err, result) => {
			if(err) {
				reject(err);
			}
			console.log('Formid', result);
			if (result.length > 0) {
				resolve(result[0].id);
			} else {
				reject('Error: No formId settings found');
			}
		});	
	});
};

const getSCApplicationById = (scApplicationId) => {
	return new Promise((resolve, reject) => {
		scApplications.getSCApplications({ scApplicationId: scApplicationId }, (err, result) => {
			//console.log(err, result);
			if(err) {
				reject(err);
			}			
			resolve(result[0]);
		});	
	});
};

exports.getSCApplications = async (req, res) => {
	let queryParams = req.query || {};
	
	await scApplications.getSCApplications(queryParams, (err, scApplications, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, data: scApplications, totalCount: totalCount });
	});
};

exports.createSCApplications = async (req, res) => {
	const params                    = req.body;
	let   invalidData               = false;
	let   scExists                  = [];
	let   allowApplications;
	let   autoApproveApplications;
  let   userExists                = null;
  params.formId                   = null;
  params.scStatusId               = '';


	console.log(params);	
	
	// Validations
	if(!params) {
		invalidData = true;
	}	
	if(!params.hiringClientId || (parseInt(params.hiringClientId) <= 0 || isNaN(parseInt(params.hiringClientId)))) invalidData = true;
	if(invalidData){
		const error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}
		
	params.hcId               = params.hiringClientId;

	// Get HC applications config & check if SC exists
	try {
		const result            = await getHCApplicationsConfig(params);
		allowApplications       = result.AllowApplications;
    autoApproveApplications = result.AutoApproveApplications;
    params.scStatusId       = (autoApproveApplications)
				? 4 // 'Pending Submission' => Associate with current HCId (Pending Submission)
				: 19; // 'Applied' =>  Create SC, associate SC with current HCId (Applied)

    scExists                = await checkSCExists(params);
    console.log('scExists = ', scExists);
    console.log('allowApplications = ', allowApplications);
    console.log('autoApproveApplications = ', allowApplications);
	} catch (error) {
		console.log(error)
		return res.send(error);
	}

		
		

	// GEt default FormId
	try {
		params.formId           = await getDefaultForm(params) ;
	} catch(error) {
		console.log(error)
		return res.send(error);
	}
	console.log("params.formId", params.formId)

	if (scExists.length === 0) {
		console.log('SC NOT Exists');	
		
		try {
      params.scId           = await createSC(params);
      // console.log('SUB APPLICATION '.repeat(20))
      // console.log('\n')
      // console.log('params = ', params)
      params.hcScId         = await	associateSC(params);
      params.locId          = await createSClocation(params);
      // console.log('params after location SP = ', params)
		} catch(error) {
			console.log(error)
			return res.send(error);
		}
	} else {
		console.log('SC Exists');	
		// has already been associated => Error
		const isAssociatedToHC  = scExists.find((e) => e.HiringClientId === params.hcId);
		if (isAssociatedToHC) {
			return res.send({success: false, data:{ errorCode: 10019 }});
		} else {
			console.log("SC exist without association");
			params.scId           = scExists[0].SubcontractorId; 
			await	associateSC(params)
				.catch(error => {
					console.log(error)
					return res.send(error);
				});
		} 
	}

	params.passHashed = crypto.createHash('md5').update(params.pass).digest('hex');
	if (autoApproveApplications) {
		await createUserAndSavedForm(params, params.formId);
	}

	// Record answers
	console.log("Save Application");
	try {
		const scApplicationId = await createSCAnswers(params);
		return res.status(200).json({ success: true, data: { scApplicationId: scApplicationId } });
	} catch(error) {
		console.log(error)
		return res.send(error);
	}
};

exports.removeSCApplications = async (req, res) => {
  let params = req.body;
	var invalidData = false;

  if(!params.scApplicationId || (parseInt(params.scApplicationId) <= 0 || isNaN(parseInt(params.scApplicationId)))) invalidData = true;
	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await scApplications.removeSCApplications(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};


exports.approveSCApplications = async (req, res) => {
  let params = req.body;
	var invalidData = false;

  if(!params.applIDs || ( Array.isArray(params.applIDs) && params.applIDs.length == 0)) invalidData = true;
  if(!params.hcId || (parseInt(params.hcId) <= 0 || isNaN(parseInt(params.hcId)))) invalidData = true;
	console.log("data", params.applIDs, params.hcId, invalidData);	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
	}
	let applIDCount = params.applIDs.length;
	let errors = []
	params.applIDs.forEach(async (applID, idx) => {			
		console.log('applID',applID);		
		try {
			let applicationData =  await getSCApplicationById(applID)
			console.log('applicationData', applicationData);				
			if (applicationData) {
				let data = {
					scId: applicationData.SubcontractorID,
					subcontractorContactEmail: applicationData.SubcontractorContactEmail,
					subcontractorContactName: applicationData.SubcontractorContactName,
					passHashed: applicationData.Password,
					subcontractorContactPhone: applicationData.SubcontractorContactPhone,
				}
				createUserAndSavedForm(data, applicationData.formId); 				
				params.applID = applID;
				await scApplications.approveSCApplications(params, (err, result) => {
					if (err) {
						error = error_helper.getSqlErrorData(err);
					}
					console.log("Aplications approved for ID ", applID);	

					if (idx === (applIDCount - 1)) {
						return res.status(200).json({ errors, success: true });
					}
				});
			}
		} catch (err) {	
			error = error_helper.getSqlErrorData(err);
			errors.push({ applID, error });
			console.log(error, applID);
		}

	});

	
	/*
  await scApplications.approveSCApplications(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
		console.log("Aplications approved for IDs ", params.applIDs);
		let errors = [];
		
		params.applIDs.forEach(async applID => {
			
			console.log('applID',applID);		
			try {
				let applicationData =  await getSCApplicationById(applID)
				console.log('applicationData', applicationData);				
				if (applicationData) {
					//createUserAndSavedForm(); 
				}
			} catch (error) {	
					error = "error creating user & savedform for application id: " + error_helper.getSqlErrorData(err);
					errors.push(error);
					console.log(error, applID);
			}		
		});
		*/

		/*
		for (let i = 0; i < params.applIDs.length; i++) {
			const applID = params.applIDs[i];
			console.log("===> Creating user & savedform for application id: ", applID);
			try {
				let applicationData =  await getSCApplicationById({ scApplicationId: applID })
				console.log('applicationData', applicationData);				
				if (applicationData) {
					//createUserAndSavedForm(); 

				}
			} catch (error) {	
					error = "error creating user & savedform for application id: " + error_helper.getSqlErrorData(err);
					errors.push(error);
					console.log(error, applID);
				/*
				} else {
					console.log(result);
					
					if (result.length > 0) {
						//createUserAndSavedForm(); 
						let record = result[0];
						let data = {
							subcontractorContactEmail: record.SubcontractorContactName,
							subcontractorContactName: record.SubcontractorContactName,
							passHashed: record.Password,
							subcontractorContactPhone: record.SubcontractorContactPhone,
						}
						createUserAndSavedForm(data, record.formId); 
					}
				}				
			});
			}			
		}		
	});*/	
};


exports.declineSCApplications = async (req, res) => {
  let params = req.body;
	var invalidData = false;

  if(!params.applIDs || ( Array.isArray(params.applIDs) && params.applIDs.length == 0)) invalidData = true;
  if(!params.hcId || (parseInt(params.hcId) <= 0 || isNaN(parseInt(params.hcId)))) invalidData = true;
	console.log("data", params.applIDs, params.hcId, invalidData);	
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
	 	return res.send(error);
  }

  await scApplications.declineSCApplications(params, (err, result) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
    }
    
		return res.status(200).json({ success: true });
	});
};

exports.checkHC = async (req, res) => {
	let queryParams = req.query || {};
	console.log(req.query);	
	
	await scApplications.checkHC(queryParams, (err, hcId) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, data: hcId });
	});
};

exports.getResources = async function(req, res) {
  let queryParams = req.query;
  let hash = null;
  let invalidData = false;
	console.log(queryParams);
	
  if(!queryParams) {
    invalidData = true;
	}

	if(!queryParams.hiringClientId || (parseInt(queryParams.hiringClientId) <= 0 || isNaN(parseInt(queryParams.hiringClientId)))) invalidData = true;
	
  if(invalidData){
    let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
    console.log(error);
    return res.status(200).send(error);
  }

  await scApplications.getResources(queryParams, function (err, resultData) {
		if (err) {
				error = error_helper.getSqlErrorData(err);
		}
		return res.status(200).json({ success: true, data: resultData });
  });
}