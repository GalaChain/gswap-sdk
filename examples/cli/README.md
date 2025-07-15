# gSwap CLI Tool

This is an example of using the gSwap SDK to build a command-line interface (CLI) for interacting with the gSwap decentralized exchange (DEX).

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set your private key in a `.env` file in this directory (replace `YOUR_PRIVATE_KEY_HERE` with your key in the command):

```bash
echo "GALACHAIN_PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE" > .env
```

## Usage

```bash
npm run cli -- <command> [arguments...]
```

## Commands

### Trading Commands

#### `quoteExactInput`

Get a quote for swapping a specific input amount.

**Syntax:**

```bash
npm run cli -- quoteExactInput <tokenIn> <tokenOut> <amountIn> [fee]
```

**Parameters:**

- `tokenIn`: Input token identifier (e.g., "GALA|Unit|none|none")
- `tokenOut`: Output token identifier (e.g., "SILK|Unit|none|none")
- `amountIn`: Amount of input token to swap
- `fee`: (Optional) Pool fee tier (500, 3000, or 10000)

**Example:**

```bash
npm run cli -- quoteExactInput "GALA|Unit|none|none" "SILK|Unit|none|none" 100
```

#### `quoteExactOutput`

Get a quote for receiving a specific output amount.

**Syntax:**

```bash
npm run cli -- quoteExactOutput <tokenIn> <tokenOut> <amountOut> [fee]
```

**Parameters:**

- `tokenIn`: Input token identifier
- `tokenOut`: Output token identifier
- `amountOut`: Desired amount of output token
- `fee`: (Optional) Pool fee tier (500, 3000, or 10000)

**Example:**

```bash
npm run cli -- quoteExactOutput "GALA|Unit|none|none" "SILK|Unit|none|none" 50
```

#### `swap`

Execute a token swap transaction. The command automatically waits for transaction completion and returns the final result.

**Syntax:**

```bash
npm run cli -- swap <walletAddress> <tokenIn> <tokenOut> <fee> <exactIn|exactOut> <amount> [slippageProtection]
```

**Parameters:**

- `walletAddress`: Your wallet address
- `tokenIn`: Input token identifier (the token you want to sell)
- `tokenOut`: Output token identifier (the token you want to buy)
- `fee`: Pool fee tier (500, 3000, or 10000)
- `exactIn|exactOut`: Swap type - either "exactIn" or "exactOut" (exactIn means you specify selling amount, exactOut means you specify buying amount)
- `amount`: Amount to swap (input amount for exactIn, output amount for exactOut)
- `slippageProtection`: (Optional) Minimum output for exactIn or maximum input for exactOut

**Examples:**

```bash
# Swap exactly 1.5 GALA for SILK (with slippage protection)
npm run cli -- swap "eth|6cd13b1c31B4E489788F61f2dbf854509D608F42" "GALA|Unit|none|none" "SILK|Unit|none|none" 10000 exactIn 1.5 30

# Swap GALA to get exactly 30 SILK (with maximum input protection)
npm run cli -- swap "eth|6cd13b1c31B4E489788F61f2dbf854509D608F42" "GALA|Unit|none|none" "SILK|Unit|none|none" 10000 exactOut 30 1.5
```

### Position Management Commands

#### `getUserPositions`

Get all liquidity positions for a user.

**Syntax:**

```bash
npm run cli -- getUserPositions <ownerAddress>
```

**Example:**

```bash
npm run cli -- getUserPositions "eth|6cd13b1c31B4E489788F61f2dbf854509D608F42"
```

#### `getPosition`

Get details of a specific position by parameters.

**Syntax:**

```bash
npm run cli -- getPosition <ownerAddress> <token0> <token1> <fee> <tickLower> <tickUpper>
```

**Example:**

```bash
npm run cli -- getPosition "eth|6cd13b1c31B4E489788F61f2dbf854509D608F42" "GALA|Unit|none|none" "SILK|Unit|none|none" 10000 -886800 886800
```

#### `getPositionById`

Get details of a specific position by ID.

**Syntax:**

```bash
npm run cli -- getPositionById <ownerAddress> <positionId>
```

**Example:**

```bash
npm run cli -- getPositionById "eth|6cd13b1c31B4E489788F61f2dbf854509D608F42" "position123"
```

### Liquidity Management Commands

#### `addLiquidity`

Add liquidity to an existing position (simplified). Specify only token0 amount. token1 amount will be automatically determined by the current pool condition.

**Syntax:**

```bash
npm run cli -- addLiquidity <walletAddress> <positionId> <token0Amount>
```

**Example:**

```bash
npm run cli -- addLiquidity "eth|6cd13b1c31B4E489788F61f2dbf854509D608F42" "position123" 100
```

#### `addLiquidityByTicks`

Add liquidity to a position with specific tick range.

**Syntax:**

```bash
npm run cli -- addLiquidityByTicks <walletAddress> <positionId> <token0> <token1> <fee> <tickLower> <tickUpper> <amount0Desired> <amount1Desired> <amount0Min> <amount1Min>
```

**Example:**

