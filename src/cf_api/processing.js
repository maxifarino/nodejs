const AWS = require('aws-sdk');
const { cfSign, bucket, apiVersion } = require('../helpers/aws_helper');
const error_helper = require('../helpers/error_helper');
const { asyncForEach } = require('../helpers/utils');
const processing = require('../cf_mssql/processing');

exports.getProcessing = async (req, res) => {
	let params = req.query || {};
	let invalidData = false;
	let processedData = [];
	let availableCoverages = [];

	if(!params) {
		invalidData = true;
	}
	if(!params.certificateId || ((parseInt(params.certificateId) <= 0 || isNaN(parseInt(params.certificateId))))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	await processing.getProcessing(params, async (err, data, totalCount, insurersData, endorsementsData) => {		
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}		

		if (data.length !== 0) {
			processedData = await processingOutput(data, insurersData, endorsementsData);
		
			if (data[0].FileName !== 'undefined') {
				const fileName = data[0].FileName.replace(/\.([a-zA-Z0-9]*)$/, `_${data[0].DocumentID}.$1`);
				let AWSFileLink = '';
				try {
					AWSFileLink = await getS3FileLink(fileName);
				} catch (err) {
					console.error('So this happened:', err);
				}
				processedData['url'] = AWSFileLink;
			}
			availableCoverages = await getAvailableCoverages({ holderId: data[0].HolderID, projectId: data[0].ProjectID });
		}		
		return res.status(200).json({ success: true, data: processedData, totalCount: totalCount, availableCoverages});
	});
};

const getS3FileLink = async (fileName) => (
	new Promise((resolve, reject) => {		
		cfSign(fileName, (err, url) => { err ? reject(err) : resolve(url) });
	})
);

const getAvailableCoverages = async (params) => (
	new Promise((resolve, reject) => {
		processing.getAvailableCoverages(params, (err, data) => { err ? reject(err) : resolve(data) });
	})
);

const processingOutput = async (data, insurersData, endorsementsData) => {
	const responseObj = {
		certificateId: data[0].CertificateId,
		dateCertificate: data[0].DateCertificate || new Date(),
		holder: {
			id: data[0].HolderID,
			name: data[0].HolderName
		},
		project: {
			id: data[0].ProjectID,
			name: data[0].ProjectName
		},
		projectInsuredId: data[0].ProjectInsuredID,
		insureds: {
			id: data[0].InsuredID,
			name: data[0].InsuredName,
			address: data[0].InsuredAddress,
			city: data[0].InsuredCity,
			state: data[0].InsuredState,
		},
		agency: {
			id: data[0].AgencyId,
			name: data[0].AgencyName,
			city: data[0].AgencyCity,
			state: data[0].AgencyState,
		},
		agent: {
			id: data[0].AgentId
		},
		coverages: [],
		insurers: [],
		endorsements: [],
	};

	data.forEach(item => {
		let coverageObj = {
			coverageId: item.CoverageID,
			coverageTypeId: item.CoverageTypeID,
			coverageTypeName: item.CoverageTypeName,
			coverageTypeCode: item.CoverageTypeCode,
			parentCoverageId: item.ParentCoverageID,
			effectiveDate: item.EffectiveDate,
			expirationDate: item.ExpirationDate,
			policyNumber: item.PolicyNumber,
			insurerId: item.InsurerID,			
			ruleGroupId: item.RuleGroupID,
		};

		let attributesArray = item.Attributes.split(',');
		
		if (Array.isArray(attributesArray)) {
			const attributes = attributesArray.map(attribute => {				
				let attr = attribute.split('|');
				return {
					id: attr[0],
					name: attr[1],
					value: attr[2]
				}
			});	
			coverageObj.attributes = attributes || [];
		}

		responseObj.coverages.push(coverageObj);
	});

	insurersData.forEach(item => {
		let insurersObj = {
			insurerId: item.InsurerID,
			coverageId: item.CoverageID,
			insurerName: item.InsurerName,
			amBestCompanyNumber: item.AMBestCompanyNumber,
			naicCompanyNumber: item.NAICCompanyNumber 
		};

		responseObj.insurers.push(insurersObj);
	});
	
	endorsementsData.forEach(item => responseObj.endorsements.push(item.EndorsementID));

	return responseObj;
};


