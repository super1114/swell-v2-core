//SPDX-License-Identifier: BSL-1.1
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
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
    ERC721URIStorageUpgradeable,
    UUPSUpgradeable,
    OwnableUpgradeable
{
    uint256 public GWEI;
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using Helpers for *;

    CountersUpgradeable.Counter private _tokenIds;

    mapping(bytes => uint256) public validators;

    string public baseURI;

    /// @notice initialise the contract to issue the token
    /// @param name The name of the token
    /// @param symbol The symbol of the token
    function initialize(string memory name, string memory symbol)
        public
        initializer
    {
        __ERC721_init(name, symbol);
        GWEI = 1e9;
    }

    /// @notice Stake ETH into official contract
    /// @param pubKey The public key of the validatator
    /// @param withdrawalCredentials The withdrawal credentials of the validator
    /// @param signature The signature of the withdrawal
    /// @param depositDataRoot The root of the deposit data
    /// @param validatorIndex The index of the validator
    function stake(
        bytes calldata pubKey,
        bytes calldata withdrawalCredentials,
        bytes calldata signature,
        bytes32 depositDataRoot,
        string calldata validatorIndex
    ) external payable returns (uint256 newItemId) {
        IDepositContract depositContract = IDepositContract(
            0x00000000219ab540356cBB839Cbe05303d7705Fa
        );

        // Check deposit amount
        require(msg.value >= 1 ether, "Must send at least 1 ETH");
        require(msg.value % GWEI == 0, "deposit value not multiple of gwei");
        require(
            validators[pubKey] + msg.value <= 32 ether,
            "can not stake more than 32 ETH"
        );

        depositContract.deposit{value: msg.value}(
            pubKey,
            withdrawalCredentials,
            signature,
            depositDataRoot
        );

        validators[pubKey] += msg.value;

        _tokenIds.increment();

        newItemId = _tokenIds.current();
        _mint(msg.sender, newItemId);
        // "https://raw.githubusercontent.com/leckylao/Eth2S/main/metaData/
        // 0xa5e7f4a06080b860d376871ce0798aa7677e7a4b117a5bd0909f15fee02f28a62388496982c133fef1eba087d8a06005/
        // 1000000000000000000.json"
        _setTokenURI(
            newItemId,
            string(
                abi.encodePacked(
                    pubKeyToString(pubKey),
                    "/",
                    msg.value.uint2str(),
                    ".json"
                )
            )
        );

        emit LogStake(msg.sender, newItemId, validatorIndex, msg.value);
    }

    /// @notice authorize upgrade for UUPS
    /// @param _newAddress The address of the new contract
    function _authorizeUpgrade(address _newAddress) internal view override onlyOwner {}

    function pubKeyToString(bytes calldata pubKey) public pure returns (string memory) {
        return string(abi.encodePacked(bytes32(pubKey).toHex(), (pubKey.bytesToBytes16(32)).toHex16()));
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://raw.githubusercontent.com/leckylao/Eth2S/main/metaData/";
    }

    event LogStake(
        address user,
        uint256 itemId,
        string validatorIndex,
        uint256 deposit
    );

    uint256[50] private __gap;
}
