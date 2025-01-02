const axios = require('axios');

class NFTScanner {
  constructor(apiKey = null) {
    this.apiKey = apiKey;
    this.baseUrls = {
      ethereum: 'https://api.opensea.io/api/v1',
      polygon: 'https://api.opensea.io/api/v1'
    };
  }

  async getCollectionStats(contractAddress, chain = 'ethereum') {
    try {
      const url = `${this.baseUrls[chain]}/collection/${contractAddress}/stats`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching collection stats:', error.message);
      return null;
    }
  }

  async getCollectionAssets(contractAddress, chain = 'ethereum', limit = 50) {
    try {
      const url = `${this.baseUrls[chain]}/assets`;
      const params = {
        asset_contract_address: contractAddress,
        limit: limit,
        order_direction: 'desc'
      };
      
      const response = await axios.get(url, { params });
      return response.data.assets || [];
    } catch (error) {
      console.error('Error fetching assets:', error.message);
      return [];
    }
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