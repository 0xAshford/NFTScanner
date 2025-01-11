const axios = require('axios');

class MetadataFetcher {
  constructor() {
    this.ipfsGateways = [
      'https://ipfs.io/ipfs/',
      'https://gateway.pinata.cloud/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
      'https://dweb.link/ipfs/'
    ];
    
    this.currentGatewayIndex = 0;
  }

  async fetchMetadata(tokenURI) {
    if (!tokenURI) return null;

    try {
      let url = tokenURI;
      
      if (tokenURI.startsWith('ipfs://')) {
        const ipfsHash = tokenURI.replace('ipfs://', '');
        url = await this.tryIpfsGateways(ipfsHash);
      }
      
      if (!url) return null;

      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'NFTScanner/1.0'
        }
      });

      return response.data;
    } catch (error) {
      console.error(`Error fetching metadata from ${tokenURI}:`, error.message);
      return null;
    }
  }

  async tryIpfsGateways(ipfsHash) {
    for (let i = 0; i < this.ipfsGateways.length; i++) {
      const gatewayIndex = (this.currentGatewayIndex + i) % this.ipfsGateways.length;
      const gateway = this.ipfsGateways[gatewayIndex];
      
      try {
        const url = gateway + ipfsHash;
        const response = await axios.head(url, { timeout: 5000 });
        
        if (response.status === 200) {
          this.currentGatewayIndex = gatewayIndex;
          return url;
        }
      } catch (error) {
        continue;
      }
    }
    
    return null;
  }

  async fetchImageUrl(imageUri) {
    if (!imageUri) return null;

    if (imageUri.startsWith('ipfs://')) {
      const ipfsHash = imageUri.replace('ipfs://', '');
      return await this.tryIpfsGateways(ipfsHash);
    }
    
    if (imageUri.startsWith('http')) {
      return imageUri;
    }
    
    return null;
  }

  async enrichAssetWithMetadata(asset, blockchain) {
    try {
      if (!asset.tokenId || !asset.contractAddress) {
        return asset;
      }

      const tokenInfo = await blockchain.getTokenMetadata(
        asset.contractAddress, 
        asset.tokenId, 
        asset.chain || 'ethereum'
      );
      
      if (!tokenInfo || !tokenInfo.tokenURI) {
        return asset;
      }

      const metadata = await this.fetchMetadata(tokenInfo.tokenURI);
      
      if (metadata) {
        const imageUrl = await this.fetchImageUrl(metadata.image);
        
        return {
          ...asset,
          metadata: {
            name: metadata.name,
            description: metadata.description,
            image: imageUrl,
            external_url: metadata.external_url,
            attributes: metadata.attributes || metadata.traits || []
          },
          tokenURI: tokenInfo.tokenURI,
          owner: tokenInfo.owner
        };
      }
      
      return asset;
    } catch (error) {
      console.error(`Error enriching asset ${asset.tokenId}:`, error.message);
      return asset;
    }
  }

  async batchEnrichAssets(assets, blockchain, batchSize = 5) {
    const enrichedAssets = [];
    
    for (let i = 0; i < assets.length; i += batchSize) {
      const batch = assets.slice(i, i + batchSize);
      
      console.log(`Processing metadata batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(assets.length/batchSize)}`);
      
      const promises = batch.map(asset => this.enrichAssetWithMetadata(asset, blockchain));
      const batchResults = await Promise.allSettled(promises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          enrichedAssets.push(result.value);
        } else {
          console.error(`Failed to enrich asset ${batch[index].tokenId}:`, result.reason);
          enrichedAssets.push(batch[index]);
        }
      });
      
      await this.sleep(1000);
    }
    
    return enrichedAssets;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = MetadataFetcher;