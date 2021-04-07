const axios = require('axios').default;
const config = require('./config.json');
let excel = require('excel4node');

async function get_epoch() {
    try {
        let response = await axios.get("http://api.idena.io/api/Epoch/Last");
        return response.data.result.epoch - 1
    } catch (error) {
        console.log(error);
        return 0
    }
}
async function check_validation_results(address, epoch) {
    try {

        let response = await axios.get(`http://api.idena.io/api/Epoch/${epoch}/Identity/${address}`);
        if (response.data.result) {
            return response.data.result
        } else {
            return null
        }

    } catch (error) {
        return null
    }
}
async function check_validation_rewards(address, epoch) {
    try {
        let response = await axios.get(`http://api.idena.io/api/Epoch/${epoch}/Identity/${address}/Rewards`);
        if (response.data.result) {
            let balance = 0,
                stake = 0;
            response.data.result.forEach(reward => {
                balance += parseFloat(reward.balance);
                stake += parseFloat(reward.stake);
            });

            return {
                "balance": balance,
                "stake": stake
            }

        } else {
            return {
                "balance": 0,
                "stake": 0
            }
        }
    } catch (error) {
        console.log(error);
        return {
            "balance": 0,
            "stake": 0
        }
    }
}

async function check_balance(address) {
    try {
        let response = await axios.get(`http://api.idena.io/api/Address/${address}`);
        if (response.data.result) {
            return response.data.result
        } else {
            return null
        }

    } catch (error) {
        return null
    }
}






async function createExcel() {
    var workbook = new excel.Workbook();
    var worksheet = workbook.addWorksheet('Sheet 1');
    let epoch = await get_epoch();
    worksheet.cell(1, 1).string("Validation url");
    worksheet.cell(1, 2).string("Balance");
    worksheet.cell(1, 3).string("Stake");
    worksheet.cell(1, 4).string("Total");
    worksheet.cell(1, 5).string("Result");
    worksheet.cell(1, 6).string("Short");
    worksheet.cell(1, 7).string("Long");
    worksheet.cell(1, 8).string("Total");
    worksheet.cell(1, 9).string("State");
    worksheet.cell(1, 10).string("BalanceAccount");
    worksheet.cell(1, 11).string("StakeAccount");

    config.delegators_pubaddress.forEach(async (pubaddress, identity_index) => {
        setTimeout(async function () {
            console.log(`Checking : ${pubaddress} - ${identity_index + 1} out of ${config.delegators_pubaddress.length}`);
            let identity_result = await check_validation_results(pubaddress, epoch);
            let identity_validatin_rewards = await check_validation_rewards(pubaddress, epoch);
            let identity_balance = await check_balance(pubaddress);
            if (identity_result) {
                let cellIndex = identity_index + 2;
                worksheet.cell(cellIndex, 1).string(`http://api.idena.io/api/Epoch/${epoch}/Identity/${pubaddress}`);
                worksheet.cell(cellIndex, 2).string(parseFloat(identity_validatin_rewards.balance).toFixed(2));
                worksheet.cell(cellIndex, 3).string(parseFloat(identity_validatin_rewards.stake).toFixed(2));
                worksheet.cell(cellIndex, 4).string(parseFloat(identity_result.totalValidationReward).toFixed(2));
                worksheet.cell(cellIndex, 10).string(parseFloat(identity_balance.balance).toFixed(2));
                worksheet.cell(cellIndex, 11).string(parseFloat(identity_balance.stake).toFixed(2));

                if (identity_result.approved && !identity_result.missed) {
                    worksheet.cell(cellIndex, 5).string("Successful Validation");
                    worksheet.cell(cellIndex, 6).string((parseFloat(identity_result.shortAnswers.point / identity_result.shortAnswers.flipsCount) * 100).toFixed(2) + '%' + `(${identity_result.shortAnswers.point}/${identity_result.shortAnswers.flipsCount})`);
                    worksheet.cell(cellIndex, 7).string((parseFloat(identity_result.longAnswers.point / identity_result.longAnswers.flipsCount) * 100).toFixed(2) + '%' + `(${identity_result.longAnswers.point}/${identity_result.longAnswers.flipsCount})`);
                } else {
                    worksheet.cell(cellIndex, 5).string("Missed Validation");
                }
                worksheet.cell(cellIndex, 8).string((parseFloat(identity_result.totalShortAnswers.point / identity_result.totalShortAnswers.flipsCount) * 100).toFixed(2) + '%' + `(${identity_result.totalShortAnswers.point}/${identity_result.totalShortAnswers.flipsCount})`);
                worksheet.cell(cellIndex, 9).string(identity_result.state);
            } else {
                let cellIndex = identity_index + 2;
                worksheet.cell(cellIndex, 1).string(`http://api.idena.io/api/Epoch/${epoch}/Identity/${pubaddress}`);
                worksheet.cell(cellIndex, 5).string("Not a valid identity");

            }

            workbook.write('excel2.xlsx');

        }, 500 * identity_index);
    });


}
createExcel();