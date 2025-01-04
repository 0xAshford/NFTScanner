const { ethers } = require('ethers');

class BlockchainConnection {
  constructor() {
    this.providers = {
      ethereum: null,
      polygon: null
    };
    
    this.rpcUrls = {
      ethereum: 'https://ethereum-rpc.publicnode.com',
      polygon: 'https://polygon-rpc.com'
    };
    
    this.erc721Abi = [
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function totalSupply() view returns (uint256)',
      'function tokenURI(uint256 tokenId) view returns (string)',
      'function ownerOf(uint256 tokenId) view returns (address)',
      'function balanceOf(address owner) view returns (uint256)'
    ];
  }

  getProvider(chain = 'ethereum') {
    if (!this.providers[chain]) {
      this.providers[chain] = new ethers.JsonRpcProvider(this.rpcUrls[chain]);
    }
    return this.providers[chain];
  }

  async getContract(contractAddress, chain = 'ethereum') {
    const provider = this.getProvider(chain);
    return new ethers.Contract(contractAddress, this.erc721Abi, provider);
  }

  async getCollectionInfo(contractAddress, chain = 'ethereum') {
    try {
      const contract = await this.getContract(contractAddress, chain);
      
      const [name, symbol, totalSupply] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.totalSupply().catch(() => null)
      ]);

      return {
        name,
        symbol,
        totalSupply: totalSupply ? totalSupply.toString() : 'Unknown',
        contractAddress,
        chain
      };
    } catch (error) {
      console.error('Error getting collection info:', error.message);
      return null;
    }
  }

  async getTokenMetadata(contractAddress, tokenId, chain = 'ethereum') {
    try {
      const contract = await this.getContract(contractAddress, chain);
      const tokenURI = await contract.tokenURI(tokenId);
      const owner = await contract.ownerOf(tokenId);
      
      return {
        tokenId,
        tokenURI,
        owner,
        contractAddress
      };
    } catch (error) {
      console.error(`Error getting metadata for token ${tokenId}:`, error.message);
      return null;
    }
  }

  async getHolders(contractAddress, chain = 'ethereum', maxTokens = 100) {
    try {
      const contract = await this.getContract(contractAddress, chain);
      const holders = new Map();
      
      console.log('Fetching holder data...');
      
      for (let i = 1; i <= Math.min(maxTokens, 10000); i++) {
        try {
          const owner = await contract.ownerOf(i);
          const currentCount = holders.get(owner) || 0;
          holders.set(owner, currentCount + 1);
        } catch (error) {
          break;
        }
      }

      const holderArray = Array.from(holders.entries()).map(([address, count]) => ({
        address,
        tokenCount: count
      }));

      return holderArray.sort((a, b) => b.tokenCount - a.tokenCount);
    } catch (error) {
      console.error('Error getting holders:', error.message);
      return [];
    }
  }
}

module.exports = BlockchainConnection;