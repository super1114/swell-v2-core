//SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import 'base64-sol/base64.sol';

import "./interfaces/ISWNFT.sol";
import "./interfaces/ISWETH.sol";

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
    ERC721URIStorage,
    Ownable,
    ISWNFT
{
    using Counters for Counters.Counter;
    using Helpers for *;

    Counters.Counter public tokenIds;

    address public eth1WithdrawalAddress;
    address public baseTokenAddress;
    uint256 public ETHER = 1e18;

    bytes[] public validators;
    mapping(bytes => uint256) public validatorDeposits;

    IDepositContract depositContract = IDepositContract(
        0x00000000219ab540356cBB839Cbe05303d7705Fa
    );

    /// @dev The token ID position data
    mapping(uint256 => Position) public positions;

    /// @notice initialise the contract to issue the token
    /// @param _eth1WithdrawalAddress address of the contract that will receive the ETH1 withdrawal
    constructor(address _eth1WithdrawalAddress) ERC721("Swell NFT", "swNFT") {
        eth1WithdrawalAddress = _eth1WithdrawalAddress;
    }

    // ============ Mutative functions ============

    /// @notice Deposit ETH into official contract
    /// @param pubKey The public key of the validatator
    /// @param signature The signature of the withdrawal
    /// @param depositDataRoot The root of the deposit data
    /// @return newItemId The token ID of the new token
    function deposit(
        bytes calldata pubKey,
        bytes calldata signature,
        bytes32 depositDataRoot
    ) external payable returns (uint256 newItemId) {
        // Check deposit amount
        require(msg.value >= 1 ether, "Must send at least 1 ETH");
        require(msg.value % ETHER == 0, "deposit value not multiple of Ether");
        require(
            validatorDeposits[pubKey] + msg.value <= 32 ether,
            "cannot deposit more than 32 ETH"
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

        emit LogDeposit(msg.sender, newItemId, pubKey, msg.value);
    }

    /// @notice set base token address
    /// @param _baseTokenAddress The address of the base token
    function setBaseTokenAddress(address _baseTokenAddress) external onlyOwner {
        require(_baseTokenAddress != address(0), "Address cannot be 0");
        baseTokenAddress = _baseTokenAddress;
    }

    /// @notice get token URI from token ID
    /// @param tokenId The token ID
    /// @return The URI of the token
    function tokenURI(uint tokenId) public view override returns (string memory) {
        require(_exists(tokenId));
        return _constructTokenURI(positions[tokenId]);
    }

    // ============ Private functions ============

    // https://github.com/rocket-pool/rocketpool/blob
    // /e9c26aaea0/contracts/contract/minipool/RocketMinipoolManager.sol#L196
    /// @notice Get the withdrawal credentials for the withdrawal contract
    /// @return The withdrawal credentials
    function _getWithdrawalCredentials() internal view returns (bytes memory) {
        return abi.encodePacked(bytes1(0x01), bytes11(0x0), eth1WithdrawalAddress);
    }

    /// @notice Convert public key from bytes to string output
    /// @param pubKey The public key
    /// @return The public key in string format
    function _pubKeyToString(bytes memory pubKey) internal pure returns (string memory) {
        return string(abi.encodePacked(bytes32(pubKey).toHex(), (pubKey.bytesToBytes16(32)).toHex16()));
    }

    function _constructTokenURI(Position memory params) internal view returns (string memory) {
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
    function _generateName(bytes memory pubKey, uint value) internal view returns (bytes memory) {
        return abi.encodePacked(
            "SwellNetwork Validator",
            " - ",
            _pubKeyToString(pubKey),
            " - ",
            (value / ETHER).uint2str(),
            " Ether"
        );
    }

    function _generateDescription() internal pure returns (bytes memory) {
        return abi.encodePacked(
                'This NFT represents a position in a SwellNetwork Validator. ',
                'The owner of this NFT can modify or redeem position. ',
                '\\n\\n',
                unicode'⚠️ DISCLAIMER: Due diligence is imperative when assessing this NFT. ',
                'Make sure token addresses match the expected tokens, as token symbols may be imitated.'
            );
    }

}
