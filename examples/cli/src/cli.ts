#!/usr/bin/env node
// Must come first
import 'dotenv/config';
// End must come first

import { GSwap } from '@gala-chain/gswap-sdk';
import { serializeError } from 'serialize-error';
import {
  addLiquidityByPrice,
  addLiquidityByTicks,
  addLiquidityToExistingPosition,
} from './add_liquidity.js';
import { collectFeesFromPosition } from './collect_fees.js';
import { getPoolData } from './get_pool_data.js';
import { getPositionById } from './get_position_by_id.js';
import { getUserAssets } from './get_user_assets.js';
import { getUserPositions } from './get_user_positions.js';
import { quoteExactInput } from './quote_exact_input.js';
import { quoteExactOutput } from './quote_exact_output.js';
import { removeLiquidity } from './remove_all_liquidity.js';
import { swapTokens } from './swap.js';

// For functions that need calculation utilities, we still need a GSwap instance
const gSwap = new GSwap({});

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: npm run cli -- <function> [args...]');
    console.log('');
    console.log('Available functions:');
    console.log('  quoteExactInput <tokenIn> <tokenOut> <amountIn> [fee]');
    console.log('  quoteExactOutput <tokenIn> <tokenOut> <amountOut> [fee]');
    console.log(
      '  swap <walletAddress> <tokenIn> <tokenOut> <fee> <exactIn|exactOut> <amount> [slippageProtection]',
    );
    console.log('  getUserAssets <ownerAddress> [page] [limit]');
    console.log('  getUserPositions <ownerAddress> [limit] [bookmark]');
    console.log('  getPosition <ownerAddress> <token0> <token1> <fee> <tickLower> <tickUpper>');
    console.log('  getPositionById <ownerAddress> <positionId>');
    console.log('  getPoolData <token0> <token1> <fee>');
    console.log(
      '  estimateRemoveLiquidity <ownerAddress> <positionId> <token0> <token1> <fee> <tickLower> <tickUpper> <amount>',
    );
    console.log(
      '  addLiquidityByTicks <walletAddress> <positionId> <token0> <token1> <fee> <tickLower> <tickUpper> <amount0Desired> <amount1Desired> <amount0Min> <amount1Min>',
    );
    console.log(
      '  addLiquidityByPrice <walletAddress> <positionId> <token0> <token1> <fee> <tickSpacing> <minPrice> <maxPrice> <amount0Desired> <amount1Desired> <amount0Min> <amount1Min>',
    );
    console.log('  addLiquidity <walletAddress> <positionId> <token0Amount>');
    console.log('  removeLiquidity <walletAddress> <positionId>');
    console.log('  collectPositionFees <walletAddress> <positionId>');
    console.log('  calculatePoolPrice <token0> <token1> <sqrtPrice>');
    console.log('  calculateTicksForPrice <price> <tickSpacing>');
    console.log('');
    console.log('Token format: "GALA|Unit|none|none" or similar');
    console.log('Wallet address format: "eth|123...abc" (use quotes due to pipe character)');
    console.log('Examples:');
    console.log('  npm run cli -- getUserAssets "eth|123...abc" 1 20');
    console.log('  npm run cli -- swap "eth|123...abc" GALA SILK 10000 exactIn 1.5');
    console.log('  npm run cli -- swap "eth|123...abc" GALA SILK 10000 exactOut 30 1.5');
    console.log(
      '  npm run cli -- estimateRemoveLiquidity "client|123...abc" "position-id" GALA GUSDT 3000 -41100 -40080 "1491.973332758921980256"',
    );
    process.exit(1);
  }

  const functionName = args[0];
  const functionArgs = args.slice(1);

  try {
    let result;

    switch (functionName) {
      case 'quoteExactInput':
        if (functionArgs.length < 3 || functionArgs.length > 4) {
          throw new Error(
            'quoteExactInput requires 3-4 arguments: <tokenIn> <tokenOut> <amountIn> [fee]',
          );
        }
        result = await quoteExactInput(
          functionArgs[0]!,
          functionArgs[1]!,
          functionArgs[2]!,
          functionArgs[3] ? (parseInt(functionArgs[3]) as 10000 | 3000 | 500) : undefined,
        );
        break;

      case 'quoteExactOutput':
        if (functionArgs.length < 3 || functionArgs.length > 4) {
          throw new Error(
            'quoteExactOutput requires 3-4 arguments: <tokenIn> <tokenOut> <amountOut> [fee]',
          );
        }
        result = await quoteExactOutput(
          functionArgs[0]!,
          functionArgs[1]!,
          functionArgs[2]!,
          functionArgs[3] ? (parseInt(functionArgs[3]) as 10000 | 3000 | 500) : undefined,
        );
        break;

      case 'swap': {
        if (functionArgs.length < 6 || functionArgs.length > 7) {
          throw new Error(
            'swap requires 6-7 arguments: <walletAddress> <tokenIn> <tokenOut> <fee> <exactIn|exactOut> <amount> [slippageProtection]',
          );
        }
        const swapType = functionArgs[4]!;
        const swapAmount = functionArgs[5]!;
        const slippageProtection = functionArgs[6];

        if (swapType === 'exactIn') {
          const swapParams = slippageProtection
            ? { exactIn: swapAmount, amountOutMinimum: slippageProtection }
            : { exactIn: swapAmount };
          result = await swapTokens(
            functionArgs[0]!,
            functionArgs[1]!,
            functionArgs[2]!,
            parseInt(functionArgs[3]!) as 10000 | 3000 | 500,
            swapParams,
          );
        } else if (swapType === 'exactOut') {
          const swapParams = slippageProtection
            ? { exactOut: swapAmount, amountInMaximum: slippageProtection }
            : { exactOut: swapAmount };
          result = await swapTokens(
            functionArgs[0]!,
            functionArgs[1]!,
            functionArgs[2]!,
            parseInt(functionArgs[3]!) as 10000 | 3000 | 500,
            swapParams,
          );
        } else {
          throw new Error('Swap type must be either "exactIn" or "exactOut"');
        }
        break;
      }

      case 'getUserAssets': {
        if (functionArgs.length < 1 || functionArgs.length > 3) {
          throw new Error('getUserAssets requires 1-3 arguments: <ownerAddress> [page] [limit]');
        }
        const page = functionArgs[1] ? parseInt(functionArgs[1]) : 1;
        const limit = functionArgs[2] ? parseInt(functionArgs[2]) : 10;
        result = await getUserAssets(functionArgs[0]!, page, limit);
        break;
      }

      case 'getUserPositions':
        if (functionArgs.length !== 1) {
          throw new Error('getUserPositions requires 1 argument: <ownerAddress>');
        }
        result = await getUserPositions(functionArgs[0]!);
        break;

      case 'getPosition':
        if (functionArgs.length !== 6) {
          throw new Error(
            'getPosition requires 6 arguments: <ownerAddress> <token0> <token1> <fee> <tickLower> <tickUpper>',
          );
        }
        result = await gSwap.positions.getPosition(functionArgs[0]!, {
          token0ClassKey: functionArgs[1]!,
          token1ClassKey: functionArgs[2]!,
          fee: parseInt(functionArgs[3]!),
          tickLower: parseInt(functionArgs[4]!),
          tickUpper: parseInt(functionArgs[5]!),
        });
        break;

      case 'getPositionById':
        if (functionArgs.length !== 2) {
          throw new Error('getPositionById requires 2 arguments: <ownerAddress> <positionId>');
        }
        result = await getPositionById(functionArgs[0]!, functionArgs[1]!);
        break;

      case 'getPoolData':
        if (functionArgs.length !== 3) {
          throw new Error('getPoolData requires 3 arguments: <inToken> <outToken> <fee>');
        }
        result = await getPoolData(functionArgs[0]!, functionArgs[1]!, parseInt(functionArgs[2]!));
        break;

      case 'estimateRemoveLiquidity':
        if (functionArgs.length !== 8) {
          throw new Error(
            'estimateRemoveLiquidity requires 8 arguments: <ownerAddress> <positionId> <token0> <token1> <fee> <tickLower> <tickUpper> <amount>',
          );
        }
        result = await gSwap.positions.estimateRemoveLiquidity({
          ownerAddress: functionArgs[0]!,
          positionId: functionArgs[1]!,
          token0: functionArgs[2]!,
          token1: functionArgs[3]!,
          fee: parseInt(functionArgs[4]!),
          tickLower: parseInt(functionArgs[5]!),
          tickUpper: parseInt(functionArgs[6]!),
          amount: functionArgs[7]!,
        });
        break;

      case 'addLiquidity':
        if (functionArgs.length !== 3) {
          throw new Error(
            'addLiquidity requires 3 arguments: <walletAddress> <positionId> <token0Amount>',
          );
        }
        result = await addLiquidityToExistingPosition(
          functionArgs[0]!,
          functionArgs[1]!,
          parseFloat(functionArgs[2]!),
        );
        break;

      case 'addLiquidityByTicks': {
        if (functionArgs.length !== 11) {
          throw new Error(
            'addLiquidityByTicks requires 11 arguments: <walletAddress> <positionId> <token0> <token1> <fee> <tickLower> <tickUpper> <amount0Desired> <amount1Desired> <amount0Min> <amount1Min>',
          );
        }

        result = await addLiquidityByTicks(
          functionArgs[0]!,
          functionArgs[1]!,
          functionArgs[2]!,
          functionArgs[3]!,
          parseInt(functionArgs[4]!),
          parseInt(functionArgs[5]!),
          parseInt(functionArgs[6]!),
          functionArgs[7]!,
          functionArgs[8]!,
          functionArgs[9]!,
          functionArgs[10]!,
        );
        break;
      }

      case 'addLiquidityByPrice':
        if (functionArgs.length !== 12) {
          throw new Error(
            'addLiquidityByPrice requires 12 arguments: <walletAddress> <positionId> <token0> <token1> <fee> <tickSpacing> <minPrice> <maxPrice> <amount0Desired> <amount1Desired> <amount0Min> <amount1Min>',
          );
        }
        result = await addLiquidityByPrice(
          functionArgs[0]!,
          functionArgs[1]!,
          functionArgs[2]!,
          functionArgs[3]!,
          parseInt(functionArgs[4]!),
          parseInt(functionArgs[5]!),
          functionArgs[6]!,
          functionArgs[7]!,
          functionArgs[8]!,
          functionArgs[9]!,
          functionArgs[10]!,
          functionArgs[11]!,
        );
        break;

      case 'removeLiquidity':
        if (functionArgs.length !== 3) {
          throw new Error(
            'removeLiquidity requires 3 arguments: <walletAddress> <positionId> <portion>',
          );
        }
        result = await removeLiquidity(
          functionArgs[0]!,
          functionArgs[1]!,
          Number(functionArgs[2]!),
        );
        break;

      case 'collectPositionFees':
        if (functionArgs.length !== 2) {
          throw new Error('collectPositionFees requires 2 arguments: <walletAddress> <positionId>');
        }
        result = await collectFeesFromPosition(functionArgs[0]!, functionArgs[1]!);
        break;

      default:
        throw new Error(`Unknown function: ${functionName}`);
    }

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    console.error(serializeError(error));
    process.exit(1);
  }
}

main().catch(console.error);
