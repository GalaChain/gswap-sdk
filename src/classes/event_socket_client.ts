import { EventEmitter } from 'events';
import { Socket, io } from 'socket.io-client';

export interface BundlerResponse {
  status: 'PROCESSED' | 'FAILED' | 'PENDING';
  data?: string;
  error?: string;
}

export interface BundlerRequest {
  data: string; // The transaction ID
  message: string;
  error: boolean;
}

export abstract class TradeEventEmitter extends EventEmitter {
  abstract connect(): Promise<void>;
  abstract disconnect(): void;
  abstract isConnected(): boolean;
}

export class EventSocketClient extends TradeEventEmitter {
  private socket: Socket | null = null;
  private readonly bundlerUrl: string;

  constructor(bundlerUrl: string) {
    super();
    this.bundlerUrl = bundlerUrl;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket = io(this.bundlerUrl, {
        transports: ['websocket'],
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('Connected to bundler socket:', this.bundlerUrl);
        this.emit('connect');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Failed to connect to bundler socket:', error);
        this.emit('error', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected from bundler socket:', reason);
        this.emit('disconnect', reason);
      });

      // Listen for bundler responses and emit them as events
      this.socket.onAny((eventName: string, ...args: unknown[]) => {
        if (typeof eventName === 'string') {
          const [responseData] = args as [BundlerResponse];
          this.emit('transaction', eventName, responseData);
        }
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}
