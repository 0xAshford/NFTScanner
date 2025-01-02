#!/usr/bin/env node

const { Command } = require('commander');
const NFTScanner = require('./scanner');
const program = new Command();

const scanner = new NFTScanner();

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
  .action((address, options) => {
    console.log(`Getting holders for: ${address} on ${options.chain}`);
  });

program.parse();