exports.createProcessing = async (req, res) => {
	let params = req.body;
  let invalidData = false;
		
	if(!params) {
		invalidData = true;
	}
	console.log('createProcessing: ', params);
	
	// Required Params
  // (projectInsuredId, documentId, agencyId, insuredId, coverages[], coverages.attributes[])
	if(!params.projectInsuredId || ((parseInt(params.projectInsuredId) <= 0 || isNaN(parseInt(params.projectInsuredId))))) invalidData = true;
	if(!params.documentId || ((parseInt(params.documentId) <= 0 || isNaN(parseInt(params.documentId))))) invalidData = true;
	if(!params.agencyId || ((parseInt(params.agencyId) <= 0 || isNaN(parseInt(params.agencyId))))) invalidData = true;
	if(!params.coverages || !Array.isArray(params.coverages)) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  await processing.createProcessing(params, (err, result, data, certificateId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
		}
		return res.status(200).json({ success: true, certificateId: certificateId });
	});
};

exports.updateProcessing = async (req, res) => {
	let params = req.body;
  let invalidData = false;
		
	if(!params) {
		invalidData = true;
	}
	console.log('updateProcessing: ', params);
	
	// Required Params
  // (certificateId, projectInsuredId, documentId, agencyId, insuredId, coverages[], coverages.attributes[])
	if(!params.certificateId || ((parseInt(params.certificateId) <= 0 || isNaN(parseInt(params.certificateId))))) invalidData = true;
	if(!params.projectInsuredId || ((parseInt(params.projectInsuredId) <= 0 || isNaN(parseInt(params.projectInsuredId))))) invalidData = true;
	if(!params.documentId || ((parseInt(params.documentId) <= 0 || isNaN(parseInt(params.documentId))))) invalidData = true;
	if(!params.agencyId || ((parseInt(params.agencyId) <= 0 || isNaN(parseInt(params.agencyId))))) invalidData = true;
	if(!params.coverages || !Array.isArray(params.coverages)) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  await processing.updateProcessing(params, (err, result, data) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
		}
		return res.status(200).json({ success: true, certificateId: params.certificateId });
	});
};


exports.calculateDeficiencies = async (req, res) => {
	let params = req.body;
	let invalidData = false;
	console.log('params', params);
	if(!params.documentId || ((parseInt(params.documentId) <= 0 || isNaN(parseInt(params.documentId))))) invalidData = true;
	if(!params.holderId || ((parseInt(params.holderId) <= 0 || isNaN(parseInt(params.holderId))))) invalidData = true;
	if(!params.projectId || ((parseInt(params.projectId) <= 0 || isNaN(parseInt(params.projectId))))) invalidData = true;
	if(!params.certificateId || ((parseInt(params.certificateId) <= 0 || isNaN(parseInt(params.certificateId))))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	await processing.calculateDeficiencies(params, async (err, data, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}

		return res.status(200).json({ success: true });
	});	
}


// exports.getDeficiencyViewer = async (req, res) => {
// 	let queryParams = req.query || {};
// 	let invalidData = false;

// 	if(!queryParams.documentId || ((parseInt(queryParams.documentId) <= 0 || isNaN(parseInt(queryParams.documentId))))) invalidData = true;
	
// 	if(invalidData){
// 		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
// 		return res.send(error);
// 	}
		
// 	await processing.getDeficiencyViewer(queryParams, async (err, data, totalCount) => {
// 		if (err) {
// 			error = error_helper.getSqlErrorData(err);
// 		}
		
// 		if (data.length > 0)	{
// 			const processedData = await processingDefViewerData(data);
		
// 			if (data[0].FileName !== 'undefined') {
// 				const fileName = data[0].FileName.replace(/\.([a-zA-Z0-9]*)$/, `_${queryParams.documentId}.$1`);
// 				let AWSFileLink = '';
// 				try {
// 					AWSFileLink = await getS3FileLink(fileName);
// 				} catch (err) {
// 					console.error('So this happened:', err);
// 				}
// 				processedData['url'] = AWSFileLink;
// 			}
	
// 			return res.status(200).json({ success: true, data: processedData });
// 		} else {
// 			return res.status(200).json({ success: false, data: [] });

// 		}
// 	});
// };

