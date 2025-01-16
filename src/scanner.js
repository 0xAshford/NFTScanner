const axios = require('axios');
const config = require('./config');
const { handleApiError, retry } = require('./errors');

class NFTScanner {
  constructor(apiKey = null) {
    this.apiKey = apiKey || config.opensea.apiKey;
    this.baseUrl = config.opensea.baseUrl;
    this.rateLimit = config.opensea.rateLimit;
  }

  async getCollectionStats(contractAddress, chain = 'ethereum') {
    const fetchStats = retry(async () => {
      const url = `${this.baseUrl}/collection/${contractAddress}/stats`;
      const headers = this.apiKey ? { 'X-API-KEY': this.apiKey } : {};
      
      const response = await axios.get(url, { headers });
      await this.sleep(this.rateLimit);
      return response.data;
    });

    try {
      return await fetchStats();
    } catch (error) {
      handleApiError(error, `fetching stats for ${contractAddress}`);
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

  async getFloorPrice(contractAddress, chain = 'ethereum') {
    try {
      const url = `${this.baseUrl}/collection/${contractAddress}/stats`;
      const headers = this.apiKey ? { 'X-API-KEY': this.apiKey } : {};
      
      const response = await axios.get(url, { headers });
      await this.sleep(this.rateLimit);
      
      const stats = response.data?.stats;
      if (stats) {
        return {
          floorPrice: stats.floor_price,
          totalVolume: stats.total_volume,
          totalSales: stats.total_sales,
          averagePrice: stats.average_price,
          marketCap: stats.market_cap,
          count: stats.count
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching floor price:', error.message);
      return null;
    }
  }

  async analyzeRarity(assets) {
    const traitCounts = {};
    const totalSupply = assets.length;

    assets.forEach(asset => {
      const traits = asset.traits || asset.metadata?.attributes || [];
      traits.forEach(trait => {
        const key = `${trait.trait_type}:${trait.value}`;
        traitCounts[key] = (traitCounts[key] || 0) + 1;
      });
    });

    return assets.map(asset => {
      let rarityScore = 0;
      const traits = asset.traits || asset.metadata?.attributes || [];
      
      if (traits.length > 0) {
        traits.forEach(trait => {
          const key = `${trait.trait_type}:${trait.value}`;
          const frequency = traitCounts[key] / totalSupply;
          rarityScore += 1 / frequency;
        });
      }
      
      return {
        tokenId: asset.token_id,
        name: asset.name,
        rarityScore: rarityScore,
        traits: traits,
        ...(asset.metadata && { metadata: asset.metadata }),
        ...(asset.owner && { owner: asset.owner })
      };
    });
  }
}

module.exports = NFTScanner;