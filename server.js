const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');

// Configuration
const CONFIG = {
  port: process.env.PORT || 7332,
  privatnessCliPath: process.env.PRIVATENESS_CLI_PATH || 'privateness-cli',
  rpcAddr: process.env.RPC_ADDR || 'http://127.0.0.1:6660',
  rpcUser: process.env.RPC_USER || '',
  rpcPass: process.env.RPC_PASS || '',
  coin: process.env.COIN || 'privateness',
  dataDir: process.env.DATA_DIR || ''
};

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Helper function to execute privateness-cli commands
async function execPrivatenessCliCommand(command, params = [], flags = {}) {
  const args = [command];
  
  // Add flags
  Object.entries(flags).forEach(([key, value]) => {
    if (value === true) {
      args.push(`--${key}`);
    } else if (value !== false && value !== null && value !== undefined) {
      args.push(`--${key}`, value.toString());
    }
  });
  
  // Add parameters
  args.push(...params);
  
  // Add environment variables as flags if set
  if (CONFIG.rpcAddr !== 'http://127.0.0.1:6660') {
    process.env.RPC_ADDR = CONFIG.rpcAddr;
  }
  if (CONFIG.rpcUser) {
    process.env.RPC_USER = CONFIG.rpcUser;
  }
  if (CONFIG.rpcPass) {
    process.env.RPC_PASS = CONFIG.rpcPass;
  }
  if (CONFIG.coin !== 'privateness') {
    process.env.COIN = CONFIG.coin;
  }
  if (CONFIG.dataDir) {
    process.env.DATA_DIR = CONFIG.dataDir;
  }
  
  return new Promise((resolve, reject) => {
    const child = spawn(CONFIG.privatnessCliPath, args);
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      if (code !== 0) {
        console.error(`Command failed with code ${code}: ${stderr}`);
        return reject({ 
          error: `Command failed with exit code ${code}`, 
          stderr: stderr.trim(),
          code 
        });
      }
      
      let result = stdout.trim();
      
      try {
        // Try to parse JSON output
        if (result) {
          const parsed = JSON.parse(result);
          resolve(parsed);
        } else {
          resolve({ success: true });
        }
      } catch (e) {
        // Return raw text if not JSON
        resolve(result || 'Success');
      }
    });
  });
}

// Privateness CLI endpoints mapping
const PRIVATENESS_ENDPOINTS = {
  // Wallet Management
  'addPrivateKey': { category: 'wallet', params: ['privateKey'], flags: ['wallet'] },
  'walletCreate': { category: 'wallet', params: [], flags: ['wallet', 'seed', 'label', 'password', 'encrypt', 'crypto-type', 'bip44-coin'] },
  'walletCreateTemp': { category: 'wallet', params: [], flags: ['wallet', 'seed', 'label', 'password', 'encrypt', 'crypto-type'] },
  'listWallets': { category: 'wallet', params: [], flags: [] },
  'listAddresses': { category: 'wallet', params: [], flags: ['wallet'] },
  'walletAddAddresses': { category: 'wallet', params: [], flags: ['wallet', 'num'] },
  'walletScanAddresses': { category: 'wallet', params: [], flags: ['wallet', 'num'] },
  'walletKeyExport': { category: 'wallet', params: [], flags: ['wallet', 'address'] },
  'showSeed': { category: 'wallet', params: [], flags: ['wallet', 'password'] },
  'encryptWallet': { category: 'wallet', params: [], flags: ['wallet', 'password'] },
  'decryptWallet': { category: 'wallet', params: [], flags: ['wallet', 'password'] },

  // Address Operations
  'addressGen': { category: 'address', params: [], flags: ['coin', 'num', 'hex'] },
  'addressBalance': { category: 'address', params: ['addresses'], flags: [] },
  'addressOutputs': { category: 'address', params: ['addresses'], flags: [] },
  'addressTransactions': { category: 'address', params: ['addresses'], flags: [] },
  'addresscount': { category: 'address', params: [], flags: [] },
  'verifyAddress': { category: 'address', params: ['address'], flags: [] },
  'fiberAddressGen': { category: 'address', params: [], flags: ['coin', 'num'] },

  // Wallet Balance & Outputs
  'walletBalance': { category: 'balance', params: [], flags: ['wallet'] },
  'walletOutputs': { category: 'balance', params: [], flags: ['wallet'] },
  'walletHistory': { category: 'balance', params: [], flags: ['wallet'] },

  // Transactions
  'send': { category: 'transaction', params: [], flags: ['wallet', 'address', 'to', 'amount', 'many', 'password', 'csv'] },
  'createRawTransaction': { category: 'transaction', params: [], flags: ['wallet', 'address', 'to', 'amount', 'many', 'password', 'csv'] },
  'createRawTransactionV2': { category: 'transaction', params: [], flags: ['wallet', 'address', 'to', 'amount', 'many', 'password', 'csv'] },
  'signTransaction': { category: 'transaction', params: ['transaction'], flags: ['wallet', 'password'] },
  'broadcastTransaction': { category: 'transaction', params: ['transaction'], flags: [] },
  'decodeRawTransaction': { category: 'transaction', params: ['transaction'], flags: [] },
  'encodeJsonTransaction': { category: 'transaction', params: ['transaction'], flags: [] },
  'transaction': { category: 'transaction', params: ['txid'], flags: [] },
  'verifyTransaction': { category: 'transaction', params: ['transaction'], flags: [] },
  'pendingTransactions': { category: 'transaction', params: [], flags: [] },

  // Blockchain
  'blocks': { category: 'blockchain', params: [], flags: ['start', 'end'] },
  'lastBlocks': { category: 'blockchain', params: ['num'], flags: [] },
  'status': { category: 'blockchain', params: [], flags: [] },
  'version': { category: 'blockchain', params: [], flags: [] },
  'richlist': { category: 'blockchain', params: [], flags: ['include-distribution'] },

  // System
  'showConfig': { category: 'system', params: [], flags: [] },
  'checkdb': { category: 'system', params: [], flags: [] },
  'checkDBDecoding': { category: 'system', params: [], flags: [] },
  'distributeGenesis': { category: 'system', params: [], flags: [] },
  'help': { category: 'system', params: ['command'], flags: [] }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'privateness-mcp-server',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    endpoints: Object.keys(PRIVATENESS_ENDPOINTS).length
  });
});

