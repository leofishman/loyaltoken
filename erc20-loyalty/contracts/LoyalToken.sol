/**
 * Using and erc20 token for loyalty programs, erc20 give you standard functions and interfaces that can be called from other contracts
 * and programas such as wallets.
 * any change of friend to a minimum of 6 months.
 * this program has the particularity that let you choose up to 2 friends and allow to spend your tokens, we use an array to storage the addresses with a timestamp to restrict
 */

pragma solidity ^0.5;

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
/**
 * Using safemath for math operations protects our contract for maliciuos attacks such as overflood
 */

/**
 * Struct are like clases that you can instanciate in the contrate in order to storage structurated data
 */

//rewards are composed by an index, name and token value for reedemption and a status flag.
  struct reward {
    uint256 rewardId;
    bytes32 name;
    uint256 value;
    bool isActive;
  }

/*
// We need to have a relation between the users and his friends enroll date.
  struct loyalFriend {
    uint256 timestamp;
    address friendAddress;
  }
*/

  uint256 _totalSupply;
  address owner;
  uint256 constant friendAddressLockingTime = 15780; // 6 months

  // each user can have 2 address that can transfer his points and can change those adddress after six months
  mapping(address => uint256) quantityFriends; //how many friends and address already have
  //mapping(address => loyalFriend[3]) loyalFriends; // friend for and address
  mapping(address => mapping (address => uint256)) public loyalFriends; //we map user address with his friend address and store the timestamp
  mapping(address => uint256) private balances;
  mapping(uint256 => reward) public rewards;
  mapping (address => mapping (address => uint256)) internal allowed;


  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address user, address _friend, uint256 points);
  event RemoveFriend(address user, address friend);
  event CreateReward(uint256 indexed rewardId, bytes32 name, uint256 value, bool isActive);
  event ActiveReward(uint256 indexed rewardId, bool indexed isActive);
  event UpdateReward(uint256 indexed rewardId, uint256 value);
  event RedeemReward(uint256 indexed rewardId, address loyalUser, uint256 totalSupply);

  constructor() public {
      owner = msg.sender;
      uint256 decimals = 0;
      _totalSupply = 1000000 * 10**uint(decimals);
      balances[owner] = _totalSupply;
      emit Transfer(address(0), owner, _totalSupply);
}

  modifier onlyOwner() {
    require( owner == msg.sender, 'Its only available for the program creator');
    _;
  }

  modifier canAddFriend() {
    require(quantityFriends[msg.sender] < 2, 'friends limit reached');
    _;
  }

