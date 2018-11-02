const loyalToken = artifacts.require("loyalToken");

const { assertRevert } = require('./helpers/assertThrow');
const { evmMine } = require('./helpers/evmMine');

contract('Loyal Token', (accounts) => {

  const Owner = accounts[0];
  const Bob = accounts[1];
  const Carol = accounts[2];
  const David = accounts[3];

  beforeEach(async () => {
    contractToTest = await loyalToken.new();


  });

});