// List all available endpoints
app.get('/endpoints', (req, res) => {
  const categories = {};
  Object.entries(PRIVATENESS_ENDPOINTS).forEach(([command, info]) => {
    if (!categories[info.category]) {
      categories[info.category] = [];
    }
    categories[info.category].push({
      command,
      params: info.params,
      flags: info.flags
    });
  });
  res.json(categories);
});

// Generic command endpoint handler
app.post('/cmd/:command', async (req, res) => {
  try {
    const command = req.params.command;
    const { params = [], flags = {} } = req.body;
    
    if (!PRIVATENESS_ENDPOINTS[command]) {
      return res.status(404).json({ 
        error: `Unknown command: ${command}`,
        available: Object.keys(PRIVATENESS_ENDPOINTS)
      });
    }
    
    const result = await execPrivatenessCliCommand(command, params, flags);
    res.json({ command, result });
  } catch (error) {
    res.status(500).json({ 
      error: error.error || error.message || 'Command failed',
      stderr: error.stderr || null,
      code: error.code || null
    });
  }
});

// Category-based endpoints
Object.keys(PRIVATENESS_ENDPOINTS).forEach(command => {
  const endpoint = PRIVATENESS_ENDPOINTS[command];
  const route = `/${endpoint.category}/${command}`;
  
  app.post(route, async (req, res) => {
    try {
      const { params = [], flags = {} } = req.body;
      const result = await execPrivatenessCliCommand(command, params, flags);
      res.json({ command, result });
    } catch (error) {
      res.status(500).json({ 
        error: error.error || error.message || 'Command failed',
        stderr: error.stderr || null,
        code: error.code || null
      });
    }
  });
});

// Legacy RPC passthrough
app.post('/rpc', async (req, res) => {
  try {
    const { command, params = [], flags = {} } = req.body;
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }
    
    const result = await execPrivatenessCliCommand(command, params, flags);
    res.json({ command, result });
  } catch (error) {
    res.status(500).json({ 
      error: error.error || error.message || 'Command failed',
      stderr: error.stderr || null,
      code: error.code || null
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(CONFIG.port, () => {
  console.log(`Privateness MCP Server v0.1.0 running on port ${CONFIG.port}`);
  console.log(`Using privateness-cli at: ${CONFIG.privatnessCliPath}`);
  console.log(`RPC Address: ${CONFIG.rpcAddr}`);
  console.log(`Coin: ${CONFIG.coin}`);
  console.log(`Available commands: ${Object.keys(PRIVATENESS_ENDPOINTS).length}`);
  console.log(`API Documentation: http://localhost:${CONFIG.port}/endpoints`);
  console.log(`Health Check: http://localhost:${CONFIG.port}/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
