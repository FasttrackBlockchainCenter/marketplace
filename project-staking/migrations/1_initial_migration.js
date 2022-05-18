var fs = require('fs');

var Staking = artifacts.require("../contracts/Staking.sol");

module.exports = async function(deployer) {
  try {
    await deployer.deploy(Staking, {
      gas: 4000000
    });
    let stakingInstance = await Staking.deployed();
  } catch (error) {
    console.log(error);
  }
};
