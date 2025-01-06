require('dotenv').config();

const config = {
  opensea: {
    apiKey: process.env.OPENSEA_API_KEY || null,
    baseUrl: 'https://api.opensea.io/api/v1',
    rateLimit: parseInt(process.env.API_DELAY_MS) || 1000
  },
  
  blockchain: {
    ethereum: {
      rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://ethereum-rpc.publicnode.com',
      name: 'Ethereum'
    },
    polygon: {
      rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
      name: 'Polygon'
    }
  },
  
  output: {
    defaultFormat: process.env.DEFAULT_OUTPUT_FORMAT || 'json',
    defaultChain: process.env.DEFAULT_CHAIN || 'ethereum'
  },
  
  scanning: {
    defaultLimit: 50,
    maxTokensForHolders: 1000
  }
};

module.exports = config;