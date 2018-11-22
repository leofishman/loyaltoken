const loyalToken = artifacts.require("LoyalToken");

const truffleAssert = require('truffle-assertions');
const { evmMine } = require('./helpers/evmMine');

let revert = require('./helpers/assertRevert');

contract('Loyal Token', (accounts) => {

  const Owner = accounts[0];
  const Bob = accounts[1];
  const Carol = accounts[2];
  const David = accounts[3];

  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  beforeEach(async () => {
    contractToTest = await loyalToken.new();
  });

  afterEach(async function() {
    contractToTest.destroy;
  });

describe('rewards', async () => {
  let rewardName = "My great reward!!";
  let rewardId = 1;

  it("Should create a new reaward", async function () {
    let tx = await contractToTest.createReward(rewardId, rewardName, 100, true);
    await truffleAssert.eventEmitted(tx, 'CreateReward', (ev) => {
      return ev.rewardId == rewardId &&  web3.toAscii(ev.name).substring(0, rewardName.length) == rewardName && ev.value == 100 && ev.isActive === true;
    });
  });

  it("Should not allow to create a reaward if rewardId exist", async function () {
    let tx = await contractToTest.createReward(rewardId, rewardName, 100, true);
    revert (contractToTest.createReward(rewardId, "another reward", 100, true));

  });



  it("Should deactivate a reaward", async function () {
    let tx = await contractToTest.createReward(rewardId, rewardName, 100, true);
    //let tx2 = await contractToTest.activatereward
    await truffleAssert.eventEmitted(tx, 'CreateReward', (ev) => {
      return ev.rewardId == 1 &&  web3.toAscii(ev.name).substring(0, rewardName.length) == rewardName && ev.value == 100 && ev.isActive === true;
    });
  });

});

describe('total supply', function () {
    it('returns the total amount of tokens', async function () {
      const totalSupply = await contractToTest.totalSupply();

      assert.equal(totalSupply, 1000000);
    });
});

describe('balanceOf', function () {
    describe('when the requested account has no tokens', function () {
      it('returns zero', async function () {
        const balance = await contractToTest.balanceOf(Bob);

        assert.equal(balance, 0);
      });
    });

    describe('when the requested account has some tokens', function () {
      it('returns the total amount of tokens', async function () {
        const balance = await contractToTest.balanceOf(Owner);

        assert.equal(balance, 1000000);
      });
    });

    describe('transfer', function () {
      describe('when the recipient is not the zero address', function () {
        const to = Bob;

        describe('when the sender does not have enough balance', function () {
          const amount = 101;

          it('reverts', async function () {
            revert (contractToTest.transfer(Carol, amount, { from: Bob }));
          });
        });

        describe('when the sender has enough balance', function () {
          const amount = 100;

          it('transfers the requested amount', async function () {
            const totalSupply = await contractToTest.totalSupply();
            await contractToTest.transfer(to, amount, { from: Owner });

            const senderBalance = await contractToTest.balanceOf(Owner);
            assert.equal(senderBalance, totalSupply - amount);

            const recipientBalance = await contractToTest.balanceOf(to);
            assert.equal(recipientBalance, amount);
          });

          it('emits a transfer event', async function () {
            const { logs } = await contractToTest.transfer(to, amount, { from: Owner });
            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'Transfer');
            assert.equal(logs[0].args.from, Owner);
            assert.equal(logs[0].args.to, to);
            assert(logs[0].args.value.eq(amount));
          });
        });


      });

      describe('when the recipient is the zero address', function () {
        const to = ZERO_ADDRESS;

        it('reverts', async function () {
          revert (contractToTest.transfer(to, 100, { from: Owner }));
        });
      });
    });




  });

});
