//SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.9;

// Packages
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "base64-sol/base64.sol";

// Interfaces
import "./interfaces/ISWNFT.sol";
import "./interfaces/ISWETH.sol";
import "./interfaces/IStrategy.sol";

// Libraries
import { Helpers } from "./helpers.sol";

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
    ERC721Upgradeable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ISWNFT
{
    uint256 public GWEI;
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using Helpers for *;

    CountersUpgradeable.Counter public tokenIds;

    address public swETHAddress;
    address public swDAOAddress;
    uint256 public ETHER;

    IDepositContract public depositContract;

    bytes[] public validators;
    mapping(bytes => uint256) public validatorDeposits;
    mapping(bytes => bool) public whiteList;

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
        __UUPSUpgradeable_init();
        __Ownable_init();
        ETHER = 1e18;
        depositContract = IDepositContract(
        0x00000000219ab540356cBB839Cbe05303d7705Fa);
        swDAOAddress = _swDAOAddress;
    }

    // ============ External mutative with permission functions ============

    /// @notice set base token address
    /// @param _swETHAddress The address of the base token
    function setswETHAddress(address _swETHAddress) onlyOwner external {
        require(_swETHAddress != address(0), "Address cannot be 0");
        swETHAddress = _swETHAddress;
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
        require(strategies[strategy] != address(0), "strategy does not exist");
        uint length = strategies.length;
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

    // ============ Public mutative without permission functions ============

    /// @notice Deposit ETH into official contract
    /// @param pubKey The public key of the validatator
    /// @param signature The signature of the withdrawal
    /// @param depositDataRoot The root of the deposit data
    /// @return newItemId The token ID of the new token
    function stake(
        bytes calldata pubKey,
        bytes calldata signature,
        bytes32 depositDataRoot
    ) external payable returns (uint256 newItemId) {
        require(msg.value >= 1 ether, "Must send at least 1 ETH");
        require(msg.value % ETHER == 0, "stake value not multiple of Ether");
        require(
            validatorDeposits[pubKey] + msg.value <= 32 ether,
            "cannot stake more than 32 ETH"
        );
        if(!whiteList[pubKey] && validatorDeposits[pubKey] < 16 ether && msg.sender != owner()){
          require(msg.value >= 16 ether, "Must send at least 16 ETH");
          // Will add require for swDAO bond once there's price
        }

        depositContract.deposit{value: msg.value}(
            pubKey,
            getWithdrawalCredentials(),
            signature,
            depositDataRoot
        );

        if(validatorDeposits[pubKey] == 0) validators.push(pubKey);
        validatorDeposits[pubKey] += msg.value;

        tokenIds.increment();

        newItemId = tokenIds.current();

        _safeMint(msg.sender, newItemId);
        ISWETH(swETHAddress).mint(msg.value);

        positions[newItemId] = Position(
            pubKey,
            msg.value,
            msg.value
        );

        emit LogStake(msg.sender, newItemId, pubKey, msg.value);
    }

    /// @notice Deposit swETH into position
    /// @param tokenId The token ID
    /// @param amount The amount of swETH to deposit
    /// @return success Whether the deposit was successful
    function deposit(uint tokenId, uint amount) public returns (bool success) {
        require(_exists(tokenId), "Query for nonexistent token");
        require(amount > 0, "Amount must be greater than 0");
        require(ownerOf(tokenId) == msg.sender, "Only owner can deposit");
        uint value = positions[tokenId].value;
        uint baseTokenBalance = positions[tokenId].baseTokenBalance;
        require(amount + baseTokenBalance <= value, "cannot deposit more than the position value");
        success = ISWETH(swETHAddress).transferFrom(msg.sender, address(this), amount);
        if(!success) return success;
        positions[tokenId].baseTokenBalance += amount;
        emit LogDeposit(tokenId, msg.sender, amount);
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
        require(amount <= baseTokenBalance, "cannot withdraw more than the position value");
        success = ISWETH(swETHAddress).transfer(msg.sender, amount);
        if(!success) return success;
        positions[tokenId].baseTokenBalance -= amount;
        emit LogWithdraw(tokenId, msg.sender, amount);
    }

    /// @notice Enter strategy for a token
    /// @param tokenId The token ID
    /// @param strategy The strategy index to enter
    /// @return success Whether the strategy enter was successful
    function enterStrategy(uint tokenId, uint strategy) public returns (bool success){
        require(_exists(tokenId), "Query for nonexistent token");
        require(strategies[strategy] != address(0), "strategy does not exist");
        require(ownerOf(tokenId) == msg.sender, "Only owner can enter strategy");
        uint amount = positions[tokenId].baseTokenBalance;
        require(amount > 0, "cannot enter strategy with no base token balance");
        ISWETH(swETHAddress).approve(strategies[strategy], amount);
        success = IStrategy(strategies[strategy]).enter(tokenId, amount);
        if(!success) return success;
        positions[tokenId].baseTokenBalance -= amount;
        emit LogEnterStrategy(
        tokenId,
        strategy,
        strategies[strategy],
        msg.sender,
        amount
        );
    }

    /// @notice Exit strategy for a token
    /// @param tokenId The token ID
    /// @param strategy The strategy index to enter
    /// @return amount The amount of swETH withdrawn
    function exitStrategy(uint tokenId, uint strategy) public returns (uint amount){
        require(_exists(tokenId), "Query for nonexistent token");
        require(strategies[strategy] != address(0), "strategy does not exist");
        require(ownerOf(tokenId) == msg.sender, "Only owner can exit strategy");
        amount = IStrategy(strategies[strategy]).exit(tokenId);
        positions[tokenId].baseTokenBalance += amount;
        emit LogExitStrategy(
        tokenId,
        strategy,
        strategies[strategy],
        msg.sender,
        amount
        );
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
                enterStrategy(actions[i].tokenId, actions[i].strategy);
            }
            if(actions[i].action == uint(ActionChoices.ExitStrategy)) {
                exitStrategy(actions[i].tokenId, actions[i].strategy);
            }
        }
    }

    /**
     * @dev Unstake Ether and burn according swNFT and swETH token
     *
     * Currently this is intentionally not supported since Ethereum 2.0 withdrawals specification
     * might change before withdrawals are enabled. This contract sits behind a proxy that can be
     * upgraded to a new implementation contract collectively by swDAO holders by performing a vote.
     *
     * When Ethereum 2.0 withdrawals specification is finalized, Swell DAO will prepare the new
     * implementation contract and initiate a vote among swDAO holders for upgrading the proxy to
     * the new implementation.
     */
    function unstake() pure external {
        revert("not supported");
    }

    // ============ Public Getter functions ============

    /// @notice get token URI from token ID
    /// @param tokenId The token ID
    /// @return The URI of the token
    function tokenURI(uint tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Query for nonexistent token");
        return _constructTokenURI(positions[tokenId]);
    }

    /// @notice get length of validators
    /// @return length The length of the validators
    function validatorsLength() view external returns (uint length) {
        length = validators.length;
    }

    // https://github.com/rocket-pool/rocketpool/blob
    // /e9c26aaea0/contracts/contract/minipool/RocketMinipoolManager.sol#L196
    /// @notice Get the withdrawal credentials for the withdrawal contract
    /// @return The withdrawal credentials
    function getWithdrawalCredentials() public virtual view returns (bytes memory) {
        return abi.encodePacked(bytes1(0x01), bytes11(0x0), address(this));
    }

    // ============ Private functions ============

    /// @notice Convert public key from bytes to string output
    /// @param pubKey The public key
    /// @return The public key in string format
    function _pubKeyToString(bytes memory pubKey) private pure returns (string memory) {
        return string(abi.encodePacked(bytes32(pubKey).toHex(), (pubKey.bytesToBytes16(32)).toHex16()));
    }

    /// @notice Constructing the token URI
    /// @param params The position params
    /// @return The token URI in string format
    function _constructTokenURI(Position memory params) private view returns (string memory) {
        bytes memory name = _generateName(params.pubKey, params.value);
        bytes memory description = _generateDescription();
        // string memory image = Base64.encode(bytes(generateSVGImage(params)));

        return
            string(
                abi.encodePacked(
                    'data:application/json;base64,',
                    Base64.encode(
                        abi.encodePacked(
                            '{"name":"',
                            name,
                            '", "description":"',
                            description,
                            '", "image": "',
                            'data:image/svg+xml;base64,',
                            // image,
                            '"}'
                        )
                    )
                )
            );
    }

    /// @notice Return name of the metadata
    /// @return The name of the metadata in bytes
    function _generateName(bytes memory pubKey, uint value) private view returns (bytes memory) {
        return abi.encodePacked(
            "SwellNetwork Validator",
            " - ",
            _pubKeyToString(pubKey),
            " - ",
            (value / ETHER).uint2str(),
            " Ether"
        );
    }

    /// @notice Return description of the metadata
    /// @return The description of the metadata in bytes
    function _generateDescription() private pure returns (bytes memory) {
        return abi.encodePacked(
                'This NFT represents a position in a SwellNetwork Validator. ',
                'The owner of this NFT can modify or redeem position. ',
                '\\n\\n',
                unicode'⚠️ DISCLAIMER: Due diligence is imperative when assessing this NFT. ',
                'Make sure token addresses match the expected tokens, as token symbols may be imitated.'
            );
    }

    /// @notice authorize upgrade for UUPS
    /// @param _newAddress The address of the new contract
    function _authorizeUpgrade(address _newAddress) internal view override onlyOwner {}

    uint256[50] private __gap;
}
