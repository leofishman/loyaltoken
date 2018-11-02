const NFTActionHouse = artifacts.require('NFTActionHouse');
const SampleNFT = artifacts.require('SampleNFT');

module.exports = function(deployer) {

  deployer.deploy(NFTActionHouse).then(() => {
    return deployer.deploy(SampleNFT, 'Sample', 'SNFT').then(() => {
      console.log('Deployed !');
    });
  });

};
