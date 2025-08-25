## Privateness MCP Server

MCP server providing HTTP/JSON access to all Privateness CLI functionality for team development workflows.

## Features

*   **Complete CLI Coverage**: All 40+ privateness-cli commands organized by category
*   **Multiple API Styles**: Category-based routes, generic commands, and legacy RPC
*   **Environment Integration**: Supports all privateness-cli environment variables
*   **Team Development**: Self-hosted API for internal tooling
*   **Port 7332**: Avoids common port conflicts

## Prerequisites

*   Node.js 14.0.0 or higher
*   privateness-cli in your PATH or specified via environment variable
*   Privateness node running (default: http://127.0.0.1:6660)

## Installation

```plaintext
git clone this repository
cd privateness-mcp-server
npm install
```

## Configuration

Configure using environment variables (same as privateness-cli):

```plaintext
export PORT=7332                           # Server port (default: 7332)
export PRIVATENESS_CLI_PATH=privateness-cli # Path to privateness-cli
export RPC_ADDR=http://127.0.0.1:6660      # RPC node address
export RPC_USER=username                   # RPC username (if enabled)
export RPC_PASS=password                   # RPC password (if enabled)
export COIN=privateness                    # Coin name
export DATA_DIR=./data                     # Data directory
```

## Running the Server

```plaintext
npm start
# or for development:
npm run dev
```

## API Endpoints

### Discovery & Health

*   `GET /health` - Server health and statistics
*   `GET /endpoints` - List all available commands by category

### Command Categories

#### Wallet Management

*   `POST /wallet/walletCreate` - Create new wallet
*   `POST /wallet/listWallets` - List all wallets
*   `POST /wallet/listAddresses` - List wallet addresses
*   `POST /wallet/addPrivateKey` - Add private key to wallet
*   `POST /wallet/encryptWallet` - Encrypt wallet
*   `POST /wallet/showSeed` - Show wallet seed

#### Address Operations

*   `POST /address/addressGen` - Generate addresses
*   `POST /address/addressBalance` - Check address balance
*   `POST /address/addressOutputs` - Display address outputs
*   `POST /address/verifyAddress` - Verify address format

#### Balance & Outputs

*   `POST /balance/walletBalance` - Check wallet balance
*   `POST /balance/walletOutputs` - Display wallet outputs
*   `POST /balance/walletHistory` - Show wallet transaction history

#### Transactions

*   `POST /transaction/send` - Send coins
*   `POST /transaction/createRawTransaction` - Create raw transaction
*   `POST /transaction/signTransaction` - Sign transaction
*   `POST /transaction/broadcastTransaction` - Broadcast transaction
*   `POST /transaction/pendingTransactions` - Get pending transactions

#### Blockchain

*   `POST /blockchain/status` - Node status
*   `POST /blockchain/blocks` - Get block information
*   `POST /blockchain/lastBlocks` - Get recent blocks
*   `POST /blockchain/version` - Get version info

#### System

*   `POST /system/showConfig` - Show configuration
*   `POST /system/checkdb` - Verify database

### Generic Command Routes

*   `POST /cmd/:command` - Execute any privateness-cli command
*   `POST /rpc` - Legacy RPC passthrough

### Request Format

All endpoints accept JSON with parameters and flags:

```plaintext
{
  "params": ["param1", "param2"],
  "flags": {
    "wallet": "my-wallet.wlt",
    "password": "secret",
    "amount": "100"
  }
}
```

### Examples

#### Create a new wallet:

```plaintext
curl -X POST http://localhost:7332/wallet/walletCreate \
  -H "Content-Type: application/json" \
  -d '{"flags": {"wallet": "team-wallet.wlt", "label": "Team Wallet"}}'
```

#### Check wallet balance:

```plaintext
curl -X POST http://localhost:7332/balance/walletBalance \
  -H "Content-Type: application/json" \
  -d '{"flags": {"wallet": "team-wallet.wlt"}}'
```

#### Send coins:

```plaintext
curl -X POST http://localhost:7332/transaction/send \
  -H "Content-Type: application/json" \
  -d '{
    "flags": {
      "wallet": "team-wallet.wlt",
      "to": "recipient_address",
      "amount": "10.5"
    }
  }'
```

#### Generate addresses:

```plaintext
curl -X POST http://localhost:7332/address/addressGen \
  -H "Content-Type: application/json" \
  -d '{"flags": {"num": "5", "coin": "privateness"}}'
```

#### Get node status:

```plaintext
curl -X POST http://localhost:7332/blockchain/status \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Command Categories

### Wallet (11 commands)

Wallet creation, management, encryption, and key operations.

### Address (6 commands)

Address generation, verification, and balance checking.

### Balance (3 commands)

Wallet balance, outputs, and transaction history.

### Transaction (9 commands)

Creating, signing, broadcasting, and managing transactions.

### Blockchain (5 commands)

Node status, blocks, and network information.

### System (6 commands)

Configuration, database verification, and help.

## Error Handling

Detailed error responses include:

*   Error message
*   stderr output from privateness-cli
*   Exit code
*   Command name for context

## Security

*   **Network Security**: Run behind HTTPS reverse proxy for production
*   **Access Control**: Use firewall rules to limit access
*   **Credentials**: Secure RPC credentials if authentication enabled
*   **Local Development**: Designed for team development workflows

## Development

```plaintext
npm run dev  # Auto-reload on changes
```

## License

MIT