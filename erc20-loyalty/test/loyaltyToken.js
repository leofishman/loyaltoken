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

    describe('friendship', function () {

      it('add friend', async function () {

      });

    });


/*
      describe('approve', function () {
        describe('when the spender is not the zero address', function () {
          const spender = Bob;

          describe('when the sender has enough balance', function () {
            const amount = 100;

            it('emits an approval event', async function () {
              const { logs } = await contractToTest.approve(spender, amount, { from: Owner });

              assert.equal(logs.length, 1);
              assert.equal(logs[0].event, 'Approval');
              assert.equal(logs[0].args.Owner, Owner);
              assert.equal(logs[0].args.spender, spender);
              assert(logs[0].args.value.eq(amount));
            });

            describe('when there was no approved amount before', function () {
              it('approves the requested amount', async function () {
                await contractToTest.approve(spender, amount, { from: Owner });

                const allowance = await contractToTest.allowance(Owner, spender);
                assert.equal(allowance, amount);
              });
            });

            describe('when the spender had an approved amount', function () {
              beforeEach(async function () {
                await contractToTest.approve(spender, 1, { from: Owner });
              });

              it('approves the requested amount and replaces the previous one', async function () {
                await contractToTest.approve(spender, amount, { from: Owner });

                const allowance = await contractToTest.allowance(Owner, spender);
                assert.equal(allowance, amount);
              });
            });
          });

          describe('when the sender does not have enough balance', function () {
            const amount = 101;

            it('emits an approval event', async function () {
              const { logs } = await contractToTest.approve(spender, amount, { from: Owner });

              assert.equal(logs.length, 1);
              assert.equal(logs[0].event, 'Approval');
              assert.equal(logs[0].args.Owner, Owner);
              assert.equal(logs[0].args.spender, spender);
              assert(logs[0].args.value.eq(amount));
            });

            describe('when there was no approved amount before', function () {
              it('approves the requested amount', async function () {
                await contractToTest.approve(spender, amount, { from: Owner });

                const allowance = await contractToTest.allowance(Owner, spender);
                assert.equal(allowance, amount);
              });
            });

            describe('when the spender had an approved amount', function () {
              beforeEach(async function () {
                await contractToTest.approve(spender, 1, { from: Owner });
              });

              it('approves the requested amount and replaces the previous one', async function () {
                await contractToTest.approve(spender, amount, { from: Owner });

                const allowance = await contractToTest.allowance(Owner, spender);
                assert.equal(allowance, amount);
              });
            });
          });
        });

        describe('when the spender is the zero address', function () {
          const amount = 100;
          const spender = ZERO_ADDRESS;

          it('approves the requested amount', async function () {
            await contractToTest.approve(spender, amount, { from: Owner });

            const allowance = await contractToTest.allowance(Owner, spender);
            assert.equal(allowance, amount);
          });

          it('emits an approval event', async function () {
            const { logs } = await contractToTest.approve(spender, amount, { from: Owner });

            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'Approval');
            assert.equal(logs[0].args.Owner, Owner);
            assert.equal(logs[0].args.spender, spender);
            assert(logs[0].args.value.eq(amount));
          });
        });
      });
*/


