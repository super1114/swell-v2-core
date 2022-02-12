//SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.9;

// Packages
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
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

/// @title Contract for SWNFT
contract SWNFT is
    ERC721,
    Ownable,
    ISWNFT
{
    using Counters for Counters.Counter;
    using Helpers for *;

    Counters.Counter public tokenIds;

    address public eth1WithdrawalAddress;
    address public baseTokenAddress;
    uint256 public ETHER = 1e18;

    IDepositContract depositContract = IDepositContract(
        0x00000000219ab540356cBB839Cbe05303d7705Fa
    );

    bytes[] public validators;
    mapping(bytes => uint256) public validatorDeposits;

    /// @dev The token ID position data
    mapping(uint256 => Position) public positions;

    address[] public strategies;

    /// @notice initialise the contract to issue the token
    /// @param _eth1WithdrawalAddress address of the contract that will receive the ETH1 withdrawal
    constructor(address _eth1WithdrawalAddress) ERC721("Swell NFT", "swNFT") {
        eth1WithdrawalAddress = _eth1WithdrawalAddress;
    }

    // ============ Public Mutative with permission functions ============

    /// @notice set base token address
    /// @param _baseTokenAddress The address of the base token
    function setBaseTokenAddress(address _baseTokenAddress) external onlyOwner {
        require(_baseTokenAddress != address(0), "Address cannot be 0");
        baseTokenAddress = _baseTokenAddress;
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

    // ============ Public Mutative without permission functions ============

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
        // Check stake amount
        require(msg.value >= 1 ether, "Must send at least 1 ETH");
        require(msg.value % ETHER == 0, "stake value not multiple of Ether");
        require(
            validatorDeposits[pubKey] + msg.value <= 32 ether,
            "cannot stake more than 32 ETH"
        );

        depositContract.deposit{value: msg.value}(
            pubKey,
            _getWithdrawalCredentials(),
            signature,
            depositDataRoot
        );

        validators.push(pubKey);
        validatorDeposits[pubKey] += msg.value;

        tokenIds.increment();

        newItemId = tokenIds.current();

        _safeMint(msg.sender, newItemId);
        ISWETH(baseTokenAddress).mint(msg.value);

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
        success = ISWETH(baseTokenAddress).transferFrom(msg.sender, address(this), amount);
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
        success = ISWETH(baseTokenAddress).transfer(msg.sender, amount);
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
        ISWETH(baseTokenAddress).approve(strategies[strategy], amount);
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

    // ============ Public Getter functions ============

    /// @notice get token URI from token ID
    /// @param tokenId The token ID
    /// @return The URI of the token
    function tokenURI(uint tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Query for nonexistent token");
        return _constructTokenURI(positions[tokenId]);
    }

    // ============ Private functions ============

    // https://github.com/rocket-pool/rocketpool/blob
    // /e9c26aaea0/contracts/contract/minipool/RocketMinipoolManager.sol#L196
    /// @notice Get the withdrawal credentials for the withdrawal contract
    /// @return The withdrawal credentials
    function _getWithdrawalCredentials() private view returns (bytes memory) {
        return abi.encodePacked(bytes1(0x01), bytes11(0x0), eth1WithdrawalAddress);
    }

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

}
