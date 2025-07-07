# gSwap DEX Frontend Example

A minimal example of how to build a decentralized exchange (DEX) swapping frontend using the gSwap SDK and Gala Wallet. This React application demonstrates the core functionality needed to create a DEX swapping interface.

IMPORTANT: Wallet connection will only work if you run this with SSL. Otherwise Gala Wallet will not inject into the page.

## Current Implementation

Currently implemented:

- **Swap Page** - Token swapping interface with wallet connection
- **Wallet Integration** - Connect wallet functionality
- **Token Selection** - Dropdown menus for selecting tokens to swap

## Features

### Swap Interface

- Select input and output tokens from available token list
- Enter swap amounts with real-time validation
- Connect wallet to execute swaps
- Wallet address display in navigation header

### Wallet Connection

- Reusable wallet context for managing connection state
- Wallet address formatting and display
- Error handling for connection issues

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```
