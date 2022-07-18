/*///////////////////////////////////////////////////////////////
                    CONSTANT ADDRESSES
    //////////////////////////////////////////////////////////////*/
const VAULT = "0xBA12222222228d8Ba445958a75a0704d566BF2C8"; // mainnet address
const WEIGHTED_POOL_FACTORY = "0x8E9aa87E45e92bad84D5F8DD1bff34Fb92637dE9"; // mainnet address
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const WEIGHTED_2_POOL_FACTORY = "0xA5bf2ddF098bb0Ef6d120C98217dD6B141c74EE0"; // mainnet address
const SWETH_ADDRESS = "0x30ebB58888E94095939e220CAb04C59Ea65ded2E";
const WETH_ADDRESS = "0x706A11AF5bb5C2a50aB9802503ddbfF69373D1bd";
const SWNFT_ADDRESS = "0x23e33FC2704Bb332C0410B006e8016E7B99CF70A";
const DEPOSIT_CONTRACT_ADDRESS = "0xff50ed3d0ec03aC01D4C79aAd74928BFF48a7b2b";
const NONFUNGIBLE_POSITION_MANAGER =
  "0xc36442b4a4522e871399cd717abdd847ab11fe88";
const UNISWAP_V3_FACTORY = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const UNISWAP_V3_SWAP_ROUTER = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";
const UNISWAP_V3_QUOTER = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";
const IZI_TOKEN_ADDRESS = "0x9ad37205d608B8b219e6a2573f922094CEc5c200"; // izumi token address
const IMPLEMENTATION_STORAGE_ADDRESS =
  "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

const GNOSIS_SAFE = {
  1: {
    gnosisApi: "https://safe-transaction.gnosis.io",
    protocolDaoAddress: "0x20fDF47509C5eFC0e1101e3CE443691781C17F90",
  },
  5: {
    gnosisApi: "https://safe-transaction.goerli.gnosis.io",
    protocolDaoAddress: "0x02b6147E288874BcB5fa6986f6eBD44C14F09582",
  },
};

module.exports = {
  VAULT,
  WEIGHTED_POOL_FACTORY,
  ZERO_ADDRESS,
  WEIGHTED_2_POOL_FACTORY,
  SWETH_ADDRESS,
  WETH_ADDRESS,
  SWNFT_ADDRESS,
  DEPOSIT_CONTRACT_ADDRESS,
  NONFUNGIBLE_POSITION_MANAGER,
  UNISWAP_V3_FACTORY,
  UNISWAP_V3_SWAP_ROUTER,
  UNISWAP_V3_QUOTER,
  IZI_TOKEN_ADDRESS,
  IMPLEMENTATION_STORAGE_ADDRESS,
  GNOSIS_SAFE,
};
