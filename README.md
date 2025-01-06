# NFT Scanner

A command-line tool for scanning and analyzing NFT collections across multiple blockchains.

## Features

- Scan NFT collections for rarity analysis
- Get holder distribution statistics  
- Support for Ethereum and Polygon networks
- Export data in JSON format
- Rate-limited API calls to respect service limits

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Add your OpenSea API key for higher rate limits (optional).

## Usage

### Scan a collection

```bash
npm start scan 0x1234567890123456789012345678901234567890
```

### Get holder distribution

```bash
npm start holders 0x1234567890123456789012345678901234567890 --limit 500
```

### Options

- `-c, --chain <chain>`: Choose blockchain (ethereum, polygon)
- `-o, --output <format>`: Output format (json, csv)
- `-l, --limit <limit>`: Max tokens to check for holders

## Examples

```bash
# Scan CryptoPunks on Ethereum
npm start scan 0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb

# Get Bored Ape holders with limit
npm start holders 0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d --limit 1000

# Scan on Polygon
npm start scan 0x123... --chain polygon
```