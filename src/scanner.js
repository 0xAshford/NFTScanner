const axios = require('axios');
const config = require('./config');

class NFTScanner {
  constructor(apiKey = null) {
    this.apiKey = apiKey || config.opensea.apiKey;
    this.baseUrl = config.opensea.baseUrl;
    this.rateLimit = config.opensea.rateLimit;
  }

  async getCollectionStats(contractAddress, chain = 'ethereum') {
    try {
      const url = `${this.baseUrl}/collection/${contractAddress}/stats`;
      const headers = this.apiKey ? { 'X-API-KEY': this.apiKey } : {};
      
      const response = await axios.get(url, { headers });
      await this.sleep(this.rateLimit);
      return response.data;
    } catch (error) {
      console.error('Error fetching collection stats:', error.message);
      return null;
    }
  }

  async getCollectionAssets(contractAddress, chain = 'ethereum', limit = 50) {
    try {
      const url = `${this.baseUrl}/assets`;
      const params = {
        asset_contract_address: contractAddress,
        limit: limit,
        order_direction: 'desc'
      };
      
      const headers = this.apiKey ? { 'X-API-KEY': this.apiKey } : {};
      const response = await axios.get(url, { params, headers });
      await this.sleep(this.rateLimit);
      return response.data.assets || [];
    } catch (error) {
      console.error('Error fetching assets:', error.message);
      return [];
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async analyzeRarity(assets) {
    const traitCounts = {};
    const totalSupply = assets.length;

    assets.forEach(asset => {
      if (asset.traits) {
        asset.traits.forEach(trait => {
          const key = `${trait.trait_type}:${trait.value}`;
          traitCounts[key] = (traitCounts[key] || 0) + 1;
        });
      }
    });

    return assets.map(asset => {
      let rarityScore = 0;
      if (asset.traits) {
        asset.traits.forEach(trait => {
          const key = `${trait.trait_type}:${trait.value}`;
          const frequency = traitCounts[key] / totalSupply;
          rarityScore += 1 / frequency;
        });
      }
      
      return {
        tokenId: asset.token_id,
        name: asset.name,
        rarityScore: rarityScore,
        traits: asset.traits
      };
    });
  }
}

module.exports = NFTScanner;