/**
 * Erc20 totalSupply() function
 */
  function totalSupply() public view returns (uint256) {
    return _totalSupply;
  }


  /**
  * @dev Transfer token for a specified address
  * @param _to The address to transfer to.
  * @param _value The amount to be transferred.
  */
  function transfer(address _to, uint256 _value) public returns (bool) {
    require(_value <= balances[msg.sender]);
    require(_to != address(0));

    balances[msg.sender] = balances[msg.sender].sub(_value);
    balances[_to] = balances[_to].add(_value);
    emit Transfer(msg.sender, _to, _value);
    return true;
  }

  /**
   * @dev Transfer tokens from one address to another
   * @param _from address The address which you want to send tokens from
   * @param _to address The address which you want to transfer to
   * @param _value uint256 the amount of tokens to be transferred
   */
  function transferFrom(
    address _from,
    address _to,
    uint256 _value
  )
    public
    returns (bool)
  {
    require(_value <= balances[_from]);
    require(_value <= allowed[_from][msg.sender]);
    require(_to != address(0));

    balances[_from] = balances[_from].sub(_value);
    balances[_to] = balances[_to].add(_value);
    allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
    emit Transfer(_from, _to, _value);
    return true;
  }


 /**
 * Erc20 balanceOf() function, returns the amount of tokens in the user account
 */
  function balanceOf(address _user) public view returns (uint256) {
    return balances[_user];
    }

  function getQuantityFriends(address _user) public view returns (uint256) {
    return quantityFriends[_user];
  }

  function addFriend(address _friend)  public {
    require(quantityFriends[msg.sender] < 2, 'friends limit reached');
    require(loyalFriends[msg.sender][_friend] == 0);
  /*  loyalFriend memory newFriend = loyalFriend({
      timestamp: now,
      friendAddress: _friend
      });
   */
    quantityFriends[msg.sender] = quantityFriends[msg.sender].add(1);
    loyalFriends[msg.sender][_friend] = now;
    allowance(msg.sender, _friend);
  }

  function isFriend(address _user, address _friend) view public returns (bool) {
    if (loyalFriends[_user][_friend] > 0) {
      return true;
    }  else {
      return false;
    }
  }

  function removeFriend(address _friend) public returns (bool) {
    // require friend added longer than grace period
    if (loyalFriends[_user][_friend] < now.sub(friendAddressLockingTime) && loyalFriends[_user][_friend] > 0) {
      loyalFriends[_user][_friend] = 0;
      quantityFriends[msg.sender] = quantityFriends[msg.sender].sub(1);
      emit RemoveFriend(msg.sender, _friend);
      return true;
    }  else {
      return false;
    }
  }



  /**
   * @dev Approve the passed address to spend the specified amount of tokens on behalf of msg.sender.
   * Beware that changing an allowance with this method brings the risk that someone may use both the old
   * and the new allowance by unfortunate transaction ordering. One possible solution to mitigate this
   * race condition is to first reduce the spender's allowance to 0 and set the desired value afterwards:
   * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
   * @param _friend The address which will spend the funds.
   * @param _value The amount of tokens to be spent.
   */
   function approve(
     address _friend,
     uint256 _value
     )
     public
     returns (bool)
     {
      require(isFriend(msg.sender, _friend) > 0, 'The address is not allowed to get points from you');
      allowed[msg.sender][_friend] = _value;
      emit Approval(msg.sender, _friend, _value);
      return true;
    }

  /**
   * @dev Function to check the amount of tokens that an owner allowed to a spender.
   * @param _owner address The address which owns the funds.
   * @param _friend address The address which will spend the funds.
   * @return A uint256 specifying the amount of tokens still available for the spender.
   */
  function allowance(
    address _owner,
    address _friend
   )
    public
      view
    returns (uint256)
  {
    return allowed[_owner][_friend];
  }

  /**
   * @dev Increase the amount of tokens that an owner allowed to a spender.
   * approve should be called when allowed[_friend] == 0. To increment
   * allowed value is better to use this function to avoid 2 calls (and wait until
   * the first transaction is mined)
   * From MonolithDAO Token.sol
   * @param _friend The address which will spend the funds.
   * @param _addedValue The amount of tokens to increase the allowance by.
   */
  function increaseApproval(
    address _friend,
    uint256 _addedValue
  )
    public
    returns (bool)
  {
    allowed[msg.sender][_friend] = (
      allowed[msg.sender][_friend].add(_addedValue));
      emit Approval(msg.sender, _friend, allowed[msg.sender][_friend]);
    return true;
  }

  /**
   * @dev Decrease the amount of tokens that an owner allowed to a spender.
   * approve should be called when allowed[_friend] == 0. To decrement
   * allowed value is better to use this function to avoid 2 calls (and wait until
   * the first transaction is mined)
   * From MonolithDAO Token.sol
   * @param _friend The address which will spend the funds.
   * @param _subtractedValue The amount of tokens to decrease the allowance by.
   */
  function decreaseApproval(
    address _friend,
    uint256 _subtractedValue
  )
    public
    returns (bool)
  {
    uint256 oldValue = allowed[msg.sender][_friend];
    if (_subtractedValue >= oldValue) {
      allowed[msg.sender][_friend] = 0;
    } else {
      allowed[msg.sender][_friend] = oldValue.sub(_subtractedValue);
    }
    emit Approval(msg.sender, _friend, allowed[msg.sender][_friend]);
    return true;
  }

  function createReward(uint256 _rewardId, bytes32 _name, uint256 _value, bool _isActive) public onlyOwner {
    require(rewards[_rewardId].rewardId == 0, 'Reward already exsit');
    reward memory newReward = reward({
      rewardId: _rewardId,
      name: _name,
      value: _value,
      isActive: _isActive
      });
    rewards[_rewardId] = newReward;
    emit CreateReward(_rewardId, _name, _value, _isActive);
  }

  // enable or disable reward
  function activeReward(uint256 _rewardId, bool _status) public onlyOwner {
    require(rewards[_rewardId].rewardId > 0, 'The rewards is not created');
    rewards[_rewardId].isActive = _status;
    emit ActiveReward(_rewardId, _status);
  }

  // Since blockchain is unmutable, should we allow to change things once created?
  // we only let change the value
  function updateReward(uint256 _rewardId, uint256 _value) public onlyOwner {
    require(rewards[_rewardId].rewardId > 0, 'The rewards is not created');
    rewards[_rewardId].value = _value;
    emit UpdateReward(_rewardId, _value);
  }


  function redeemReward(uint256 _rewardId) public {
    require(balances[msg.sender] >= rewards[_rewardId].value, 'Not enough points for this reward');
    require(rewards[_rewardId].isActive == true, 'Rewards not available');
    transferFrom(msg.sender, owner, rewards[_rewardId].value);
    emit RedeemReward(_rewardId, msg.sender, _totalSupply);
  }


    function isRewardActive(uint256 _rewardId) public view returns (bool) {
      return rewards[_rewardId].isActive ;
    }

}
