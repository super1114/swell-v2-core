/*///////////////////////////////////////////////////////////////
                    CONSTANT ADDRESSES
    //////////////////////////////////////////////////////////////*/
const VAULT = "0xBA12222222228d8Ba445958a75a0704d566BF2C8"; // mainnet address
const WEIGHTED_POOL_FACTORY = "0x8E9aa87E45e92bad84D5F8DD1bff34Fb92637dE9"; // mainnet address
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const WEIGHTED_2_POOL_FACTORY = "0xA5bf2ddF098bb0Ef6d120C98217dD6B141c74EE0"; // mainnet address
const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const NONFUNGIBLE_POSITION_MANAGER =
  "0xc36442b4a4522e871399cd717abdd847ab11fe88";
const UNISWAP_V3_FACTORY = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const UNISWAP_V3_SWAP_ROUTER = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";
const UNISWAP_V3_QUOTER = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";
const IZI_TOKEN_ADDRESS = "0x9ad37205d608B8b219e6a2573f922094CEc5c200"; // izumi token address

const GNOSIS_SAFE = {
  5: {
    gnosisApi: "https://safe-transaction.goerli.gnosis.io",
    protocolDaoAddress: "0xA6FF5B3CF991721E02981Aac174e54878d2eE616",
  },
};

module.exports = {
  VAULT,
  WEIGHTED_POOL_FACTORY,
  ZERO_ADDRESS,
  WEIGHTED_2_POOL_FACTORY,
  WETH_ADDRESS,
  NONFUNGIBLE_POSITION_MANAGER,
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_SWAP_ROUTER,
  UNISWAP_V3_QUOTER,
  IZI_TOKEN_ADDRESS,
  GNOSIS_SAFE,
};
