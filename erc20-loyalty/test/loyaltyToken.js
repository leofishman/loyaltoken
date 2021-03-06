const loyalToken = artifacts.require("LoyalToken");

const truffleAssert = require('truffle-assertions');
const { evmMine } = require('./helpers/evmMine');

var truffleTestHelpers = require("./helpers/truffle-test-helpers");

let revert = require('./helpers/assertRevert');

contract('Loyal Token', (accounts) => {

  const Owner = accounts[0];
  const Bob = accounts[1];
  const Carol = accounts[2];
  const David = accounts[3];
  const Eric = accounts[4];

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

  it("Should create a new reward", async function () {
    let tx = await contractToTest.createReward(rewardId, rewardName, 100, true);
    await truffleAssert.eventEmitted(tx, 'CreateReward', (ev) => {
      return ev.rewardId == rewardId &&  web3.toAscii(ev.name).substring(0, rewardName.length) == rewardName && ev.value == 100 && ev.isActive === true;
    });
  });

  it("Should not allow to create a reward if rewardId exist", async function () {
    let tx = await contractToTest.createReward(rewardId, rewardName, 100, true);
    revert (contractToTest.createReward(rewardId, "another reward", 100, true));

  });

  it("Should deactivate a reward", async function () {
    let tx = await contractToTest.createReward(rewardId, rewardName, 100, true);
    let tx2 = await contractToTest.activeReward(rewardId, false);
    const rewardStatus = await contractToTest.isRewardActive(rewardId);
    assert.equal(rewardStatus, false);

    await truffleAssert.eventEmitted(tx2, 'ActiveReward', (ev) => {
      return ev.rewardId == rewardId &&  ev.isActive === false;
    });
  });

  it("Should reactivate a reward", async function () {
    let tx = await contractToTest.createReward(rewardId, rewardName, 100, true);
    let tx2 = await contractToTest.activeReward(rewardId, false);

    await truffleAssert.eventEmitted(tx2, 'ActiveReward', (ev) => {
      return ev.rewardId == rewardId &&  ev.isActive === false;
    });

    let tx3 = await contractToTest.activeReward(rewardId, true);
    const rewardStatus = await contractToTest.isRewardActive(rewardId);
    assert.equal(rewardStatus, true);

    await truffleAssert.eventEmitted(tx3, 'ActiveReward', (ev) => {
      return ev.rewardId == rewardId &&  ev.isActive === true;
    });
  });

  it("Should update a reward", async function () {
    let tx = await contractToTest.createReward(rewardId, rewardName, 100, true);
    let tx2 = await contractToTest.updateReward(rewardId, 150);

    await truffleAssert.eventEmitted(tx2, 'UpdateReward', (ev) => {
      return ev.rewardId == rewardId &&  ev.value == 150;
    });
  });

  describe('Reward redeeming', async function () {
    let tx = await contractToTest.createReward(rewardId, rewardName, 100, true);
    it("when reward is active and have balance, should redeem a reward", async function (){
      let tx2 = await contractToTest.redeemReward(rewardId);
      const totalSupply = await contractToTest.totalSupply();
      const balance = await contractToTest.balanceOf(Owner);

      assert.equal(balance, 1000000 - 100);

      await truffleAssert.eventEmitted(tx2, 'RedeemReward', (ev) => {
        return ev.rewardId == rewardId &&  ev.sender == Owner && ev.totalSupply == totalSupply;
      });

    });
    it("when reward is active and dont have balance, should not redeem a reward", async function (){
      revert (contractToTest.redeemReward(rewardId, { from: Bob }));
      });
    it("when reward is not active and have balance, should not redeem a reward", async function (){
      let tx2 = await contractToTest.activeReward(rewardId, false);

      revert ( contractToTest.redeemReward(rewardId));

    });

  });


});

describe('total supply', function () {
    it('returns the total amount of tokens', async function () {
      const totalSupply = await contractToTest.totalSupply();

      assert.equal(totalSupply, 1000000);
    });
});

