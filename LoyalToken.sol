pragma solidity ^0.4.24;


/**
 * @title SafeMath
 * @dev Math operations with safety checks that throw on error
 */
library SafeMath {

  /**
  * @dev Multiplies two numbers, throws on overflow.
  */
  function mul(uint256 a, uint256 b) internal pure returns (uint256 c) {
    if (a == 0) {
      return 0;
    }
    c = a * b;
    assert(c / a == b);
    return c;
  }

  /**
  * @dev Integer division of two numbers, truncating the quotient.
  */
  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    // assert(b > 0); // Solidity automatically throws when dividing by 0
    // uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold
    return a / b;
  }

  /**
  * @dev Subtracts two numbers, throws on overflow (i.e. if subtrahend is greater than minuend).
  */
  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    assert(b <= a);
    return a - b;
  }

  /**
  * @dev Adds two numbers, throws on overflow.
  */
  function add(uint256 a, uint256 b) internal pure returns (uint256 c) {
    c = a + b;
    assert(c >= a);
    return c;
  }
}

contract LoyalToken {
  using SafeMath for uint256;

//rewards are composed by an index, name and token value for reedemption
  struct rewards {
    uint256 rewardId;
    bytes32 name;
    uint256 value;
    bool isActive;
  }

  struct loyalFriend {
    uint256 timestamp;
    address friendAddress;
  }

  uint256 _totalSupply;
  uint256 userId;
  address owner;
  uint256 constant friendAddressLockingTime = 15780; // 6 months

  // each user can have 2 address that can transfer his points and can change those adddress after six months
  mapping(address => uint8) quantityFriends; //how many friends and address already have
  mapping(address => loyalFriend[2]) loyalFriends; // friend for and address
  mapping(address => uint256) private balances;
  mapping(uint256 => reward) public rewards;


  event Transfer(address indexed from, address indexed to, uint256 value);
  event NewUser(uint256 indexed userId, uint8 friendsQuantity);
  event TransferToFriend(address user, address _friend, uint256 points);
  event RemoveFriend(address user, address friend);
  event CreateReward(uint256 rewardId, bytes32 name, uint256 value, bool isActive);
  event ActiveReward(uint256 rewardId, bool isActive);
  event UpdateReward(uint256 rewardId, uint256 value);

  constructor() public {
      owner = msg.sender;
      symbol = "LOY";
      name = "My loyalty program with friends";
      decimals = 18;
      _totalSupply = 1000000 * 10**uint(decimals);
      balances[owner] = _totalSupply;
      userId = 0;
      userId = newUser(msg.address);
      emit Transfer(address(0), owner, _totalSupply);
}

  modifier onlyOwner() {
    require( owner == msg.sender, 'Its only available for the program creator');
    _;
  }

  modifier canAddFriend() {
    requie(quantityFriends[msg.sender] < 2, 'friends limit reached');
    _;
  }

  function totalSupply() public view returns (uint256) {
    return _totalSupply;
  }

  function transfer(address _to, uint256 _value) public returns (bool) {
    require(_to != address(0));
    require(_value <= balances[msg.sender].balance);

    balances[msg.sender] = balances[msg.sender].sub(_value);
    balances[_to] = balances[_to].add(_value);
    emit Transfer(msg.sender, _to, _value);
    return true;
  }

  function transferFrom(address from, address to, uint tokens) onlyOwner public returns (bool success) {
          balances[from] = balances[from].sub(tokens);
          balances[to] = balances[to].add(tokens);
          emit Transfer(from, to, tokens);
          return true;
      }


  function balanceOf(address _user) public view returns (uint256) {
    return balances[_user];
    }

  function newUser(address _loyalUser) public return (uint256) {
    require(loyalUsers[msg.sender].userId == 0, 'User already in the program');

    User memory newUser = User({
        userId: userId.add(1),
        friendsQuantity: 0
        });
      loyalUsers[_loyalUser] = newUser;
      emit NewUser(loyalUser[_loyalUser].userId, loyalUser[_loyalUser].friendsQuantity);
      return userId;
    }


  function addFriend(address _friend) canAddFriend() public {
    //require newfriend is user
    //qFriend.add(1)
    loyalFriend memroy newFriend = loyalFriend({
      timestamp: now,
      friendAddress: _friend
      });
    quantityFriends[msg.sender] = quantityFriends[msg.sender].add(1);
    loyalfriends[msg.sender][quantityFriends[msg.sender]] = newFriend;
    //loyalUser
  }

  function isFriend(address _user, address _friend) public return (uint8) {
    require(quantityFriends[_user] > 0, "User has no friends");
      for (uint8 i = 0; i < loyalFriends[_user].length; i++) {
        if (loyalFriends[_user][i].friendAddress == _friend) {
          return i;
        }
      }
  }

  function removeFriend(address _friend) public returns (bool) {
    // require friend added longer than grace period
    if (loyalFriends[msg.sender][1] == _friend) {
      require(loyalFriends[msg.sender][1].timestamp < now.sub(friendAddressLockingTime));
      loyalFriends[msg.sender][1] = loyalFriends[msg.sender][2];
      } else {
        require(loyalFriends[msg.sender][2].timestamp < now.sub(friendAddressLockingTime));
      }

    require(loyalFriends[msg.sender][isFriend(msg.sender, _friend)].timestamp < now.sub(friendAddressLockingTime));
    delete loyalFriends[msg.sender][isFriend(msg.sender, _friend)];
    quantityFriends[msg.sender] = quantityFriends[msg.sender].sub(1);
    emit RemoveFriend(msg.sender, _friend);
    return true;
  }


  function trasnferToFriend(address _friend, uint256 _points) public {
    require(balances[msg.sender] >= _points, 'Not enough points to transfer');
    require(isFriend(msg.sender, _friend), 'The address is not allowed to get points from you');
    transfer(_friend, _points);

  }

  function createReward(uint256 _rewardId, bytes32 _name, uint256 _value, bool _isActive) {
    require(rewards[_rewardId].rewardId == 0, 'Reward already exsit');
    reward memory newReward = reward({
      rewardId: _rewardId,
      name: _name,
      value: _value,
      isActive: _isActive
      });
    rewards[_rewardId] = newReward;
    emit createReward(_rewardId, _name, _value, _isActive);
  }

  // enable or disable reward
  function activeReward(uint256 _rewardId, bool _status) public onlyOwner {
    require(rewards[_rewardId].rewardId > 0, 'The rewards is not created');
    rewards[_rewardId].isActive = isActive;
    emit ActiveReward(_rewardId, _status);
  }

  // Since blockchain is unmutable, should we allow to change things once created?
  // we only let change the value
  function updateReward(uint256 _rewardId, uint256 _value) public onlyOwner {
    require(rewards[_rewardId].rewardId > 0, 'The rewards is not created');
    rewards[_rewardId].value = _value;
    emit UpdateReward(_rewardId, _value);
  }


  function redeemReward(address _loyalUser, _rewardId) public {
    //requie balance
    //require valid reward and active
  }

}
