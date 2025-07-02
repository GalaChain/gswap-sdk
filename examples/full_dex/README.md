# gSwap DEX Frontend Example

A minimal example of how to build a decentralized exchange (DEX) swapping frontend using the gSwap SDK and Gala Wallet. This React application demonstrates the core functionality needed to create a DEX swapping interface.

IMPORTANT: Wallet connection will only work if you run this with SSL. Otherwise Gala Wallet will not inject into the page.

NOTE: While there's a tab for "Liquidity", this page is not currently implemented.

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

For wallet connection support:

3. Install NGINX

If on MacOS and using Homebrew: `brew install nginx`

Otherwise follow the instructions for your OS, or use a different web server.

4. Acquire certificates

If on MacOS, use mkcert:

```
brew install mkcert
brew install nss
mkcert -install
```

Then generate wildcard certs for `gala.com`:

```bash
mkcert "*.gala.com"
```

5. Update your `/etc/hosts` file to include the following line:

```bash
127.0.0.1 dextest.gala.com
```

6. Use an NGINX config file like this (add your own cert.pem and key.pem file paths you got in step 4):

```nginx
http {
    include       mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    keepalive_timeout  65;

    server {
        listen 127.0.0.1:443 ssl;
        server_name dextest.gala.com;

        ssl_certificate /Users/user/cert.pem;
        ssl_certificate_key /Users/user/key.pem;

        location / {
          proxy_pass http://localhost:5173;
        }
    }
}
```

7. Reload NGINX

```bash
nginx -s reload
```

8. Now you should be able to access the app at: https://dextest.gala.com in your browser, with Gala Wallet support.
