const _ = require('lodash');
const workflows_mssql = require('../mssql/workflows');
const tasks_mssql = require('../mssql/tasks');
const mail_processor = require('./emails');
const workflows_utils = require('./wf_utils');
const error_helper = require('../helpers/error_helper');
const { verbose } = require('../../logConfig')

const _getLastSentEmail = (hc_sc_pair, wf, callback) => {
  let lastSentEmail = null;
  let currentComp = wf.components[hc_sc_pair.wfStepIndex - 1];
  workflows_mssql.getLastSentEmail(hc_sc_pair, function(err, resultLastEmail) {
    if(verbose)
      console.log('Get last sent mail');
    if (err) {
      console.log(err)
    }

    lastSentEmails = resultLastEmail;

    if(lastSentEmails.length > 0)  // Previous email
      lastSentEmail = lastSentEmails[0];

    callback(lastSentEmail);
  });
}

_getSCStatusIdByHC_SC_Pair =  async function(hc_sc_pair) {

  let currentStatusId = null;

  await workflows_mssql.getSCStatusIdByHC_SC_Pair(hc_sc_pair, function(err, statusIdResult) {
    if(verbose)
      console.log('Get WF mail template');
    if (err) {
      console.log(err)
    }

    currentStatusId = statusIdResult[0].SubcontractorStatusId;
  });

  return  currentStatusId;
}

exports.wfSendEmail = async function(hc_sc_pair, step, wf) {
  if(verbose) {
    console.log("wfSendEmail:");
    console.log(hc_sc_pair);
    console.log(step);
    console.log(wf.components[step - 1]);
  }

  const remediationTime = 60 * 60 * 1000; // 1 hour as milliseconds

  await workflows_utils.wfSendEmail(hc_sc_pair, step, wf);

  // Check in 1 hour, and if last email bounced
  // then execute remediation if configured

/*  setTimeout(() => {
    const callback = function (lastSentEmail) {
      const wfComponent = wf.components[step - 1];
      const remedation = _.find(wfComponent, { componentParameterId: 9 });
      const remedationComponentId = _.get(remedation, 'componentId');

      if (remedationValue && lastSentEmail.bounceCode) {
        // remediation required
        const possibleRemedationActions = {
          4: workflows_utils.wfRemediationUpdateEmailAddressTask,
          5: workflows_utils.wfRemediationCalleAndUpdateEmailAddressTask,
          6: workflows_utils.wfRemediationForceCalleTask,
        };

        possibleRemedationActions[remedationComponentId](hc_sc_pair, step, wf);
      } else {
        // no remediation required, then increment step
        workflows_utils.incrementStep(hc_sc_pair, step, wf);
      }
    };

    _getLastSentEmail(hc_sc_pair, wf, callback);

  }, remediationTime);
*/
  workflows_utils.incrementStep(hc_sc_pair, step, wf);
}

exports.wfAddWaitingTask = async function(hc_sc_pair, step, wf) {
  if(verbose) {
    console.log("AddWaitingTask:");
    console.log(hc_sc_pair);
    console.log(step);
    console.log(wf.components[step - 1]);
  }

  await workflows_utils.wfAddWaitingTask(hc_sc_pair, step, wf);
}

exports.wfAddNonWaitingTask = async function(hc_sc_pair, step, wf) {
  if(verbose) {
    console.log("AddNonWaitingTask:");
    console.log(hc_sc_pair);
    console.log(step);
    console.log(wf.components[step - 1]);
  }

  let lastTask = null;

  // Task needs to be created
  // Create task
  await workflows_utils.createTask(hc_sc_pair, wf, step, 0, 0);

  // increment step
  await workflows_utils.incrementStep(hc_sc_pair, step, wf);
}

exports.wfRemediationUpdateEmailAddressTask = async function(hc_sc_pair, step, wf) {
  if(verbose) {
    console.log("AddNonWaitingTask:");
    console.log(hc_sc_pair);
    console.log(step);
    console.log(wf.components[step - 1]);
  }
  await workflows_utils.wfRemediationUpdateEmailAddressTask(hc_sc_pair, step, wf);
}

exports.wfRemediationCalleAndUpdateEmailAddressTask = async function(hc_sc_pair, step, wf) {
  if(verbose) {
    console.log("wfRemediationCalleAndUpdateEmailAddressTask:");
    console.log(hc_sc_pair);
    console.log(step);
    console.log(wf.components[step - 1]);
  }
  await workflows_utils.wfRemediationCalleAndUpdateEmailAddressTask(hc_sc_pair, step, wf);
}

exports.wfRemediationForceCalleTask = async function(hc_sc_pair, step, wf) {
  if(verbose) {
    console.log("wfRemediationForceCalleTask:");
    console.log(hc_sc_pair);
    console.log(step);
    console.log(wf.components[step - 1]);
  }
  await workflows_utils.wfRemediationForceCalleTask(hc_sc_pair, step, wf);
}

