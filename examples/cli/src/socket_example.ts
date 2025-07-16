import { BundlerResponse, GSwap } from '@gala-chain/gswap-sdk';
import 'dotenv/config';

export async function socketExample() {
  console.log('Connecting to event socket...');
  const socketClient = await GSwap.events.connectEventSocket();

  socketClient.on('connect', () => {
    console.log('✅ Connected to event socket');
  });

  socketClient.on('disconnect', (reason: string) => {
    console.log('❌ Disconnected from event socket:', reason);
  });

  socketClient.on('error', (error: Error) => {
    console.error('🚨 Event socket error:', error);
  });

  // Listen for transaction results
  socketClient.on('transaction', (transactionId: string, response: BundlerResponse) => {
    console.log(`📨 Transaction ${transactionId} update:`, {
      status: response.status,
      hasData: !!response.data,
      error: response.data,
    });

    if (response.status === 'PROCESSED') {
      console.log('✅ Transaction completed successfully!');
      console.log('📊 Full response:', JSON.stringify(response.data, null, 2));
    } else if (response.status === 'FAILED') {
      console.error('❌ Transaction failed:', response.data);
    }
  });

  console.log('🎧 Socket event listeners set up. You can now send transactions...');
  console.log('📡 Socket connected:', GSwap.events.eventSocketConnected());
}

socketExample()
  .then(() => console.log('✅ Socket example completed'))
  .catch((error) => console.error('❌ Socket example failed:', error));
