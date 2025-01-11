#!/usr/bin/env node

const { Command } = require('commander');
const NFTScanner = require('./scanner');
const BlockchainConnection = require('./blockchain');
const MetadataFetcher = require('./metadata');
const Utils = require('./utils');
const program = new Command();

const scanner = new NFTScanner();
const blockchain = new BlockchainConnection();
const metadataFetcher = new MetadataFetcher();

program
  .name('nft-scan')
  .description('CLI tool for scanning and analyzing NFT collections')
  .version('0.1.0');

program
  .command('scan <address>')
  .description('Scan NFT collection at the given contract address')
  .option('-c, --chain <chain>', 'blockchain to scan (ethereum, polygon)', 'ethereum')
  .option('-o, --output <format>', 'output format (json, csv)', 'json')
  .option('-f, --file <filename>', 'output filename')
  .option('-m, --metadata', 'fetch metadata from IPFS')
  .action(async (address, options) => {
    if (!Utils.validateContractAddress(address)) {
      console.error('Invalid contract address format');
      return;
    }

    console.log(`Scanning NFT collection: ${address}`);
    console.log(`Chain: ${options.chain}`);
    
    try {
      const stats = await scanner.getCollectionStats(address, options.chain);
      let assets = await scanner.getCollectionAssets(address, options.chain, 20);
      console.log(`Found ${assets.length} assets`);
      
      if (options.metadata && assets.length > 0) {
        console.log('Fetching metadata from IPFS...');
        assets = await metadataFetcher.batchEnrichAssets(
          assets.map(asset => ({ 
            ...asset, 
            contractAddress: address, 
            chain: options.chain 
          })), 
          blockchain
        );
      }
      
      let exportData = [];
      
      if (assets.length > 0) {
        const rarityAnalysis = await scanner.analyzeRarity(assets);
        const sorted = rarityAnalysis.sort((a, b) => b.rarityScore - a.rarityScore);
        
        console.log('Top 5 Rarest Assets:');
        sorted.slice(0, 5).forEach((asset, index) => {
          const name = asset.metadata?.name || asset.name || `Token #${asset.tokenId}`;
          console.log(`${index + 1}. ${name} - Score: ${asset.rarityScore.toFixed(2)}`);
        });
        
        exportData = sorted.map(asset => ({
          tokenId: asset.tokenId,
          name: asset.metadata?.name || asset.name || `Token #${asset.tokenId}`,
          rarityScore: asset.rarityScore.toFixed(2),
          traitCount: asset.traits ? asset.traits.length : 0,
          ...(options.metadata && asset.metadata && {
            description: asset.metadata.description,
            imageUrl: asset.metadata.image,
            owner: asset.owner
          })
        }));
      }
      
      if (options.file && exportData.length > 0) {
        const timestamp = Utils.generateTimestamp();
        const filename = options.file || `scan_${address}_${timestamp}.${options.output}`;
        
        if (options.output === 'csv') {
          Utils.exportToCSV(exportData, filename);
        } else {
          Utils.exportToJSON(exportData, filename);
        }
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
  .option('-o, --output <format>', 'output format (json, csv)', 'json')
  .option('-f, --file <filename>', 'output filename')
  .action(async (address, options) => {
    if (!Utils.validateContractAddress(address)) {
      console.error('Invalid contract address format');
      return;
    }

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
          console.log(`${index + 1}. ${Utils.formatAddress(holder.address)} - ${holder.tokenCount} tokens`);
        });
        
        console.log(`\nTotal unique holders: ${Utils.formatNumber(holders.length)}`);
        const totalTokens = holders.reduce((sum, holder) => sum + holder.tokenCount, 0);
        console.log(`Average tokens per holder: ${(totalTokens / holders.length).toFixed(2)}`);
        
        if (options.file) {
          const timestamp = Utils.generateTimestamp();
          const filename = options.file || `holders_${address}_${timestamp}.${options.output}`;
          
          const exportData = holders.map((holder, index) => ({
            rank: index + 1,
            address: holder.address,
            tokenCount: holder.tokenCount,
            percentage: ((holder.tokenCount / totalTokens) * 100).toFixed(2)
          }));
          
          if (options.output === 'csv') {
            Utils.exportToCSV(exportData, filename);
          } else {
            Utils.exportToJSON(exportData, filename);
          }
        }
      }
    } catch (error) {
      console.error('Error getting holders:', error.message);
    }
  });

program.parse();