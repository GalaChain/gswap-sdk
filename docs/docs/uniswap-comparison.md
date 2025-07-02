---
sidebar_position: 3
---

# gSwap for Uniswap Users

A comprehensive guide for developers familiar with Uniswap who want to build on gSwap. This guide shows side-by-side comparisons of common operations on Uniswap and gSwap and explains key differences.

The Uniswap examples in this guide are just for comparison purposes and this guide should not be used as a reference for building on Uniswap. For Uniswap development, please refer to the [Uniswap documentation](https://docs.uniswap.org/).

## Key Differences Overview

### Number Representation

Numbers are handled differently on gSwap and Uniswap:

**Ethereum/Uniswap**: All amounts are integers representing the smallest unit (wei, atoms, etc.)

```javascript
// Uniswap: 1 USDC = 1,000,000 (6 decimals)
const amount = ethers.utils.parseUnits('1.0', 6); // "1000000"
```

**GalaChain/gSwap**: Amounts are decimal strings representing human-readable values

```typescript
// gSwap: 1 USDC = "1.0"
const amount = '1.0'; // Just use the decimal string directly
```

### Token Identification

**Uniswap**: Uses contract addresses

```javascript
const USDC = '0xA0b86a33E6441A8C1aDB9f2c1dcb55d0e8cF5A30';
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27ead9083C756Cc2';
```

**gSwap**: Uses token class keys

```typescript
const USDC = 'GUSDC|Unit|none|none';
const GALA = 'GALA|Unit|none|none';
```

### Environment

**Uniswap**: Runs on the Ethereum Virtual Machine (EVM), requiring access to an Ethereum node and contract ABIs (Application Binary Interfaces).  
**gSwap**: Runs on GalaChain, which uses open HTTP APIs with no need for contract ABIs.

## Side-by-Side Comparisons

### Getting Price Quotes

#### Uniswap V3 (with SDK)

```javascript
import { computePoolAddress, FeeAmount } from '@uniswap/v3-sdk';
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json' with { type: 'json' };
import Quoter from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json' with { type: 'json' };
import uniswapCore from '@uniswap/sdk-core';
import { JsonRpcProvider, Contract, formatUnits, parseUnits } from 'ethers';
const { ChainId, Token } = uniswapCore;

// Use your ETH provider URL
const ETH_PROVIDER_URL =
  process.env.ETH_PROVIDER_URL ?? 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID';
const WETH_AMOUNT_IN = '0.1';
const POOL_FACTORY_CONTRACT_ADDRESS = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
const QUOTER_CONTRACT_ADDRESS = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';

const WETH_TOKEN = new Token(
  ChainId.MAINNET,
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  18,
  'WETH',
  'Wrapped Ether',
);

const USDC_TOKEN = new Token(
  ChainId.MAINNET,
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  6,
  'USDC',
  'USD//C',
);

const ethProvider = new JsonRpcProvider(ETH_PROVIDER_URL);

const currentPoolAddress = computePoolAddress({
  factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
  tokenA: WETH_TOKEN,
  tokenB: USDC_TOKEN,
  fee: FeeAmount.MEDIUM,
});

const poolContract = new Contract(currentPoolAddress, IUniswapV3PoolABI.abi, ethProvider);

const [token0, token1, fee] = await Promise.all([
  poolContract.token0(),
  poolContract.token1(),
  poolContract.fee(),
]);

const quoterContract = new Contract(QUOTER_CONTRACT_ADDRESS, Quoter.abi, ethProvider);

const quotedAmountOut = await quoterContract.quoteExactInputSingle.staticCall(
  WETH_TOKEN.address,
  USDC_TOKEN.address,
  fee,
  parseUnits(WETH_AMOUNT_IN, WETH_TOKEN.decimals),
  0,
);

console.log(
  `Quote for ${WETH_AMOUNT_IN} WETH to USDC: ${formatUnits(quotedAmountOut, USDC_TOKEN.decimals)} USDC`,
);
```

#### gSwap

```typescript
import { GSwap, FEE_TIER } from '@gala-chain/dex-sdk';

const WETH_AMOUNT_IN = '0.1';

const gSwap = new GSwap();

// Get quote for exact input
const quote = await gSwap.quoteExactInput(
  'GWETH|Unit|none|none',
  'GUSDC|Unit|none|none',
  FEE_TIER.PERCENT_00_30, // 0.3% fee tier
  WETH_AMOUNT_IN, // 0.1 tokens as decimal string
);

console.log(`Quote for ${WETH_AMOUNT_IN} WETH to USDC: ${quote.outTokenAmount} USDC`);
```

### Executing Swaps

#### Uniswap V3

```javascript
import { ethers } from 'ethers';
import { CurrencyAmount, Token, TradeType, Percent } from '@uniswap/sdk-core';
import { Pool, Route, Trade, SwapRouter } from '@uniswap/v3-sdk';

const RPC_URL = 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY';
const WALLET_PRIVATE_KEY = '0xYOUR_PRIVATE_KEY';

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(WALLET_PRIVATE_KEY, provider);

const chainId = 1; // Ethereum mainnet
const WETH = new Token(
  chainId,
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  18,
  'WETH',
  'Wrapped Ether',
);

const USDC = new Token(
  chainId,
  '0xA0b86991c6218b36c1d19d4a2e9Eb0cE3606eB48',
  6,
  'USDC',
  'USD Coin',
);

const amountInWei = '1000000000000000000'; // 1 WETH

// Dummy pool numbers for the example
const fee = 3000; // 0.30 % fee tier
const sqrtPriceX96 = '5602277097478614198912276234240'; // made-up
const liquidity = '1517882343751509868544'; // made-up
const tickCurrent = 0; // made-up

const pool = new Pool(USDC, WETH, fee, sqrtPriceX96, liquidity, tickCurrent);

const route = new Route([pool], WETH, USDC);
const trade = Trade.fromRoute(
  route,
  CurrencyAmount.fromRawAmount(WETH, amountInWei),
  TradeType.EXACT_INPUT,
);

const slippageTolerance = new Percent(50, 10_000);

const { calldata, value } = SwapRouter.swapCallParameters(trade, {
  slippageTolerance,
  recipient: signer.address,
  deadline: Math.floor(Date.now() / 1000) + 60 * 10,
});

const swapRouterAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564';

const tx = await signer.sendTransaction({
  to: swapRouterAddress,
  data: calldata,
  value,
  gasLimit: 500_000,
});

console.log(`\n📨  Swap submitted: ${tx.hash}\n⏳  Waiting for confirmation…`);
const receipt = await tx.wait();
console.log(`✅  Confirmed in block ${receipt.blockNumber}`);
```

#### gSwap

```typescript
import { GSwap, FEE_TIER, PrivateKeySigner } from '@gala-chain/gswap-sdk';

const WALLET_ADDRESS = 'eth|123...abc'; // Your wallet address
const signer = new PrivateKeySigner('your-private-key-here');
const gSwap = new GSwap({ signer });

const USDC_TOKEN = 'GUSDC|Unit|none|none';
const WETH_TOKEN = 'GWETH|Unit|none|none';

const result = await gSwap.swap(
  WALLET_ADDRESS,
  WETH_TOKEN, // Token to sell
  USDC_TOKEN, // Token to buy
  FEE_TIER.PERCENT_00_30, // 0.3% fee tier
  {
    exactIn: '1', // Sell exactly 1 WETH
    amountOutMinimum: '3000', // Accept a minimum of 3000 USDC in return (slippage protection)
  },
);
```

### Creating a New Liquidity Position

#### Uniswap V3

```javascript
import { ethers } from 'ethers';
import { CurrencyAmount, Token, Percent } from '@uniswap/sdk-core';
import { Pool, Position, nearestUsableTick, NonfungiblePositionManager } from '@uniswap/v3-sdk';

const RPC_URL = 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY';
const WALLET_PRIVATE_KEY = '0xYOUR_PRIVATE_KEY';

const chainId = 1; // Ethereum main-net
const WETH = new Token(
  chainId,
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  18,
  'WETH',
  'Wrapped Ether',
);
const USDC = new Token(
  chainId,
  '0xA0b86991c6218b36c1d19d4a2e9Eb0cE3606eB48',
  6,
  'USDC',
  'USD Coin',
);

const amountUSDC = '3300000000'; // 3 300 USDC   (6 decimals)
const amountWETH = '1000000000000000000'; // 1 WETH       (18 decimals)

// Dummy data for example purposes
const fee = 3000; // 0.30 %
const sqrtPriceX96 = '5602277097478614198912276234240';
const liquidity = '1517882343751509868544';
const tickCurrent = 0;

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(WALLET_PRIVATE_KEY, provider);

const pool = new Pool(USDC, WETH, fee, sqrtPriceX96, liquidity, tickCurrent);

const tickSpacing = pool.tickSpacing; // 60 for 0.3 % pools
const baseTick = nearestUsableTick(tickCurrent, tickSpacing);
const tickLower = baseTick - tickSpacing * 2;
const tickUpper = baseTick + tickSpacing * 2;

const position = Position.fromAmounts({
  pool,
  tickLower,
  tickUpper,
  amount0: CurrencyAmount.fromRawAmount(USDC, amountUSDC), // token0 = USDC
  amount1: CurrencyAmount.fromRawAmount(WETH, amountWETH), // token1 = WETH
  useFullPrecision: true,
});

const { calldata, value } = NonfungiblePositionManager.addCallParameters(position, {
  recipient: signer.address,
  deadline: Math.floor(Date.now() / 1000) + 60 * 10, // 10-min TTL
  slippageTolerance: new Percent(50, 10_000), // 0.50 %
});

const nfpmAddress = '0xC36442b4a4522E871399CD717aBDD847Ab11FE88';
const ERC20_ABI = ['function approve(address,uint256) external returns (bool)'];

for (const [token, amount] of [
  [USDC, amountUSDC],
  [WETH, amountWETH],
]) {
  const erc20 = new ethers.Contract(token.address, ERC20_ABI, signer);
  const tx = await erc20.approve(nfpmAddress, amount);
  console.log(`Allowance tx for ${token.symbol}: ${tx.hash}`);
  await tx.wait();
}

const mintTx = await signer.sendTransaction({
  to: nfpmAddress,
  data: calldata,
  value,
  gasLimit: 700_000,
});

console.log(`\n🖼️  Mint submitted: ${mintTx.hash}\n⏳  Waiting…`);
const receipt = await mintTx.wait();
console.log(`✅  Position NFT minted in block ${receipt.blockNumber}`);
```

#### gSwap

```typescript
import { GSwap, FEE_TIER } from '@gala-chain/dex-sdk';

const gSwap = new GSwap({ signer });

const result = await gSwap.positions.addLiquidityByTicks({
  walletAddress: 'eth|123...abc',
  positionId: '', // Empty string for new positions
  token0: 'GUSDC|Unit|none|none',
  token1: 'GWETH|Unit|none|none',
  fee: FEE_TIER.PERCENT_00_30, // 0.3% fee tier
  tickLower: -6000, // Lower price boundary
  tickUpper: 6000, // Upper price boundary
  amount0Desired: '3300',
  amount1Desired: '1',
  amount0Min: '3135', // 5% slippage protection
  amount1Min: '0.95', // 5% slippage protection
});

console.log('Position submitted:', result.transactionId);
```

### Getting Positions

#### Uniswap V3

```javascript
import { ethers } from 'ethers';

const RPC_URL = 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY';
const WALLET_PRIVATE_KEY = '0xYOUR_PRIVATE_KEY';
const NFPM_ADDRESS = '0xC36442b4a4522E871399CD717aBDD847Ab11FE88'; // Non-fungible Position Manager

const NFPM_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner,uint256 index) view returns (uint256)',
  `function positions(uint256 tokenId) view returns (
      uint96 nonce,
      address operator,
      address token0,
      address token1,
      uint24  fee,
      int24   tickLower,
      int24   tickUpper,
      uint128 liquidity,
      uint256 feeGrowthInside0LastX128,
      uint256 feeGrowthInside1LastX128,
      uint128 tokensOwed0,
      uint128 tokensOwed1
  )`,
];

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(WALLET_PRIVATE_KEY, provider);
const nfpm = new ethers.Contract(NFPM_ADDRESS, NFPM_ABI, provider);

const balance = (await nfpm.balanceOf(signer.address)).toNumber();

const positions = [];

for (let i = 0; i < balance; i++) {
  const tokenId = await nfpm.tokenOfOwnerByIndex(signer.address, i);
  const pos = await nfpm.positions(tokenId);
  positions.push({ tokenId, ...pos });
}

console.log('Positions:', positions);
```

#### gSwap

```typescript
import { GSwap } from '@gala-chain/dex-sdk';

const gSwap = new GSwap();

const positions = await gSwap.getUserPositions('eth|123...abc');

console.log(positions);
```
