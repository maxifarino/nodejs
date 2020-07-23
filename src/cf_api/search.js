const search = require('../cf_mssql/search');
const error_helper = require('../helpers/error_helper');
const _ = require('underscore')

exports.getData = async (req, res) => {
	let queryParams = req.query || {};
	let invalidData = false;
	const availableSections = ['insureds', 'projects', 'holders', 'contacts', 'agencies'];

	if(!queryParams) {
		invalidData = true;
	}
	if(!queryParams.section) {
		invalidData = true;
	}
	
	if (availableSections.indexOf(queryParams.section) === -1) {
		invalidData = true;
	}

	if(invalidData){
		let error = error_helper.getErrorData (error_helper.CODE_INVALID_DATA, error_helper.MSG_INVALID_DATA);
		return res.send(error);
  }

  await search.getData(queryParams, async (err, data, totalCount) => {
		if (err) {
			error = error_helper.getSqlErrorData(err);
		}
		let result = data;
		if (queryParams.section === 'projects') {
			result = await processSearchProjectsData(result);
		}
		
		return res.status(200).json({ success: true, data: result, totalCount: totalCount});
	});
};

processSearchProjectsData = async (data) => {
	if (Array.isArray(data)) {
		return data.map((item) => {			
			let holderArray = item.Holder.split(",")
			item.Holder = _.unique(holderArray);
			return item;
		});
	} else {
		return data;
	}
}