const AWS = require('aws-sdk');
const { bucket, apiVersion } = require('../helpers/aws_helper')
const error_helper = require('../helpers/error_helper');
const certUpload = require('../cf_mssql/certUpload');

exports.validateHash = async (req, res) => {
	let queryParams = req.body || {};
  let invalidData = false;

	console.log('DATA', req.body, req.query);
	if(!queryParams) {
		invalidData = true;
	}

	if(!queryParams.hash) {
		invalidData = true;
	}
		
	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
	}

  await certUpload.validateHash(queryParams, async (err, data) => {
		console.log('validateHash err:', err, data);		
		if(err) {
  		error = error_helper.getSqlErrorData(err);
  		return res.send(error);
		}
		
		if(data.length > 0) {
			try {
				data[0].logo = await getLogo(data[0].holderId);
			}	
			catch(err) {
				console.log('validateHash getLogo err:', err);
				data[0].logo = null;
				//return res.send('Error when retrieving holder logo');
			}	
		}
		return res.status(200).json({ success: true, data });
  });
};

const getLogo = async (holderId) => (
	new Promise((resolve, reject) => {
		let logo = null;
		let fileName = holderId.toString() + ".png";	
		const s3 = new AWS.S3({apiVersion: apiVersion, params: { Bucket: bucket }});
  	let awsParams = {Bucket: bucket, Key: fileName};
		console.log("Bucket Key:" + fileName);
		s3.getObject(awsParams, (err, data) => {
			if (err) {
				console.log(err);
				reject(err)
			}
			else {
				console.log("Successfully downloaded data from S3 Bucket");
				logo = data.Body.toString('base64')
				resolve(logo);
			}
		});
	})
);