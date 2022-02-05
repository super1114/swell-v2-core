//SPDX-License-Identifier: BSL-1.1

pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
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
    ERC721URIStorage, Ownable
{
    using Counters for Counters.Counter;
    using Helpers for *;

    Counters.Counter public tokenIds;

    address public eth1WithdrawalAddress;
    uint256 public GWEI = 1e9;

    bytes[] public validators;
    mapping(bytes => uint256) public validatorDeposits;

    string public baseURI; 

    IDepositContract depositContract = IDepositContract(
        0x00000000219ab540356cBB839Cbe05303d7705Fa
    );

    /// @notice initialise the contract to issue the token
    /// @param _eth1WithdrawalAddress address of the contract that will receive the ETH1 withdrawal
    constructor(address _eth1WithdrawalAddress) ERC721("Swell NFT", "swNFT") {
        eth1WithdrawalAddress = _eth1WithdrawalAddress;
        baseURI = "https://raw.githubusercontent.com/leckylao/Eth2S/main/metaData/";
    }

    // ============ Mutative functions ============

    /// @notice Stake ETH into official contract
    /// @param pubKey The public key of the validatator
    /// @param signature The signature of the withdrawal
    /// @param depositDataRoot The root of the deposit data
    /// @return newItemId The token ID of the new token
    function stake(
        bytes calldata pubKey,
        bytes calldata signature,
        bytes32 depositDataRoot
    ) external payable returns (uint256 newItemId) {
        // Check deposit amount
        require(msg.value >= 1 ether, "Must send at least 1 ETH");
        require(msg.value % GWEI == 0, "deposit value not multiple of gwei");
        require(
            validatorDeposits[pubKey] + msg.value <= 32 ether,
            "can not stake more than 32 ETH"
        );

        depositContract.deposit{value: msg.value}(
            pubKey,
            getWithdrawalCredentials(),
            signature,
            depositDataRoot
        );

        validators.push(pubKey);
        validatorDeposits[pubKey] += msg.value;

        tokenIds.increment();

        newItemId = tokenIds.current();
        _safeMint(msg.sender, newItemId);
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

        emit LogStake(msg.sender, newItemId, pubKey, msg.value);
    }

    /// @notice Set the base URI of the token
    /// @param URI The base URI of the token
    function setBaseURI(string memory URI) external onlyOwner {
        baseURI = URI;
    }

    /// @notice Set the withdrawal address of the token
    /// @param _eth1WithdrawalAddress The withdrawal address of the token
    function setWithdrawalAddress(address _eth1WithdrawalAddress) external onlyOwner {
        eth1WithdrawalAddress = _eth1WithdrawalAddress;
    }

    // ============ Private functions ============

    // https://github.com/rocket-pool/rocketpool/blob
    // /e9c26aaea0/contracts/contract/minipool/RocketMinipoolManager.sol#L196
    /// @notice Get the withdrawal credentials for the withdrawal contract
    /// @return The withdrawal credentials
    function getWithdrawalCredentials() internal view returns (bytes memory) {
        return abi.encodePacked(bytes1(0x01), bytes11(0x0), eth1WithdrawalAddress);
    }

    /// @notice Convert public key from bytes to string output
    /// @param pubKey The public key
    /// @return The public key in string format
    function pubKeyToString(bytes calldata pubKey) internal pure returns (string memory) {
        return string(abi.encodePacked(bytes32(pubKey).toHex(), (pubKey.bytesToBytes16(32)).toHex16()));
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    // ============ Events ============

    event LogStake(
        address user,
        uint256 itemId,
        bytes pubKey,
        uint256 deposit
    );
}