exports.wfCheckBehaviourTask = async function(hc_sc_pair, step, wf) {
  if(verbose) {
    console.log("wfCheckBehaviourTask:");
    console.log(hc_sc_pair);
    console.log(step);
    console.log(wf.components[step - 1]);
  }

  // Get current component
  let currentComp = wf.components[step - 1];

  // Get paramters
  let params = {};
  params.finalStatus = workflows_utils.getParameter(currentComp, 6);
  params.numberOfIterations = workflows_utils.getParameter(currentComp, 35);
  params.scTestStatus = workflows_utils.getParameter(currentComp, 8);

  // Validate iterations is ain int
  if(params.numberOfIterations && (parseInt(params.numberOfIterations) <= 0 || isNaN(parseInt(params.numberOfIterations)))) {
    console.log("Incorrect parameter value: number of iterations: " + params.numberOfIterations);
    return;
  }

  // Status to check:
  let checkStatusId = await workflows_utils.getStatusIdByName(params.scTestStatus);

  // iteration null to  0
  let currentIteration = hc_sc_pair.wfIterationCount;
    if(currentIteration == null) {
      currentIteration = 0;
  }

  let done = false;

  // max iterations where reach
  if(currentIteration >= params.numberOfIterations) done = true;

  let currentStatusId = hc_sc_pair.statusId;

  if(currentStatusId == checkStatusId) done =  true;

  if(verbose) {
    console.log("Done:");
    console.log(done);
    console.log("currentIteration:");
    console.log(currentIteration);
    console.log("currentStatusId:");
    console.log(currentStatusId);
    console.log("checkStatusId:");
    console.log(checkStatusId);
  }

  // if 'done == true' then iterations were completed or status was correct
  if(done) {
    // If check status was correct
    if(verbose)
      console.log("Done");
    if(currentStatusId == checkStatusId) {
      // If it is final state then reset for next wf type
      if(verbose)
        console.log("Check status match current status");
      if(params.finalStatus == 'True') {
        console.log("Finalize parameter is true");

        // Finish  this WF (Turn  the step to 100
        // to make sure no more component of this WF will be executed)
        await workflows_utils.incrementStep(hc_sc_pair, 100, wf);

        // Reset iteration to 1
        await workflows_mssql.setWfIteration(hc_sc_pair, 1, function(err) {
          if (err) {
            console.log(err);
          }
        });

        return;
      }
      else {
        // increment step
        if(verbose)
          console.log("Finalize parameter is false, status match, then increment step");
        await workflows_utils.incrementStep(hc_sc_pair, step, wf);
      }
    }
    else {
        // Done because of max iterations where reached then increment step
        if(verbose)
          console.log("Finalize parameter is false, iterations reached, then increment step");
        await workflows_utils.incrementStep(hc_sc_pair, step, wf);
    }
  }
  else {
    // Not done, then increment iteration (this should happen every 24 hours in production)
    if(verbose)
      console.log("Not done, then increment iteration to:" + (hc_sc_pair.wfIterationCount + 1));

    // Check if 24 hs time elapsed
    let lastIterationTime = hc_sc_pair.wfIterationTimeStamp;
    var hours = Math.abs(new Date() - lastIterationTime) / 36e5;
    if(verbose)
        console.log("Amount of hours elapsed since the last iteration:" + hours);
    if(hours >= 24) {
      await workflows_utils.incrementIteration(hc_sc_pair);
    }
  }
}

exports.wfChangeStateTask = async function(hc_sc_pair, step, wf) {
  if(verbose) {
    console.log("wfChangeStateTask:");
    console.log(hc_sc_pair);
    console.log(step);
    console.log(wf.components[step - 1]);
  }

  // Get current component
  let currentComp = wf.components[step - 1];

  // Get paramters
  let finalStatus = workflows_utils.getParameter(currentComp, 36);

  await workflows_mssql.setWfSCStatusByName(hc_sc_pair, finalStatus, function(err) {
    if (err) {
      let error = error_helper.getSqlErrorData(err);
      console.log(err);
      callback(err);
    }
  });

  // increment step
  await workflows_utils.incrementStep(hc_sc_pair, step, wf);
}

exports.wfCheckPaymentTask = async function(hc_sc_pair, step, wf) {
  if(verbose) {
    console.log("wfCheckPaymentTask:");
    console.log(hc_sc_pair);
    console.log(step);
    console.log(wf.components[step - 1]);
  }

  // Get current component
  let currentComp = wf.components[step - 1];

  let mustPay = false;
  // Get if the HC has a fee
  await workflows_mssql.getHCFeeByHC_SC_Pair(hc_sc_pair, function(err, resultMustPay) {
    if (err) {
      let error = error_helper.getSqlErrorData(err);
      console.log(err);
      callback(err);
    }

    if(resultMustPay == 1)
      mustPay = true;
  });

  // If HC has a fee then set the mustPay flag
  if(mustPay == true) {
    await workflows_utils.setMustPayFlag(hc_sc_pair, 1);
  }

  // Continue WF
  // increment step
  await workflows_utils.incrementStep(hc_sc_pair, step, wf);
}

exports.runProcess = async function(hc_sc_pair, step, wf) {
  let currentComp = wf.components[step - 1];
  const processName = workflows_utils.getParameter(currentComp, 37);

  if (verbose) {
    console.log('PROCESS > ', processName);
  }

  switch (processName) {
    case 'Add Covid Form':
      await workflows_mssql.addCovid19FormToSubcontractor(hc_sc_pair, async function(err) {
        if (err) {
          console.log('PROCESS ERROR > ', err);
          return;
        }

        await workflows_utils.incrementStep(hc_sc_pair, step, wf);
      });
      break;

    default:
      break;
  }
}
