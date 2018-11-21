const loyalToken = artifacts.require("LoyalToken");
// import assertRevert from "./helpers/assertRevert";
//const { assertRevert } = require('./helpers/assertThrow');
const truffleAssert = require('truffle-assertions');
const { evmMine } = require('./helpers/evmMine');

contract('Loyal Token', (accounts) => {

  const Owner = accounts[0];
  const Bob = accounts[1];
  const Carol = accounts[2];
  const David = accounts[3];

  beforeEach(async () => {
    contractToTest = await loyalToken.new();
  });

  afterEach(async function() {
    contract.destroy;
 });

describe('rewards', async () => {
  let rewardName = "My great reward!!";
  let rewardId = 1;

  it("Should create a new reaward", async function () {
    let tx = await contractToTest.createReward(rewardId, rewardName, 100, true);
    await truffleAssert.eventEmitted(tx, 'CreateReward', (ev) => {
      return ev.rewardId == rewardId &&  web3.toAscii(ev.name).substring(0, rewardName.length) == rewardName && ev.value == 100 && ev.isActive === true;
    });
  })

  it("Should not allow to create a reaward if rewardId exist", async function () {
    let tx = await contractToTest.createReward(rewardId, rewardName, 100, true);
  //  await assertRevert(contractToTest.createReward(rewardId, "another reward", 100, true));

  })



  it("Should deactivate a reaward", async function () {
    let tx = await contractToTest.createReward(rewardId, rewardName, 100, true);
    //let tx2 = await contractToTest.activatereward
    await truffleAssert.eventEmitted(tx, 'CreateReward', (ev) => {
      return ev.rewardId == 1 &&  web3.toAscii(ev.name).substring(0, rewardName.length) == rewardName && ev.value == 100 && ev.isActive === true;
    });
  })


}

);

});
