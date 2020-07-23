const certificates = require('../cf_mssql/certificates');

exports.getCertificates = async (req, res) => {
    let queryParams = req.query || {};
    await certificates.getCerificates(queryParams, function (error, result) {
        //console.log('data;;', result);
        return res.status(200).json({ success: true, data: result });
    })
};

exports.getDeficiences = async (req, res) => {
    let queryParams = req.query || {};
    await certificates.getDeficiences(queryParams, function (error, result) {
        let deficiencies = result;
        // let deficiences = !result ? [] : result.map(x => {
        //     return {
        //         id: x.ProjectInsuredDeficiencyID,
        //         name: x.EndorsementName,
        //         description: '',
        //         coverage: x.CoverageType,
        //         coverageAttributeId: x.CAAttributeID,
        //         attribute: x.AttributeName,
        //         required: x.ConditionValue,
        //         provided: x.AttributeValue,
        //         type: //getDeficiencyTypeName(x.DeficiencyTypeID),
        //         status: //getStatusName(x.DeficiencyStatusID),
        //         selected: false,
        //         ruleGroupId: x.RuleGroupID,
        //         ruleId: x.RuleID,
        //         certificateId: x.CertificateID,
        //         //compilanceStatusId: x.CompilanceStatusID
        //         coverageAttributeStatusID:x.CoverageAttributeStatusID
        //     }
        // })
        return res.status(200).json({ success: true, data: deficiencies });
    });
};

// const getDeficiencyTypeName = function (deficiencyType) {
//     switch (deficiencyType) {
//         case 1:
//             return 'major';
//         case 2:
//             return 'minor';
//         case 3:
//             return 'endorsement';
//         default:
//             return null;
//     }
// }
// const getStatusName = function (deficiencyStatus) {
//     switch (deficiencyStatus) {
//         case 0:
//             return null;
//         case 1:
//             return 'confirmed';
//         case 2:
//             return 'waived';
//     }
// }

exports.setToggledeficiences = async (req, res) => {
    let queryParams = req.body || {};
    await certificates.updateToggledeficiences(queryParams, function (error, result) {
        return res.status(200).json({ success: true });
    })
}

exports.sendInsuredEmail = async (req, res) => {
    let queryParams = req.body || {};
    return res.status(200).json({ success: true });
}

exports.sendProcedureEmail = async (req, res) => {
    let queryParams = req.body || {};
    return res.status(200).json({ success: true });
}

exports.sendEmail = async (req, res) => {
    let queryParams = req.body || {};
    return res.status(200).json({ success: true });
}

exports.getUsers = async (req, res) => {
    await certificates.getUsers(function (error, result) {
        return res.status(200).json({ success: true, data: result });
    })
}

exports.getProjectInsured = async (req, res) => {
    let queryParam = req.query.projectInsuredId || {};
    await certificates.getProjectInsured(queryParam, function (error, result) {
        return res.status(200).json({ success: true, data: result });
    })
}

exports.saveWaiversDeficiencies = async (req, res) => {
    let queryParam = req.body || {};
    await certificates.WaiveDeficiencies(queryParam, function (error, result) {
        return res.status(200).json({ success: true, data: result });
    })
}

exports.undoWaiversDeficiencies = async (req, res) => {
    let queryParam = req.body || {};
    await certificates.undoWaiversDeficiencies(queryParam, function (error, result) {
        return res.status(200).json({ success: true, data: result });
    })
}

exports.confirmdeficiencies = async (req, res) => {
    const reqBody = req.body || {};  
    await certificates.confirmDeficiencies(reqBody, (error, result) => {
        return res.status(200).json({ success: true, data: result });
    })
}

exports.updateProcedureEmail = async (req, res) => {
    let queryParam = req.body || {};
    await certificates.updateProcedureEmail(queryParam, function (error, result) {
        return res.status(200).json({ success: true });
    })
}

exports.updateInsuredEmail = async (req, res) => {
    let queryParam = req.body || {};
    await certificates.updateInsuredEmail(queryParam, function (error, result) {
        return res.status(200).json({ success: true });
    })
}

exports.rejectCertificate = async (req, res) => {
    let queryParam = req.body || {};
    await certificates.rejectCertificate(queryParam, function (error, result) {
        if (error) {
            return res.status(200).json({ success: false, data: error });
        }
        return res.status(200).json({ success: true });
    })
}

exports.onHoldCertificate = async (req, res) => {
    let queryParam = req.body || {};
    await certificates.onHoldCertificate(queryParam, function (error, result) {
        return res.status(200).json({ success: true });
    })
}

exports.removeOnHoldCertificate = async (req, res) => {
    let queryParam = req.body || {};
    await certificates.removeOnHoldCertificate(queryParam, function (error, result) {
        return res.status(200).json({ success: true });
    })
}

exports.escalateCertificate = async (req, res) => {    
    await certificates.escalateCertificate(req, function (error, result) {
        return res.status(200).json({ success: true });
    })
}