const processingDefViewerData = (data) => {		
	const deficienciesObj = data.reduce(function(obj, item) {
		(obj[item.DeficiencyTypeID] = obj[item.DeficiencyTypeID] || []).push(item);
		return obj;
	}, {});

	return {
		holder: {
			id: data[0].HolderID,
			name: data[0].HolderName
		},
		project: {
			id: data[0].ProjectID,
			name: data[0].ProjectName
		},
		projectInsuredId: data[0].ProjectInsuredID,
		reqSetId: data[0].ReqSetId,
		deficiencies: deficienciesObj
	};
		
	/*
		majorDeficiencies: [
			{
				id: 1,
				title: 'General Liability',
				deficiencies: [
					{
						id: 1,
						text: 'Commercial General Liability was not checked',
					},
					{
						id: 2,
						text: 'Each Occurence Limit $1,000,000 / $5,000,000',
					}
				]
			},
			{
				id: 3,
				title: 'Wyoming Workers Compensation',
				deficiencies: [
					{
						id: 1,
						text: 'Coverage not provided',
					}
				]
			}
		],
		minorDeficiencies: [
			{
				id: 1,
				title: 'General Liability',
				deficiencies: [
					{
						id: 3,
						text: 'Occur was not checked',
					}
				]
			}
		],
		endorsements: [
			{
				id: 1,
				title: 'General Liability',
				endorsements: [
					{
						id: 1,
						text: '{Holder} are named as additional insured on the General Liability policy',
					},
					{
						id: 2,
						text: 'Waiver of subrogation applies on the General Liability policy',
					}
				]
			},
			{
				id: 2,
				title: 'Automotive Liability',
				endorsements: [
					{
						id: 3,
						text: 'Waiver of subrogation applies on the Automobile Liability policy',
					}
				]
			}
		]
	}*/
};

/**
 * COIs
 */
exports.getCertificateOfInsurance = async (req, res) => {
	let params = req.query || {};
	let invalidData = false;

	if(!params) {
		invalidData = true;
	}
	if(!params.certificateId || ((parseInt(params.certificateId) <= 0 || isNaN(parseInt(params.certificateId))))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

	await processing.getCertificateOfInsurance(params, async (err, data) => {		
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		
		if (data[0].FileName !== 'undefined') {			
			const fileName = data[0].FileName.replace(/\.([a-zA-Z0-9]*)$/, `_${data[0].DocumentId}.$1`);
			let AWSFileLink = '';
			try {
				AWSFileLink = await getS3FileLink(fileName);
			} catch (err) {
				console.error('So this happened:', err);
			}
			data[0]['DocumentUrl'] = AWSFileLink;
		}

		return res.status(200).json({ success: true, data: data });
	});
};

exports.createCertificateOfInsurance = async (req, res) => {
	let params = req.body;
  let invalidData = false;
		
	if(!params) {
		invalidData = true;
	}

	if(!params.holderId || ((parseInt(params.holderId) <= 0 || isNaN(parseInt(params.holderId))))) invalidData = true;
	if(!params.projectId || ((parseInt(params.projectId) <= 0 || isNaN(parseInt(params.projectId))))) invalidData = true;
	if(!params.insuredId || ((parseInt(params.insuredId) <= 0 || isNaN(parseInt(params.insuredId))))) invalidData = true;
	if(!params.projectInsuredId || ((parseInt(params.projectInsuredId) <= 0 || isNaN(parseInt(params.projectInsuredId))))) invalidData = true;
	if(!params.documentId || ((parseInt(params.documentId) <= 0 || isNaN(parseInt(params.documentId))))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  await processing.createCertificateOfInsurance(params, (err, result, certificateId) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
		}
		return res.status(200).json({ success: true, certificateId: certificateId });
	});
};

exports.updateCertificateOfInsurance = async (req, res) => {
	let params = req.body;
  let invalidData = false;
		
	if(!params) {
		invalidData = true;
	}
	
	if(!params.certificateId || ((parseInt(params.certificateId) <= 0 || isNaN(parseInt(params.certificateId))))) invalidData = true;
	if(!params.holderId || ((parseInt(params.holderId) <= 0 || isNaN(parseInt(params.holderId))))) invalidData = true;
	if(!params.projectId || ((parseInt(params.projectId) <= 0 || isNaN(parseInt(params.projectId))))) invalidData = true;
	if(!params.insuredId || ((parseInt(params.insuredId) <= 0 || isNaN(parseInt(params.insuredId))))) invalidData = true;
	if(!params.projectInsuredId || ((parseInt(params.projectInsuredId) <= 0 || isNaN(parseInt(params.projectInsuredId))))) invalidData = true;
	if(!params.documentId || ((parseInt(params.documentId) <= 0 || isNaN(parseInt(params.documentId))))) invalidData = true;

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  await processing.updateCertificateOfInsurance(params, (err, result) => {
  	if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
		}
		return res.status(200).json({ success: true, certificateId: params.certificateId });
	});
};