describe('friendship managment', async function () {
  it('should allow friend', async function () {
    let tx = await contractToTest.addFriend(Carol, { from: Bob});
    assert(await contractToTest.isFriend(Bob, Carol));
  });
  it('should allow a second friend', async function () {
    let tx = await contractToTest.addFriend(Carol, { from: Bob});
    let tx2 = await contractToTest.addFriend(David, { from: Bob});
    assert(await contractToTest.isFriend(Bob, David));
  });
  it('should not allow a third friend', async function () {
    let tx = await contractToTest.addFriend(Carol, { from: Bob});

    let tx2 = await contractToTest.addFriend(David, { from: Bob});
    revert ( contractToTest.addFriend(Eric, { from: Bob}));

  });
  it('Should not remove a friend if added less than six months ago', async function () {
    let tx = await contractToTest.addFriend(Carol, { from: Bob});

    assert.isFalse = (await contractToTest.removeFriend(Carol, { from: Bob}));
  });
  it('Should remove a friend only if added more thatn six months ago', async function () {
    let tx = await contractToTest.addFriend(Carol, { from: Bob});
    const advancement = 15781;
    const newBlock = await truffleTestHelpers.advanceTimeAndBlock(advancement);
    assert.isTrue = (await contractToTest.removeFriend(Carol, { from: Bob}));
  });

  it('Should remove the first friend only if added more thatn six months ago', async function () {
    let tx = await contractToTest.addFriend(Carol, { from: Bob});
    let tx2 = await contractToTest.addFriend(David, { from: Bob});
    const advancement = 15781;
    const newBlock = await truffleTestHelpers.advanceTimeAndBlock(advancement);
    let tx3 = await contractToTest.removeFriend(Carol, { from: Bob});
    let tx4 = await contractToTest.addFriend(Eric, { from: Bob});
    assert.isTrue = (await contractToTest.isFriend(Bob, David));
    assert.isTrue = (await contractToTest.isFriend(Bob, Eric));


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
      amount = 100;

      it('returns the total amount of tokens', async function () {
        tx = contractToTest.transfer(Bob, amount);
        const balance = await contractToTest.balanceOf(Bob);
        assert.equal(balance, amount);
      });
    });

    describe('transfer', function () {
      describe('when the recipient is not the zero address', function () {
        describe('when the sender does not have enough balance', function () {
          const amount = 101;

          it('reverts', async function () {
            revert (contractToTest.transfer(Carol, amount, { from: Bob }));
          });
        });

        describe('when the sender has enough balance', function () {
          const amount = 100;

          it('transfers the requested amount', async function () {
            await contractToTest.transfer(Bob, amount, { from: Owner });
            const balance = await contractToTest.balanceOf(Bob);
            assert.equal(balance, amount);
          });

          it('emits a transfer event', async function () {
            tx = await contractToTest.transfer(Bob, amount, { from: Owner });
            truffleAssert.eventEmitted(tx, 'Transfer', (ev) => {
                 return ev.from == Owner && ev.to == Bob && ev.value == amount;
             });
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



    describe('approve', function () {
      describe('when the user is not the zero address', function () {

        describe('when the sender has enough balance', function () {
          const amount = 100;

          it('emits an approval event', async function () {

            let tx = await contractToTest.addFriend(Carol, { from: Bob});
            let tx2 = await contractToTest.transfer(Bob, amount, { from: Owner });
            let tx3 = await contractToTest.approve(Carol, amount, {from: Bob});

            truffleAssert.eventEmitted(tx3, 'Approval', (ev) => {
                 return ev.user == Bob && ev.friend == Carol && ev.points == amount;
             });
          });

          describe('when there was no approved amount before', function () {
            it('approves the requested amount', async function () {
              let tx = await contractToTest.addFriend(Carol, { from: Bob});
              let tx2 = await contractToTest.transfer(Bob, amount, { from: Owner });
              let tx3 = await contractToTest.approve(Carol, amount, {from: Bob});

              const allowance = await contractToTest.allowance(Bob, Carol);

              assert.equal(allowance, amount);
            });
          });

          describe('when the user had an approved amount', function () {
            beforeEach(async function () {
              let tx = await contractToTest.addFriend(Carol, { from: Bob});
              let tx2 = await contractToTest.transfer(Bob, amount, { from: Owner });
              let tx3 = await contractToTest.approve(Carol, 1, {from: Bob});
            });

            it('approves the requested amount and replaces the previous one', async function () {
              await contractToTest.approve(Carol, amount, { from: Bob });

              const allowance = await contractToTest.allowance(Bob, Carol);
              assert.equal(allowance, amount);
            });
          });
        });

        describe('when the user does not have enough balance', function () {
          const amount = 100;

          it('revert', async function () {
            revert(contractToTest.approve(Carol, amount, { from: Bob }));
          });


          describe('when the friend had an approved amount', function () {
            it('approves the requested amount and replaces the previous one', async function () {
              let tx = await contractToTest.addFriend(Carol, { from: Bob});
              let tx2 = await contractToTest.transfer(Bob, amount, { from: Owner });
              let tx3 = await contractToTest.approve(Carol, amount, {from: Bob});

              await (contractToTest.approve(Carol, amount + 1, { from: Bob }));

              const allowance = await contractToTest.allowance(Bob, Carol);
              assert.equal(allowance, amount);
            });
          });
        });
      });
    });
  });

});
