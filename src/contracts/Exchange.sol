// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.8.0;

import "./Token.sol";

//TODO
//[X] Set the fee account
//[X] Deposit Ether
//[X] Withdrawal Ether
//[X] Deposit Dyrio
//[X] Withdrawal Dyrio
//[X] Check balances
//[X] Make order
//[X] Cancel order
//[X] Fill order
//[X] Charge Fees

contract Exchange {
  using SafeMath for uint;

  //Variables
  address public feeAccount; //the account that receives exchange fees
  uint256 public feePercent; //the fee percentage
  address constant ETHER = address(0); //store Ether in tokens mapping with blank address
  mapping(address => mapping(address => uint256)) public tokens;
  mapping(uint256 => _Order) public orders;
  uint256 public orderCount;
  mapping(uint256 => bool) public orderCancelled;
  mapping(uint256 => bool) public orderFilled;

  //Events
  event Deposit(address token, address user, uint256 amount, uint256 balance);
  event Withdraw(address token, address user, uint256 amount, uint256 balance);
  event Order(
    uint256 id, 
    address user, 
    address tokenGet, 
    uint256 amountGet, 
    address tokenGive,
    uint256 amountGive,
    uint256 timestamp
  );

  event Cancel(
    uint256 id, 
    address user, 
    address tokenGet, 
    uint256 amountGet, 
    address tokenGive,
    uint256 amountGive,
    uint256 timestamp
  );

    event Trade(
    uint256 id, 
    address user, 
    address tokenGet, 
    uint256 amountGet, 
    address tokenGive,
    uint256 amountGive,
    address userFill,
    uint256 timestamp
  );

  //Structs
  struct _Order {
    uint256 id;
    address user;
    address tokenGet;
    uint256 amountGet;
    address tokenGive;
    uint256 amountGive;
    uint256 timestamp;
  }
  
  //A way to model the order, store the order and add the order and receive it from storage.
  
  constructor (address _feeAccount, uint256 _feePercent) public {
    feeAccount = _feeAccount;
    feePercent = _feePercent;
  }
  
  //Fallback: reverts if Ether is sent to this smart contract by mistake
  function() external {
    revert();
  }

  //Deposit & Withdrawal Funds
  function depositEther() payable public {
    tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
    emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
  }

  function withdrawEther(uint _amount) public {
    require(tokens[ETHER][msg.sender] >= _amount);
    tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].sub(_amount);
    msg.sender.transfer(_amount);
    emit Withdraw(ETHER, msg.sender, _amount, tokens[ETHER][msg.sender]);

  }

  function depositToken(address _token, uint _amount) public {
    //TODO: Don't allow ether deposits
    require(_token != ETHER);
    //Send tokens to this contract
    require(Token(_token).transferFrom(msg.sender, address(this), _amount));
    //Manage deposit - update balance
    tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);
    //Emit event
    emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
  }

  function withdrawToken(address _token, uint256 _amount) public {
    require(_token != ETHER);
    require(tokens[_token][msg.sender] >= _amount);
    tokens[_token][msg.sender] = tokens[_token][msg.sender].sub(_amount);
    require(Token(_token).transfer(msg.sender, _amount));
    emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
  }

  function balanceOf(address _token, address _user) public view returns (uint256) {
    return tokens[_token][_user];
  }

  //Manage Orders - Make or Cancel
  function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) public {
    orderCount = orderCount.add(1);
    orders[orderCount] = _Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, now);
    emit Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, now);
  }

  function cancelOrder(uint256 _id) public {
    _Order storage _order = orders[_id]; //Must be a valid order
    require(address(_order.user) == msg.sender); //Must be "my" order
    require(_order.id == _id); //The order must exist
    orderCancelled[_id] = true;
    emit Cancel(_order.id, msg.sender, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive, now);
  }

  //Handle Trades - Charge Fees
  function fillOrder(uint256 _id) public {
    require(_id > 0 && _id <= orderCount);
    require(!orderFilled[_id]);
    require(!orderCancelled[_id]);
    _Order storage _order = orders[_id]; //Fetch the order
    _trade(_order.id, _order.user, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive);
    orderFilled[_order.id] = true;
    //Mark order as filled
  }

  function _trade(uint256 _orderId, address _user, address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) internal {
    //Charge fees, fees paid by the user that fills the order, the msg.sender, and deducted from _amountGet
    uint256 _feeAmount = _amountGive.mul(feePercent).div(100);
    
    //Execute trade
    tokens[_tokenGet][msg.sender] = tokens[_tokenGet][msg.sender].sub(_amountGet.add(_feeAmount));
    tokens[_tokenGet][_user] = tokens[_tokenGet][_user].add(_amountGet);

    tokens[_tokenGet][feeAccount] = tokens[_tokenGet][feeAccount].add(_feeAmount);

    tokens[_tokenGive][_user] = tokens[_tokenGive][_user].sub(_amountGive);
    tokens[_tokenGive][msg.sender] = tokens[_tokenGive][msg.sender].add(_amountGive);
    
    //Emit trade event
    emit Trade(_orderId, _user, _tokenGet, _amountGet, _tokenGive, _amountGive, msg.sender, now);
  }
}


