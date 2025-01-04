#!/usr/bin/env node

const { Command } = require('commander');
const NFTScanner = require('./scanner');
const BlockchainConnection = require('./blockchain');
const program = new Command();

const scanner = new NFTScanner();
const blockchain = new BlockchainConnection();

program
  .name('nft-scan')
  .description('CLI tool for scanning and analyzing NFT collections')
  .version('0.1.0');

program
  .command('scan <address>')
  .description('Scan NFT collection at the given contract address')
  .option('-c, --chain <chain>', 'blockchain to scan (ethereum, polygon)', 'ethereum')
  .option('-o, --output <format>', 'output format (json, csv)', 'json')
  .action(async (address, options) => {
    console.log(`Scanning NFT collection: ${address}`);
    console.log(`Chain: ${options.chain}`);
    
    try {
      const stats = await scanner.getCollectionStats(address, options.chain);
      if (stats) {
        console.log('Collection Stats:', JSON.stringify(stats, null, 2));
      }
      
      const assets = await scanner.getCollectionAssets(address, options.chain, 20);
      console.log(`Found ${assets.length} assets`);
      
      if (assets.length > 0) {
        const rarityAnalysis = await scanner.analyzeRarity(assets);
        console.log('Top 5 Rarest Assets:');
        rarityAnalysis
          .sort((a, b) => b.rarityScore - a.rarityScore)
          .slice(0, 5)
          .forEach((asset, index) => {
            console.log(`${index + 1}. Token #${asset.tokenId} - Score: ${asset.rarityScore.toFixed(2)}`);
          });
      }
    } catch (error) {
      console.error('Error scanning collection:', error.message);
    }
  });

program
  .command('holders <address>')
  .description('Get holder distribution for NFT collection')
  .option('-c, --chain <chain>', 'blockchain to scan', 'ethereum')
  .option('-l, --limit <limit>', 'max tokens to check', '100')
  .action(async (address, options) => {
    console.log(`Getting holders for: ${address} on ${options.chain}`);
    
    try {
      const collectionInfo = await blockchain.getCollectionInfo(address, options.chain);
      if (collectionInfo) {
        console.log(`Collection: ${collectionInfo.name} (${collectionInfo.symbol})`);
        console.log(`Total Supply: ${collectionInfo.totalSupply}`);
      }
      
      const holders = await blockchain.getHolders(address, options.chain, parseInt(options.limit));
      
      if (holders.length > 0) {
        console.log(`\nTop 10 Holders:`);
        holders.slice(0, 10).forEach((holder, index) => {
          console.log(`${index + 1}. ${holder.address} - ${holder.tokenCount} tokens`);
        });
        
        console.log(`\nTotal unique holders: ${holders.length}`);
        const totalTokens = holders.reduce((sum, holder) => sum + holder.tokenCount, 0);
        console.log(`Average tokens per holder: ${(totalTokens / holders.length).toFixed(2)}`);
      }
    } catch (error) {
      console.error('Error getting holders:', error.message);
    }
  });

program.parse();