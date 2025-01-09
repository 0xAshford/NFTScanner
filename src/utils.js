const fs = require('fs');
const path = require('path');

class Utils {
  static exportToCSV(data, filename, headers = null) {
    try {
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error('No data to export');
      }

      let csvContent = '';
      
      if (headers) {
        csvContent += headers.join(',') + '\n';
      } else if (typeof data[0] === 'object') {
        const keys = Object.keys(data[0]);
        csvContent += keys.join(',') + '\n';
      }
      
      data.forEach(row => {
        if (typeof row === 'object') {
          const values = Object.values(row).map(value => {
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          });
          csvContent += values.join(',') + '\n';
        } else {
          csvContent += row + '\n';
        }
      });
      
      const outputPath = path.resolve(filename);
      fs.writeFileSync(outputPath, csvContent);
      console.log(`Data exported to: ${outputPath}`);
      
      return outputPath;
    } catch (error) {
      console.error('Error exporting to CSV:', error.message);
      return null;
    }
  }

  static exportToJSON(data, filename) {
    try {
      const jsonContent = JSON.stringify(data, null, 2);
      const outputPath = path.resolve(filename);
      fs.writeFileSync(outputPath, jsonContent);
      console.log(`Data exported to: ${outputPath}`);
      return outputPath;
    } catch (error) {
      console.error('Error exporting to JSON:', error.message);
      return null;
    }
  }

  static formatAddress(address) {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  static formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  static generateTimestamp() {
    return new Date().toISOString().replace(/[:.]/g, '-');
  }

  static validateContractAddress(address) {
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(address);
  }
}

module.exports = Utils;