/*
      describe('transfer from', function () {
        const spender = Bob;

        describe('when the recipient is not the zero address', function () {
          const to = Carol;

          describe('when the spender has enough approved balance', function () {
            beforeEach(async function () {
              await contractToTest.approve(spender, 100, { from: Owner });
            });

            describe('when the Owner has enough balance', function () {
              const amount = 100;

              it('transfers the requested amount', async function () {
                await contractToTest.transferFrom(Owner, to, amount, { from: spender });

                const senderBalance = await contractToTest.balanceOf(Owner);
                assert.equal(senderBalance, 0);

                const recipientBalance = await contractToTest.balanceOf(to);
                assert.equal(recipientBalance, amount);
              });

              it('decreases the spender allowance', async function () {
                await contractToTest.transferFrom(Owner, to, amount, { from: spender });

                const allowance = await contractToTest.allowance(Owner, spender);
                assert(allowance.eq(0));
              });

              it('emits a transfer event', async function () {
                const { logs } = await contractToTest.transferFrom(Owner, to, amount, { from: spender });

                assert.equal(logs.length, 1);
                assert.equal(logs[0].event, 'Transfer');
                assert.equal(logs[0].args.from, Owner);
                assert.equal(logs[0].args.to, to);
                assert(logs[0].args.value.eq(amount));
              });
            });

            describe('when the Owner does not have enough balance', function () {
              const amount = 101;

              it('reverts', async function () {
                await assertRevert(contractToTest.transferFrom(Owner, to, amount, { from: spender }));
              });
            });
          });

          describe('when the spender does not have enough approved balance', function () {
            beforeEach(async function () {
              await contractToTest.approve(spender, 99, { from: Owner });
            });

            describe('when the Owner has enough balance', function () {
              const amount = 100;

              it('reverts', async function () {
                await assertRevert(contractToTest.transferFrom(Owner, to, amount, { from: spender }));
              });
            });

            describe('when the Owner does not have enough balance', function () {
              const amount = 101;

              it('reverts', async function () {
                await assertRevert(contractToTest.transferFrom(Owner, to, amount, { from: spender }));
              });
            });
          });
        });

        describe('when the recipient is the zero address', function () {
          const amount = 100;
          const to = ZERO_ADDRESS;

          beforeEach(async function () {
            await contractToTest.approve(spender, amount, { from: Owner });
          });

          it('reverts', async function () {
            await assertRevert(contractToTest.transferFrom(Owner, to, amount, { from: spender }));
          });
        });
      });
*/
/*
      describe('decrease approval', function () {
        describe('when the spender is not the zero address', function () {
          const spender = recipient;

          describe('when the sender has enough balance', function () {
            const amount = 100;

            it('emits an approval event', async function () {
              const { logs } = await contractToTest.decreaseApproval(spender, amount, { from: Owner });

              assert.equal(logs.length, 1);
              assert.equal(logs[0].event, 'Approval');
              assert.equal(logs[0].args.Owner, Owner);
              assert.equal(logs[0].args.spender, spender);
              assert(logs[0].args.value.eq(0));
            });

            describe('when there was no approved amount before', function () {
              it('keeps the allowance to zero', async function () {
                await contractToTest.decreaseApproval(spender, amount, { from: Owner });

                const allowance = await contractToTest.allowance(Owner, spender);
                assert.equal(allowance, 0);
              });
            });

            describe('when the spender had an approved amount', function () {
              const approvedAmount = amount;

              beforeEach(async function () {
                await contractToTest.approve(spender, approvedAmount, { from: Owner });
              });

              it('decreases the spender allowance subtracting the requested amount', async function () {
                await contractToTest.decreaseApproval(spender, approvedAmount - 5, { from: Owner });

                const allowance = await contractToTest.allowance(Owner, spender);
                assert.equal(allowance, 5);
              });

              it('sets the allowance to zero when all allowance is removed', async function () {
                await contractToTest.decreaseApproval(spender, approvedAmount, { from: Owner });
                const allowance = await contractToTest.allowance(Owner, spender);
                assert.equal(allowance, 0);
              });

              it('sets the allowance to zero when more than the full allowance is removed', async function () {
                await contractToTest.decreaseApproval(spender, approvedAmount + 5, { from: Owner });
                const allowance = await contractToTest.allowance(Owner, spender);
                assert.equal(allowance, 0);
              });
            });
          });

          describe('when the sender does not have enough balance', function () {
            const amount = 101;

            it('emits an approval event', async function () {
              const { logs } = await contractToTest.decreaseApproval(spender, amount, { from: Owner });

              assert.equal(logs.length, 1);
              assert.equal(logs[0].event, 'Approval');
              assert.equal(logs[0].args.Owner, Owner);
              assert.equal(logs[0].args.spender, spender);
              assert(logs[0].args.value.eq(0));
            });

            describe('when there was no approved amount before', function () {
              it('keeps the allowance to zero', async function () {
                await contractToTest.decreaseApproval(spender, amount, { from: Owner });

                const allowance = await contractToTest.allowance(Owner, spender);
                assert.equal(allowance, 0);
              });
            });

            describe('when the spender had an approved amount', function () {
              beforeEach(async function () {
                await contractToTest.approve(spender, amount + 1, { from: Owner });
              });

              it('decreases the spender allowance subtracting the requested amount', async function () {
                await contractToTest.decreaseApproval(spender, amount, { from: Owner });

                const allowance = await contractToTest.allowance(Owner, spender);
                assert.equal(allowance, 1);
              });
            });
          });
        });

        describe('when the spender is the zero address', function () {
          const amount = 100;
          const spender = ZERO_ADDRESS;

          it('decreases the requested amount', async function () {
            await contractToTest.decreaseApproval(spender, amount, { from: Owner });

            const allowance = await contractToTest.allowance(Owner, spender);
            assert.equal(allowance, 0);
          });

          it('emits an approval event', async function () {
            const { logs } = await contractToTest.decreaseApproval(spender, amount, { from: Owner });

            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'Approval');
            assert.equal(logs[0].args.Owner, Owner);
            assert.equal(logs[0].args.spender, spender);
            assert(logs[0].args.value.eq(0));
          });
        });
      });

      describe('increase approval', function () {
        const amount = 100;

        describe('when the spender is not the zero address', function () {
          const spender = recipient;

          describe('when the sender has enough balance', function () {
            it('emits an approval event', async function () {
              const { logs } = await contractToTest.increaseApproval(spender, amount, { from: Owner });

              assert.equal(logs.length, 1);
              assert.equal(logs[0].event, 'Approval');
              assert.equal(logs[0].args.Owner, Owner);
              assert.equal(logs[0].args.spender, spender);
              assert(logs[0].args.value.eq(amount));
            });

            describe('when there was no approved amount before', function () {
              it('approves the requested amount', async function () {
                await contractToTest.increaseApproval(spender, amount, { from: Owner });

                const allowance = await contractToTest.allowance(Owner, spender);
                assert.equal(allowance, amount);
              });
            });

            describe('when the spender had an approved amount', function () {
              beforeEach(async function () {
                await contractToTest.approve(spender, 1, { from: Owner });
              });

              it('increases the spender allowance adding the requested amount', async function () {
                await contractToTest.increaseApproval(spender, amount, { from: Owner });

                const allowance = await contractToTest.allowance(Owner, spender);
                assert.equal(allowance, amount + 1);
              });
            });
          });

          describe('when the sender does not have enough balance', function () {
            const amount = 101;

            it('emits an approval event', async function () {
              const { logs } = await contractToTest.increaseApproval(spender, amount, { from: Owner });

              assert.equal(logs.length, 1);
              assert.equal(logs[0].event, 'Approval');
              assert.equal(logs[0].args.Owner, Owner);
              assert.equal(logs[0].args.spender, spender);
              assert(logs[0].args.value.eq(amount));
            });

            describe('when there was no approved amount before', function () {
              it('approves the requested amount', async function () {
                await contractToTest.increaseApproval(spender, amount, { from: Owner });

                const allowance = await contractToTest.allowance(Owner, spender);
                assert.equal(allowance, amount);
              });
            });

            describe('when the spender had an approved amount', function () {
              beforeEach(async function () {
                await contractToTest.approve(spender, 1, { from: Owner });
              });

              it('increases the spender allowance adding the requested amount', async function () {
                await contractToTest.increaseApproval(spender, amount, { from: Owner });

                const allowance = await contractToTest.allowance(Owner, spender);
                assert.equal(allowance, amount + 1);
              });
            });
          });
        });

        describe('when the spender is the zero address', function () {
          const spender = ZERO_ADDRESS;

          it('approves the requested amount', async function () {
            await contractToTest.increaseApproval(spender, amount, { from: Owner });

            const allowance = await contractToTest.allowance(Owner, spender);
            assert.equal(allowance, amount);
          });

          it('emits an approval event', async function () {
            const { logs } = await contractToTest.increaseApproval(spender, amount, { from: Owner });

            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'Approval');
            assert.equal(logs[0].args.Owner, Owner);
            assert.equal(logs[0].args.spender, spender);
            assert(logs[0].args.value.eq(amount));
          });
        });
      });
*/

  });

});
