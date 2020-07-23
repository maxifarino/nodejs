exports.getErrorData = function(errCode, desc, err) {
    var error = err || {}; 
	return { success:false, data:{ errorCode:errCode, description:desc, error:error } };
}

exports.getSqlErrorData = function(err) {
    var error = err || {}; 
    return { success:false, data:{ errorCode:this.CODE_MSSQL_ERROR, description:this.MSG_MSSQL_ERROR, error:error } };
}

exports.getMongoErrorData = function(mongoErr) {
	var error = { success:false, data:{} };

	if(mongoErr.code == 11000) {
        error.data.errorCode = this.CODE_EMAIL_IN_USE;
        error.data.description = this.MSG_EMAIL_IN_USE;
        error.data.error = mongoErr;
    } else {
        error.data.errorCode = this.CODE_MONGODB_ERROR;
        error.data.description = mongoErr.errmsg || mongoErr.message;
        error.data.error = mongoErr;
    }

	return error;
}

exports.getLoginErrorData = function(errCode,desc,loginErr) {
    var error = { success:false, data:{} };
    
    error.data.errorCode = errCode;
    error.data.description = desc;
    error.data.error = loginErr;

    return error;
}

exports.CODE_BACKEND_ERROR = 10000;
exports.MSG_BACKEND_ERROR = 'Backend error.';

exports.CODE_MSSQL_ERROR = 10001;
exports.MSG_MSSQL_ERROR = 'MSSQL error.';

exports.CODE_MONGODB_ERROR = 10002;
exports.MSG_MONGODB_ERROR = 'MongoDB error.';

exports.CODE_INVALID_DATA = 10003;
exports.MSG_INVALID_DATA = 'Invalid data.';

exports.CODE_EMAIL_IN_USE = 10004;
exports.MSG_EMAIL_IN_USE = 'This email is already in use.';

exports.CODE_NO_TOKEN = 10005;
exports.MSG_NO_TOKEN = 'No token provided.';

exports.CODE_TOKEN_FAILED = 10006;
exports.MSG_TOKEN_FAILED = 'Failed to authenticate token.';

exports.CODE_TOKEN_EXPIRED = 10007;
exports.MSG_TOKEN_EXPIRED = 'The token is expired.';

exports.CODE_USER_NOT_FOUND = 10008;
exports.MSG_USER_NOT_FOUND = 'User not found.';

exports.CODE_PASSWORD_FAILED = 10009;
exports.MSG_PASSWORD_FAILED = 'Invalid Password.';

exports.CODE_LOGIN_ERROR = 10010;
exports.MSG_LOGIN_ERROR = 'Login error.';

exports.CODE_USER_DISABLED = 10011;
exports.MSG_USER_DISABLED = 'The user is disabled.';

exports.CODE_INVALID_PASSWORD = 10012;
exports.MSG_INVALID_PASSWORD = 'Invalid password format.';

exports.CODE_INVALID_EMAIL = 10013;
exports.MSG_INVALID_EMAIL = 'Invalid email format.';

exports.CODE_INVALID_ROLE = 10014;
exports.MSG_INVALID_ROLE = 'Invalid role.';

exports.CODE_USER_NOT_ALLOWED = 10015;
exports.MSG_USER_NOT_ALLOWED = 'The user is not allowed to do that.';

exports.CODE_INVALID_TITLE = 10016;
exports.MSG_INVALID_TITLE = 'Invalid user title.';

exports.CODE_INVALID_TIMEZONE = 10017;
exports.MSG_INVALID_TIMEZONE = 'Invalid time zone.';

exports.CODE_FORM_NOT_FOUND = 10018;
exports.MSG_FORM_NOT_FOUND = 'Form not found.';

exports.CODE_HIRING_CLIENT_NOT_FOUND = 10019;
exports.MSG_HIRING_CLIENT_NOT_FOUND = 'No Hiring clients found.';

exports.CODE_SUB_CONTRACTOR_NOT_FOUND = 10020;
exports.MSG_SUB_CONTRACTOR_NOT_FOUND = 'No Sub Contractors found.';

exports.CODE_TAXID_IN_USE = 10021;
exports.MSG_TAXID_IN_USE = 'This tax id is already in use.';

