import {
  GalaChainTokenClassKey,
  GSwap,
  NumericAmount,
  PrivateKeySigner,
} from '@gala-chain/gswap-sdk';

export async function swapTokens(
  walletAddress: string,
  tokenIn: GalaChainTokenClassKey | string,
  tokenOut: GalaChainTokenClassKey | string,
  fee: 10_000 | 3_000 | 500,
  amount:
    | {
        exactIn: NumericAmount;
        amountOutMinimum?: NumericAmount;
      }
    | {
        exactOut: NumericAmount;
        amountInMaximum?: NumericAmount;
      },
) {
  const privateKey = process.env.GALACHAIN_PRIVATE_KEY;
  if (!privateKey) {
    console.log(
      'You must set the GALACHAIN_PRIVATE_KEY environment variable with your private key.',
    );
    process.exit(2);
  }

  const gSwap = new GSwap({
    signer: new PrivateKeySigner(privateKey!),
  });

  // Connect to socket for transaction status updates
  console.log('Connecting to transaction status socket...');
  await GSwap.events.connectEventSocket();

  console.log('Submitting swap transaction...');
  const pendingTx = await gSwap.swaps.swap(tokenIn, tokenOut, fee, amount, walletAddress);

  console.log(`Transaction submitted with ID: ${pendingTx.transactionId}`);
  console.log('Waiting for transaction to complete...');

  try {
    const result = await pendingTx.wait();
    console.log('Transaction completed successfully!');
    return result;
  } finally {
    // Clean up socket connection
    GSwap.events.disconnectEventSocket();
  }
}