```bash
npm run cli -- addLiquidityByTicks "eth|6cd13b1c31B4E489788F61f2dbf854509D608F42" "pos123" "GALA|Unit|none|none" "SILK|Unit|none|none" 10000 -887200 887200 100 200 95 190
```

#### `addLiquidityByPrice`

Add liquidity to a position with specific price range.

**Syntax:**

```bash
npm run cli -- addLiquidityByPrice <walletAddress> <positionId> <token0> <token1> <fee> <tickSpacing> <minPrice> <maxPrice> <amount0Desired> <amount1Desired> <amount0Min> <amount1Min>
```

**Example:**

```bash
npm run cli -- addLiquidityByPrice "eth|6cd13b1c31B4E489788F61f2dbf854509D608F42" "pos123" "GALA|Unit|none|none" "SILK|Unit|none|none" 10000 200 0.1 10 100 200 95 190
```

#### `estimateRemoveLiquidity`

Estimate the token amounts that would be received from removing liquidity from a position.

**Syntax:**

```bash
npm run cli -- estimateRemoveLiquidity <ownerAddress> <positionId> <token0> <token1> <fee> <tickLower> <tickUpper> <amount>
```

**Parameters:**

- `ownerAddress`: The wallet address that owns the position
- `positionId`: The position identifier
- `token0`: The first token in the pair
- `token1`: The second token in the pair
- `fee`: Pool fee tier (500, 3000, or 10000)
- `tickLower`: The lower tick of the position range
- `tickUpper`: The upper tick of the position range
- `amount`: The amount of liquidity to remove

**Example:**

```bash
npm run cli -- estimateRemoveLiquidity "client|635f048ab243d7eb7f5ba044" "210f8e4dd1bbe1b4af4b977330ee7e4b68bc716f66e39c87a60fff0976ded3ea" "GALA|Unit|none|none" "GUSDT|Unit|none|none" 3000 -41100 -40080 "1491.973332758921980256"
```

#### `removeLiquidity`

Remove liquidity from a position. The `portion` parameter specifies the fraction of liquidity to remove (for example `0.5` for 50%).

**Syntax:**

```bash
npm run cli -- removeLiquidity <walletAddress> <positionId> <portion>
```

**Example:**

```bash
npm run cli -- removeLiquidity "eth|6cd13b1c31B4E489788F61f2dbf854509D608F42" "position123"
```

#### `collectPositionFees`

Collect accumulated fees from a position.

**Syntax:**

```bash
npm run cli -- collectPositionFees <walletAddress> <positionId>
```

**Example:**

```bash
npm run cli -- collectPositionFees "eth|6cd13b1c31B4E489788F61f2dbf854509D608F42" "position123"
```

### Pool Information Commands

#### `getPoolData`

Get information about a specific pool.

**Syntax:**

```bash
npm run cli -- getPoolData <token0> <token1> <fee>
```

**Example:**

```bash
npm run cli -- getPoolData "GALA|Unit|none|none" "SILK|Unit|none|none" 10000
```

## Token Format

Tokens are specified using the GalaChain token format:

```
"SYMBOL|Unit|none|none"
```

Common examples:

- GALA: `"GALA|Unit|none|none"`
- SILK: `"SILK|Unit|none|none"`
- Custom tokens follow the same pattern with their respective symbol

## Fee Tiers

The DEX supports three fee tiers:

- `500` - 0.05% (lowest fee)
- `3000` - 0.3% (medium fee)
- `10000` - 1.0% (highest fee)

## Wallet Address Format

Wallet addresses should be in the format:

```
"eth|<ethereum_address>"
```

Example: `"eth|0x1234567890123456789012345678901234567890"`

## Event listening

Many actions (such as swapping) do not complete immediately. When it does complete (or errors), you will be notified by websocket. To listen for websocket events, run:

```bash
npm run sockets
```

## Examples Workflow

### 1. Check Pool Information

```bash
# Get pool data for GALA/SILK pair
npm run cli -- getPoolData "GALA|Unit|none|none" "SILK|Unit|none|none" 10000
```

### 2. Get Trading Quote

```bash
# Quote swapping 100 GALA for SILK
npm run cli -- quoteExactInput "GALA|Unit|none|none" "SILK|Unit|none|none" 10000 100
```

### 3. Execute Swap

```bash
# Swap exactly 100 GALA for SILK with minimum 95 SILK output
npm run cli -- swap "eth|6cd13b1c31B4E489788F61f2dbf854509D608F42" "GALA|Unit|none|none" "SILK|Unit|none|none" 10000 exactIn 100 95
```

### 4. Check Your Positions

```bash
# Get all your liquidity positions
npm run cli -- getUserPositions "eth|6cd13b1c31B4E489788F61f2dbf854509D608F42"
```

### 5. Add Liquidity

```bash
# Add liquidity with specific tick range
npm run cli -- addLiquidityByTicks "eth|6cd13b1c31B4E489788F61f2dbf854509D608F42" "pos1" "GALA|Unit|none|none" "SILK|Unit|none|none" 10000 -886800 886800 100 200 95 190
```

### 6. Collect Fees

```bash
# Collect fees from your position
npm run cli -- collectPositionFees "eth|6cd13b1c31B4E489788F61f2dbf854509D608F42" "pos1"
```
