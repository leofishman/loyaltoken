const LoyalToken = artifacts.require('./LoyalToken.sol');

module.exports = function(deployer) {

  deployer.deploy(LoyalToken, {gasPrice: 1100000});

};
