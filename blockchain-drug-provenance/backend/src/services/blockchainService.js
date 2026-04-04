const Web3 = require('web3');
const contract = require('@truffle/contract');
const DrugProvenanceContract = require('../../blockchain/build/contracts/DrugProvenance.json');
const logger = require('../utils/logger');

class BlockchainService {
  constructor() {
    this.web3 = null;
    this.drugProvenanceContract = null;
    this.isInitialized = false;
    this.init();
  }

  /**
   * Initialize blockchain connection
   */
  async init() {
    try {
      // Connect to blockchain provider
      const providerUrl = process.env.BLOCKCHAIN_PROVIDER_URL || 'http://127.0.0.1:8545';
      this.web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));

      // Set up contract
      const DrugProvenance = contract(DrugProvenanceContract);
      DrugProvenance.setProvider(this.web3.currentProvider);

      // Get deployed contract instance
      this.drugProvenanceContract = await DrugProvenance.deployed();
      
      // Test connection
      const blockNumber = await this.web3.eth.getBlockNumber();
      logger.info(`Connected to blockchain at block: ${blockNumber}`);
      
      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize blockchain connection:', error);
      throw new Error('Blockchain initialization failed');
    }
  }

  /**
   * Ensure blockchain is initialized
   */
  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.init();
    }
  }

  /**
   * Get default account for transactions
   */
  async getDefaultAccount() {
    const accounts = await this.web3.eth.getAccounts();
    return accounts[0];
  }

  /**
   * Create a new drug batch on blockchain
   */
  async createBatch(batchData, fromAddress) {
    try {
      await this.ensureInitialized();

      const {
        batchCode,
        drugName,
        manufacturer,
        expiryDate,
        ingredients,
        qualityReport,
        qrCode
      } = batchData;

      logger.info(`Creating batch on blockchain: ${batchCode}`);

      const result = await this.drugProvenanceContract.createBatch(
        batchCode,
        drugName,
        manufacturer,
        expiryDate,
        ingredients,
        qualityReport,
        qrCode,
        {
          from: fromAddress,
          gas: 500000,
          gasPrice: await this.web3.eth.getGasPrice()
        }
      );

      // Extract batch ID from events
      const batchCreatedEvent = result.logs.find(log => log.event === 'BatchCreated');
      const batchId = batchCreatedEvent ? batchCreatedEvent.args.batchId.toNumber() : null;

      logger.info(`Batch created on blockchain with ID: ${batchId}, TX: ${result.tx}`);

      return {
        batchId,
        transactionHash: result.tx,
        blockNumber: result.receipt.blockNumber,
        gasUsed: result.receipt.gasUsed
      };

    } catch (error) {
      logger.error('Error creating batch on blockchain:', error);
      throw new Error(`Blockchain batch creation failed: ${error.message}`);
    }
  }

  /**
   * Transfer batch ownership on blockchain
   */
  async transferBatch(batchId, toAddress, location, description, fromAddress) {
    try {
      await this.ensureInitialized();

      logger.info(`Transferring batch ${batchId} to ${toAddress}`);

      const result = await this.drugProvenanceContract.transferBatch(
        batchId,
        toAddress,
        location,
        description,
        {
          from: fromAddress,
          gas: 300000,
          gasPrice: await this.web3.eth.getGasPrice()
        }
      );

      // Extract event data
      const transferEvent = result.logs.find(log => log.event === 'BatchTransferred');
      const supplyChainEvent = result.logs.find(log => log.event === 'SupplyChainEventAdded');

      logger.info(`Batch transferred on blockchain, TX: ${result.tx}`);

      return {
        transactionHash: result.tx,
        blockNumber: result.receipt.blockNumber,
        gasUsed: result.receipt.gasUsed,
        eventId: supplyChainEvent ? supplyChainEvent.args.batchId.toNumber() : null
      };

    } catch (error) {
      logger.error('Error transferring batch on blockchain:', error);
      throw new Error(`Blockchain batch transfer failed: ${error.message}`);
    }
  }

  /**
   * Update batch status on blockchain
   */
  async updateBatchStatus(batchId, newStatus, location, description, fromAddress) {
    try {
      await this.ensureInitialized();

      // Convert status string to enum number
      const statusMap = {
        'MANUFACTURED': 0,
        'IN_TRANSIT': 1,
        'DELIVERED': 2,
        'IN_HOSPITAL': 3,
        'DISPENSED': 4,
        'EXPIRED': 5,
        'RECALLED': 6
      };

      const statusEnum = statusMap[newStatus];
      if (statusEnum === undefined) {
        throw new Error(`Invalid status: ${newStatus}`);
      }

      logger.info(`Updating batch ${batchId} status to ${newStatus}`);

      const result = await this.drugProvenanceContract.updateBatchStatus(
        batchId,
        statusEnum,
        location,
        description,
        {
          from: fromAddress,
          gas: 200000,
          gasPrice: await this.web3.eth.getGasPrice()
        }
      );

      logger.info(`Batch status updated on blockchain, TX: ${result.tx}`);

      return {
        transactionHash: result.tx,
        blockNumber: result.receipt.blockNumber,
        gasUsed: result.receipt.gasUsed
      };

    } catch (error) {
      logger.error('Error updating batch status on blockchain:', error);
      throw new Error(`Blockchain status update failed: ${error.message}`);
    }
  }

  /**
   * Verify batch on blockchain
   */
  async verifyBatch(batchId, fromAddress) {
    try {
      await this.ensureInitialized();

      logger.info(`Verifying batch ${batchId} on blockchain`);

      const result = await this.drugProvenanceContract.verifyBatch(
        batchId,
        {
          from: fromAddress,
          gas: 100000,
          gasPrice: await this.web3.eth.getGasPrice()
        }
      );

      logger.info(`Batch verified on blockchain, TX: ${result.tx}`);

      return {
        transactionHash: result.tx,
        blockNumber: result.receipt.blockNumber,
        gasUsed: result.receipt.gasUsed
      };

    } catch (error) {
      logger.error('Error verifying batch on blockchain:', error);
      throw new Error(`Blockchain batch verification failed: ${error.message}`);
    }
  }

  /**
   * Recall batch on blockchain
   */
  async recallBatch(batchId, reason, fromAddress) {
    try {
      await this.ensureInitialized();

      logger.info(`Recalling batch ${batchId} on blockchain, reason: ${reason}`);

      const result = await this.drugProvenanceContract.recallBatch(
        batchId,
        reason,
        {
          from: fromAddress,
          gas: 200000,
          gasPrice: await this.web3.eth.getGasPrice()
        }
      );

      logger.info(`Batch recalled on blockchain, TX: ${result.tx}`);

      return {
        transactionHash: result.tx,
        blockNumber: result.receipt.blockNumber,
        gasUsed: result.receipt.gasUsed
      };

    } catch (error) {
      logger.error('Error recalling batch on blockchain:', error);
      throw new Error(`Blockchain batch recall failed: ${error.message}`);
    }
  }

  /**
   * Get batch information from blockchain
   */
  async getBatchInfo(batchId) {
    try {
      await this.ensureInitialized();

      const batch = await this.drugProvenanceContract.drugBatches(batchId);

      return {
        batchId: batch.batchId.toNumber(),
        batchCode: batch.batchCode,
        drugName: batch.drugName,
        manufacturer: batch.manufacturer,
        manufactureDate: new Date(batch.manufactureDate.toNumber() * 1000),
        expiryDate: new Date(batch.expiryDate.toNumber() * 1000),
        ingredients: batch.ingredients,
        qualityReport: batch.qualityReport,
        status: batch.status,
        currentHolder: batch.currentHolder,
        isVerified: batch.isVerified,
        qrCode: batch.qrCode,
        createdAt: new Date(batch.createdAt.toNumber() * 1000)
      };

    } catch (error) {
      logger.error('Error getting batch info from blockchain:', error);
      throw new Error(`Failed to get batch info: ${error.message}`);
    }
  }

  /**
   * Get supply chain history from blockchain
   */
  async getSupplyChainHistory(batchId) {
    try {
      await this.ensureInitialized();

      const history = await this.drugProvenanceContract.getSupplyChainHistory(batchId);

      return history.map(event => ({
        batchId: event.batchId.toNumber(),
        from: event.from,
        to: event.to,
        location: event.location,
        description: event.description,
        newStatus: event.newStatus,
        timestamp: new Date(event.timestamp.toNumber() * 1000),
        additionalData: event.additionalData
      }));

    } catch (error) {
      logger.error('Error getting supply chain history from blockchain:', error);
      throw new Error(`Failed to get supply chain history: ${error.message}`);
    }
  }

  /**
   * Verify batch authenticity by batch code
   */
  async verifyBatchAuthenticity(batchCode) {
    try {
      await this.ensureInitialized();

      const result = await this.drugProvenanceContract.verifyBatchAuthenticity(batchCode);

      return {
        authentic: result.authentic,
        batch: result.batch ? {
          batchId: result.batch.batchId.toNumber(),
          batchCode: result.batch.batchCode,
          drugName: result.batch.drugName,
          manufacturer: result.batch.manufacturer,
          manufactureDate: new Date(result.batch.manufactureDate.toNumber() * 1000),
          expiryDate: new Date(result.batch.expiryDate.toNumber() * 1000),
          status: result.batch.status,
          isVerified: result.batch.isVerified
        } : null
      };

    } catch (error) {
      logger.error('Error verifying batch authenticity:', error);
      throw new Error(`Failed to verify batch authenticity: ${error.message}`);
    }
  }

  /**
   * Get system statistics from blockchain
   */
  async getSystemStats() {
    try {
      await this.ensureInitialized();

      const stats = await this.drugProvenanceContract.getSystemStats();

      return {
        totalBatches: stats.totalBatches.toNumber(),
        verifiedBatches: stats.verifiedBatches.toNumber(),
        recalledBatches: stats.recalledBatches.toNumber(),
        expiredBatches: stats.expiredBatches.toNumber()
      };

    } catch (error) {
      logger.error('Error getting system stats from blockchain:', error);
      throw new Error(`Failed to get system stats: ${error.message}`);
    }
  }

  /**
   * Register new user on blockchain
   */
  async registerUser(userAddress, name, contactInfo, role, fromAddress) {
    try {
      await this.ensureInitialized();

      // Convert role string to enum number
      const roleMap = {
        'PATIENT': 0,
        'MANUFACTURER': 1,
        'DISTRIBUTOR': 2,
        'HOSPITAL': 3,
        'ADMIN': 4
      };

      const roleEnum = roleMap[role];
      if (roleEnum === undefined) {
        throw new Error(`Invalid role: ${role}`);
      }

      logger.info(`Registering user ${userAddress} with role ${role} on blockchain`);

      const result = await this.drugProvenanceContract.registerUser(
        userAddress,
        name,
        contactInfo,
        roleEnum,
        {
          from: fromAddress,
          gas: 200000,
          gasPrice: await this.web3.eth.getGasPrice()
        }
      );

      logger.info(`User registered on blockchain, TX: ${result.tx}`);

      return {
        transactionHash: result.tx,
        blockNumber: result.receipt.blockNumber,
        gasUsed: result.receipt.gasUsed
      };

    } catch (error) {
      logger.error('Error registering user on blockchain:', error);
      throw new Error(`Blockchain user registration failed: ${error.message}`);
    }
  }

  /**
   * Get user batches from blockchain
   */
  async getUserBatches(userAddress) {
    try {
      await this.ensureInitialized();

      const batchIds = await this.drugProvenanceContract.getUserBatches(userAddress);

      return batchIds.map(id => id.toNumber());

    } catch (error) {
      logger.error('Error getting user batches from blockchain:', error);
      throw new Error(`Failed to get user batches: ${error.message}`);
    }
  }

  /**
   * Check if service is connected to blockchain
   */
  isConnected() {
    return this.isInitialized && this.web3 && this.drugProvenanceContract;
  }

  /**
   * Get current block number
   */
  async getCurrentBlock() {
    try {
      await this.ensureInitialized();
      return await this.web3.eth.getBlockNumber();
    } catch (error) {
      logger.error('Error getting current block:', error);
      throw error;
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash) {
    try {
      await this.ensureInitialized();
      return await this.web3.eth.getTransactionReceipt(txHash);
    } catch (error) {
      logger.error('Error getting transaction receipt:', error);
      throw error;
    }
  }
}

// Create singleton instance
const blockchainService = new BlockchainService();

module.exports = blockchainService;