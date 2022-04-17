//SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.9;

// Packages
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "base64-sol/base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

// Interfaces
import "./interfaces/ISWNFT.sol";
import "./interfaces/ISWETH.sol";
import "./interfaces/IStrategy.sol";

// Libraries
import { Helpers } from "./helpers.sol";
import { NFTDescriptor } from "./libraries/NFTDescriptor.sol";

interface IDepositContract {
    /// @notice Submit a Phase 0 DepositData object.
    /// @param pubKey A BLS12-381 public key.
    /// @param withdrawalCredentials Commitment to a public key for withdrawals.
    /// @param signature A BLS12-381 signature.
    /// @param depositDataRoot The SHA-256 hash of the SSZ-encoded DepositData object.
    /// Used as a protection against malformed input.
    function deposit(
        bytes calldata pubKey,
        bytes calldata withdrawalCredentials,
        bytes calldata signature,
        bytes32 depositDataRoot
    ) external payable;
}

/// @title Contract for SWNFTUpgrade
contract SWNFTUpgrade is
    ERC721EnumerableUpgradeable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ISWNFT
{
    uint256 public GWEI;
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using Helpers for *;
    using Strings for uint256;

    CountersUpgradeable.Counter public tokenIds;

    address public swETHAddress;
    string public swETHSymbol;
    address public swDAOAddress;
    uint public ETHER;
    address feePool;
    uint fee;
    address public botAddress;

    IDepositContract public depositContract;

    bytes[] public validators;
    mapping(bytes => uint256) public validatorDeposits;
    mapping(bytes => bool) public whiteList;
    mapping(bytes => bool) public isValidatorActive;

    /// @dev The token ID position data
    mapping(uint256 => Position) public positions;

    address[] public strategies;

    /// @notice initialise the contract to issue the token
    /// @param _swDAOAddress The address of the swDAO contract
    function initialize(address _swDAOAddress)
        virtual
        external
        initializer
    {
        require(_swDAOAddress != address(0), "swDAOAddress cannot be 0");
        __ERC721_init("Swell NFT", "swNFT");
        __Ownable_init();
        ETHER = 1e18;
        depositContract = IDepositContract(
        0x00000000219ab540356cBB839Cbe05303d7705Fa);
        swDAOAddress = _swDAOAddress;
        swETHSymbol = "swETH";
        fee = 1e17; // default 10 %
        feePool = msg.sender;
    }

    // ============ External mutative with permission functions ============

    /// @notice set base token address
    /// @param _swETHAddress The address of the base token
    function setswETHAddress(address _swETHAddress) onlyOwner external {
        require(_swETHAddress != address(0), "Address cannot be 0");
        swETHAddress = _swETHAddress;
        emit LogSetSWETHAddress(swETHAddress);
    }

    /// @notice set fee pool address
    /// @param _feePool The address of the fee pool
    function setFeePool(address _feePool) onlyOwner external {
        require(_feePool != address(0), "Address cannot be 0");
        feePool = _feePool;
        emit LogSetFeePool(feePool);
    }

    /// @notice Add a new strategy
    /// @param strategy The strategy address to add
    function addStrategy(address strategy) onlyOwner external{
        require(strategy != address(0), "address cannot be 0");
        strategies.push(strategy);
        emit LogAddStrategy(strategy);
    }

    /// @notice Remove a strategy
    /// @param strategy The strategy index to remove
    function removeStrategy(uint strategy) onlyOwner external{
        uint length = strategies.length;
        require(strategy < length, "Index out of range");
        require(strategies[strategy] != address(0), "strategy does not exist");
        //TODO: Need to check balance before removing
        require(length >= 1, "no strategy to remove");
        address last = strategies[length-1];
        emit LogRemoveStrategy(strategy, strategies[strategy]);
        strategies[strategy] = last;
        strategies.pop();
    }

    /// @notice Add a new validator into whiteList
    /// @param pubKey The public key of the validator
    function addWhiteList(bytes calldata pubKey) onlyOwner external{
        whiteList[pubKey] = true;
        emit LogAddWhiteList(msg.sender, pubKey);
    }

    // @notice Update the cronjob bot address
    /// @param _address The address of the cronjob bot
    function updateBotAddress(address _address) onlyOwner external{
        require(_address != address(0), "address cannot be 0");
        botAddress = _address;
        emit LogUpdateBotAddress(_address);
    }

    // @notice Update the validator active status
    /// @param pubKey The public key of the validator
    function updateIsValidatorActive(bytes calldata pubKey) external{
        require(msg.sender == botAddress, "sender is not the bot");
        isValidatorActive[pubKey] = !isValidatorActive[pubKey];
        emit LogUpdateIsValidatorActive(msg.sender, pubKey, isValidatorActive[pubKey]);
    }

    /// @notice Renonce ownership is not allowed
    function renounceOwnership() view public override onlyOwner {
        revert("Cannot renonce ownership");
    }

    // ============ Public mutative without permission functions ============

    /// @notice Deposit swETH into position
    /// @param tokenId The token ID
    /// @param amount The amount of swETH to deposit
    /// @return success Whether the deposit was successful
    function deposit(uint tokenId, uint amount) public returns (bool success) {
        require(_exists(tokenId), "Query for nonexistent token");
        require(amount > 0, "Amount must be greater than 0");
        require(ownerOf(tokenId) == msg.sender, "Only owner can deposit");
        positions[tokenId].baseTokenBalance += amount;
        emit LogDeposit(tokenId, msg.sender, amount);
        success = ISWETH(swETHAddress).transferFrom(msg.sender, address(this), amount);
    }

    /// @notice Withdraw swETH from position
    /// @param tokenId The token ID
    /// @param amount The amount of swETH to withdraw
    /// @return success Whether the withdraw was successful
    function withdraw(uint tokenId, uint amount) public returns (bool success) {
        require(_exists(tokenId), "Query for nonexistent token");
        require(amount > 0, "Amount must be greater than 0");
        require(ownerOf(tokenId) == msg.sender, "Only owner can withdraw");
        uint baseTokenBalance = positions[tokenId].baseTokenBalance;
        require(amount <= baseTokenBalance, "cannot withdraw more than the position balance");
        positions[tokenId].baseTokenBalance -= amount;
        emit LogWithdraw(tokenId, msg.sender, amount);
        success = ISWETH(swETHAddress).transfer(msg.sender, amount);
    }

    /// @notice Enter strategy for a token
    /// @param tokenId The token ID
    /// @param strategy The strategy index to enter
    /// @param amount The amount of swETH to enter
    /// @return success Whether the strategy enter was successful
    function enterStrategy(uint tokenId, uint strategy, uint amount) public returns (bool success){
        require(_exists(tokenId), "Query for nonexistent token");
        require(strategy < strategies.length, "Index out of range");
        require(strategies[strategy] != address(0), "strategy does not exist");
        require(ownerOf(tokenId) == msg.sender, "Only owner can enter strategy");
        require(amount > 0, "cannot enter strategy with 0 amount");
        positions[tokenId].baseTokenBalance -= amount;
        emit LogEnterStrategy(
        tokenId,
        strategy,
        strategies[strategy],
        msg.sender,
        amount
        );
        ISWETH(swETHAddress).approve(strategies[strategy], amount);
        success = IStrategy(strategies[strategy]).enter(tokenId, amount);
    }

    /// @notice Exit strategy for a token
    /// @param tokenId The token ID
    /// @param strategy The strategy index to exit
    /// @param amount The amount of swETH to exit
    /// @return success Whether the strategy exit was successful
    function exitStrategy(uint tokenId, uint strategy, uint amount) public returns (bool success){
        require(_exists(tokenId), "Query for nonexistent token");
        require(strategy < strategies.length, "Index out of range");
        require(strategies[strategy] != address(0), "strategy does not exist");
        require(ownerOf(tokenId) == msg.sender, "Only owner can exit strategy");
        require(amount > 0, "cannot exit strategy with 0 amount");
        positions[tokenId].baseTokenBalance += amount;
        emit LogExitStrategy(
        tokenId,
        strategy,
        strategies[strategy],
        msg.sender,
        amount
        );
        success = IStrategy(strategies[strategy]).exit(tokenId, amount);
    }

    /// @notice Able to bactch action for multiple tokens
    /// @param actions The actions to perform
    function batchAction(Action[] calldata actions) external {
        for(uint i = 0; i < actions.length; i++){
            if(actions[i].action == uint(ActionChoices.Deposit)) {
                deposit(actions[i].tokenId, actions[i].amount);
            }
            if(actions[i].action == uint(ActionChoices.Withdraw)) {
                withdraw(actions[i].tokenId, actions[i].amount);
            }
            if(actions[i].action == uint(ActionChoices.EnterStrategy)) {
                enterStrategy(actions[i].tokenId, actions[i].strategy, actions[i].amount);
            }
            if(actions[i].action == uint(ActionChoices.ExitStrategy)) {
                exitStrategy(actions[i].tokenId, actions[i].strategy, actions[i].amount);
            }
        }
    }

    /// @notice batch stake for multiple validators
    /// @param stakes The stakes to perform
    /// @return ids The token IDs that were minted
    function stake(Stake[] calldata stakes) external payable returns (uint[] memory ids) {
        require(msg.value >= 1 ether, "Must send at least 1 ETH");
        require(msg.value % ETHER == 0, "stake value not multiple of Ether");
        ids = new uint[](stakes.length);
        uint totalAmount = msg.value;
        for(uint i = 0; i < stakes.length; i++){
            ids[i] = _stake(stakes[i].pubKey, stakes[i].signature, stakes[i].depositDataRoot, stakes[i].amount);
            totalAmount -= stakes[i].amount;
        }
        payable(msg.sender).transfer(totalAmount); // refund the extra ETH
    }

    function unstake() pure external {
        // require(_exists(tokenId), "Query for nonexistent token");
        // require(ownerOf(tokenId) == msg.sender, "Only owner can unstake");
        // require(positions[tokenId].baseTokenBalance == positions[tokenId].value, "not enough base token balance");
        revert("Need to wait till LP is available");
    }
    
    // ============ Public/External Getter functions ============

    /// @notice get length of validators
    /// @return length The length of the validators
    function validatorsLength() view external returns (uint length) {
        length = validators.length;
    }

    /// @notice get total staked value of all positions
    /// @return value The total Ether value has been staked
    function tvl() external view returns (uint value) {
        for(uint i = 0; i < validators.length; i++){
            value += validatorDeposits[validators[i]];
        }
    }

    /// @notice get token URI from token ID
    /// @param tokenId The token ID
    /// @return The URI of the token
    function tokenURI(uint tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Query for nonexistent token");
        Position memory position = positions[tokenId];
        return NFTDescriptor.constructTokenURI(NFTDescriptor.ConstructTokenURIParams({
            tokenId: tokenId,
            quoteTokenAddress: swETHAddress,
            baseTokenAddress: swETHAddress,
            quoteTokenSymbol: swETHSymbol,
            baseTokenSymbol: swETHSymbol,
            baseTokenBalance: position.baseTokenBalance,
            baseTokenDecimals: ETHER,
            pubKey: _pubKeyToString(position.pubKey),
            value: position.value
        }));
    }

    // https://github.com/rocket-pool/rocketpool/blob
    // /e9c26aaea0/contracts/contract/minipool/RocketMinipoolManager.sol#L196
    /// @notice Get the withdrawal credentials for the withdrawal contract
    /// @return The withdrawal credentials
    function getWithdrawalCredentials() public virtual view returns (bytes memory) {
        return abi.encodePacked(bytes1(0x01), bytes11(0x0), address(this));
    }

    /// @notice Get the length of the strategies
    /// @return length The length of the strategies
    function getStrategyLength() view external returns (uint length) {
        length = strategies.length;
    }

    // ============ Private functions ============

    /// @notice Deposit ETH into official contract
    /// @param pubKey The public key of the validatator
    /// @param signature The signature of the withdrawal
    /// @param depositDataRoot The root of the deposit data
    /// @param amount The amount of ETH to deposit
    /// @return newItemId The token ID of the new token
    function _stake(
        bytes calldata pubKey,
        bytes calldata signature,
        bytes32 depositDataRoot,
        uint amount
    ) private returns (uint256 newItemId) {
        require(isValidatorActive[pubKey], 'validator is not active');
        require(amount <= msg.value, "cannot stake more than sent");
        require(amount >= 1 ether, "Must send at least 1 ETH");
        require(amount % ETHER == 0, "stake value not multiple of Ether");
        require(
            validatorDeposits[pubKey] + amount <= 32 ether,
            "cannot stake more than 32 ETH"
        );
        if(!whiteList[pubKey] && validatorDeposits[pubKey] < 16 ether && msg.sender != owner()){
          require(amount >= 16 ether, "Must send at least 16 ETH");
          //TODO: Will add require for swDAO bond once there's price
        }
        
        bool operator;
        if(validatorDeposits[pubKey] == 0 && !whiteList[pubKey]) operator = true;

        depositContract.deposit{value: amount}(
            pubKey,
            getWithdrawalCredentials(),
            signature,
            depositDataRoot
        );

        if(validatorDeposits[pubKey] == 0) validators.push(pubKey);
        validatorDeposits[pubKey] += amount;

        tokenIds.increment();

        newItemId = tokenIds.current();

        positions[newItemId] = Position({
            pubKey: pubKey,
            value: amount,
            baseTokenBalance: operator ? 0 : amount,
            timeStamp: block.timestamp,
            operator: operator
        });

        emit LogStake(msg.sender, newItemId, pubKey, amount, block.timestamp);

        _safeMint(msg.sender, newItemId);
        if(!operator) ISWETH(swETHAddress).mint(amount);
    }

    /// @notice Convert public key from bytes to string output
    /// @param pubKey The public key
    /// @return The public key in string format
    function _pubKeyToString(bytes memory pubKey) private pure returns (string memory) {
        return string(abi.encodePacked(bytes32(pubKey).toHex(), (pubKey.bytesToBytes16(32)).toHex16()));
    }

    /// @notice authorize upgrade for UUPS
    /// @param _newAddress The address of the new contract
    function _authorizeUpgrade(address _newAddress) internal view override onlyOwner {}

    uint256[49] private __gap;
    // mapping(address => uint) public opRate;
}
