exports.updateProjectInsuredComplianceStatus = (projInsusred, status) => {
    return `UPDATE ProjectsInsureds
            SET ComplianceStatusID = ${status}
            WHERE ProjectInsuredID = ${projInsusred}
            `
}

exports.updateCoveragesStatus = () => {
    return `UPDATE ProjectsInsureds
            SET ComplianceStatusID = ${status}
            WHERE ProjectInsuredID = ${projInsusred}
            `
}