exports.CODE_TEMPLATE_NOT_FOUND = 10022;
exports.MSG_TEMPLATE_NOT_FOUND = 'No templates found';

exports.CODE_LANG_NOT_FOUND = 10023;
exports.MSG_LANG_NOT_FOUND = 'No languages found';

exports.CODE_LOG_EVENT_TYPE_NOT_FOUND = 10024;
exports.MSG_LOG_EVENT_TYPE_NOT_FOUND = 'No event type was found';

exports.CODE_PROJECT_NOT_FOUND = 10025;
exports.MSG_PROJECT_NOT_FOUND = 'Project not found.';

exports.CODE_REFERENCE_NOT_FOUND = 10026;
exports.MSG_REFERENCE_NOT_FOUND = 'No references found.';

exports.CODE_REFERENCE_RESPONSE_NOT_FOUND = 10027;
exports.MSG_REFERENCE_RESPONSE_NOT_FOUND = 'No responses found.';

exports.CODE_NO_FILE_UPLOADED = 10028;
exports.MSG_NO_FILE_UPLOADED = 'No file was uploaded.';
  
exports.CODE_TASK_NOT_FOUND = 10029;
exports.MSG_TASK_NOT_FOUND = 'No tasks found.';

exports.CODE_ACCOUNT_VALUE_NOT_FOUND = 10030;
exports.MSG_ACCOUNT_VALUE_NOT_FOUND = 'No account value found.';

exports.CODE_ACCOUNT_NOT_FOUND = 10031;
exports.MSG_ACCOUNT_NOT_FOUND = 'No account found';

exports.CODE_SUBCONTRACTOR_STATUS_COUNT_NOT_FOUND = 10032;
exports.MSG_SUBCONTRACTOR_STATUS_COUNT_NOT_FOUND = 'Subcontractor Status Count not found.';

exports.CODE_WORKFLOW_NOT_FOUND = 10040;
exports.MSG_WORKFLOW_NOT_FOUND = 'Workflow not found.';

exports.CODE_SAVED_FORM_NOT_FOUND = 10050;
exports.MSG_SAVED_FORM_NOT_FOUND = 'No saved form found.';

exports.CODE_SAVED_FILE_FAILED = 10060;
exports.MSG_SAVED_FILE_FAILEDND = 'The file was not saved.';

exports.CODE_EXAGO_ERROR = 10070;
exports.MSG_EXAGO_ERROR = 'Exago error.';

exports.CODE_BRAINTREE_ERROR = 10080;
exports.MSG_BRAINTREE_ERROR = 'Braintree error.';

exports.CODE_VIDEO_NOT_FOUND = 10090;
exports.MSG_VIDEO_NOT_FOUND = 'No video information found.';

exports.COUNTRIES_NOT_FOUND = 10100;
exports.MSG_COUNTRIES_NOT_FOUND = 'No countries information found.';

exports.CODE_STATES_NOT_FOUND = 10101;
exports.MSG_STATES_NOT_FOUND = 'No states information found.';

exports.CODE_HOLDERS_NOT_FOUND = 10110;
exports.MSG_HOLDERS_NOT_FOUND = 'No holders information found.';

exports.CODE_CONTACTS_NOT_FOUND = 10120;
exports.MSG_CONTACTS_NOT_FOUND = 'No contacts information found.';

exports.CODE_PROJECT_INSURED_EXISTS = 10130;
exports.MSG_PROJECT_INSURED_EXISTS = 'Project insured already exists.';

exports.CODE_SUBCONTRACTOR_LOCATIONS_NOT_FOUND = 10140;
exports.MSG_SUBCONTRACTOR_LOCATIONS_NOT_FOUND = 'No locations found.';

exports.CODE_PROJECT_USER_EXISTS = 10150;
exports.MSG_PROJECT_USER_EXISTS = 'The user is already associated to the project.';
exports.CODE_PROJECT_USER_IVALID = 10151;
exports.MSG_PROJECT_USER_IVALID = 'The user given is invalid.';
exports.CODE_PROJECT_PPROJECT_IVALID = 10152;
exports.MSG_PROJECT_PPROJECT_IVALID = 'The project given is invalid.';
