import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RocketLaunchIcon,
  ArrowPathIcon,
  CubeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  AdjustmentsHorizontalIcon,
  BoltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import apiService from '../services/api';
import { getErrorMessage } from '../utils/errorHandling';

export default function PumpExistingToken({ onLaunch }) {
  const [settings, setSettings] = useState({});
  const [mintAddress, setMintAddress] = useState('');
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [status, setStatus] = useState('');
  const [strategyPreset, setStrategyPreset] = useState('balanced');
  const [preflightRunning, setPreflightRunning] = useState(false);
  const [preflightChecks, setPreflightChecks] = useState([]);
  const [maxTotalSpendSol, setMaxTotalSpendSol] = useState('1.5');
  const [minimumWalletsRequired, setMinimumWalletsRequired] = useState('8');

  const [walletMode, setWalletMode] = useState('auto');
  const [bundleWalletCount, setBundleWalletCount] = useState('10');
  const [holderWalletCount, setHolderWalletCount] = useState('10');
  const [fundingMethod, setFundingMethod] = useState('mixing');

  const [pumpAmountPerWallet, setPumpAmountPerWallet] = useState('0.01');
  const [bundleSwapAmounts, setBundleSwapAmounts] = useState('');
  const [holderSwapAmounts, setHolderSwapAmounts] = useState('');
  const [randomIntervalMin, setRandomIntervalMin] = useState('10');
  const [randomIntervalMax, setRandomIntervalMax] = useState('60');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [minSellPercentage, setMinSellPercentage] = useState('10');
  const [maxSellPercentage, setMaxSellPercentage] = useState('50');

  const [autoSellEnabled, setAutoSellEnabled] = useState(false);
  const [autoSellProfitPercent, setAutoSellProfitPercent] = useState('25');
  const [autoSellMode, setAutoSellMode] = useState('full');
  const [websocketTrackingEnabled, setWebsocketTrackingEnabled] = useState(false);
  const [externalBuyThreshold, setExternalBuyThreshold] = useState('1.0');
  const [externalBuyWindow, setExternalBuyWindow] = useState('60');

  const [mevProtectionEnabled, setMevProtectionEnabled] = useState(true);
  const [mevConfirmationDelaySec, setMevConfirmationDelaySec] = useState('3');
  const [mevLaunchCooldownSec, setMevLaunchCooldownSec] = useState('5');
  const [mevRapidWindowSec, setMevRapidWindowSec] = useState('10');

  const [bundleIntermediaryHops, setBundleIntermediaryHops] = useState('2');
  const [holderIntermediaryHops, setHolderIntermediaryHops] = useState('2');
  const [globalIntermediaryHops, setGlobalIntermediaryHops] = useState('2');

  const [useJitoForSells, setUseJitoForSells] = useState(true);
  const [jitoSellTip, setJitoSellTip] = useState('0.0035');
  const [rapidSellPriorityFee, setRapidSellPriorityFee] = useState('7000000');
  const [holderPriorityFee, setHolderPriorityFee] = useState('100000');

  const effectiveWalletTarget = useMemo(() => {
    if (walletMode === 'auto') {
      return (parseInt(bundleWalletCount, 10) || 0) + (parseInt(holderWalletCount, 10) || 0);
    }
    return 'ALL';
  }, [walletMode, bundleWalletCount, holderWalletCount]);

  const makeAmountsString = (count, amount) => {
    const safeCount = Math.max(0, parseInt(count, 10) || 0);
    const safeAmount = String(amount || '').trim();
    if (safeCount === 0 || !safeAmount) return '';
    return Array.from({ length: safeCount }).map(() => safeAmount).join(',');
  };

  const loadCurrentToken = useCallback(async () => {
    try {
      const runRes = await apiService.getCurrentRun();
      const currentMint = runRes?.data?.data?.mintAddress;
      setMintAddress(typeof currentMint === 'string' ? currentMint : '');
    } catch {
      // Non-blocking: keep manual input workflow available
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiService.getSettings();
        const loadedSettings = res.data.settings || {};
        setSettings(loadedSettings);

        setBundleWalletCount(String(loadedSettings.BUNDLE_WALLET_COUNT || '10'));
        setHolderWalletCount(String(loadedSettings.HOLDER_WALLET_COUNT || '10'));

        const minBuy = loadedSettings.VOLUME_MAKER_MIN_BUY_AMOUNT || loadedSettings.SWAP_AMOUNT || '0.01';
        setPumpAmountPerWallet(String(minBuy));
        setBundleSwapAmounts(String(loadedSettings.BUNDLE_SWAP_AMOUNTS || ''));
        setHolderSwapAmounts(String(loadedSettings.HOLDER_SWAP_AMOUNTS || ''));

        setRandomIntervalMin(String(loadedSettings.VOLUME_MAKER_MIN_INTERVAL_SECONDS || '10'));
        setRandomIntervalMax(String(loadedSettings.VOLUME_MAKER_MAX_INTERVAL_SECONDS || '60'));
        setDurationMinutes(String(loadedSettings.VOLUME_MAKER_DURATION_MINUTES || '30'));
        setMinSellPercentage(String(loadedSettings.VOLUME_MAKER_MIN_SELL_PERCENTAGE || '10'));
        setMaxSellPercentage(String(loadedSettings.VOLUME_MAKER_MAX_SELL_PERCENTAGE || '50'));

        setAutoSellEnabled((loadedSettings.AUTO_SELL_ENABLED === 'true') || (loadedSettings.AUTO_SELL_ENABLED === true));
        setAutoSellProfitPercent(String(loadedSettings.EXISTING_TOKEN_AUTO_SELL_PROFIT_PERCENT || '25'));
        setWebsocketTrackingEnabled((loadedSettings.WEBSOCKET_TRACKING_ENABLED === 'true') || (loadedSettings.WEBSOCKET_TRACKING_ENABLED === true));
        setExternalBuyThreshold(String(loadedSettings.WEBSOCKET_EXTERNAL_BUY_THRESHOLD || '1.0'));
        setExternalBuyWindow(String(loadedSettings.WEBSOCKET_EXTERNAL_BUY_WINDOW || '60'));

        setMevProtectionEnabled((loadedSettings.AUTO_SELL_MEV_ENABLED !== 'false') && (loadedSettings.AUTO_SELL_MEV_ENABLED !== false));
        setMevConfirmationDelaySec(String(loadedSettings.AUTO_SELL_MEV_CONFIRMATION_DELAY || '3'));
        setMevLaunchCooldownSec(String(loadedSettings.AUTO_SELL_MEV_LAUNCH_COOLDOWN || '5'));
        setMevRapidWindowSec(String(loadedSettings.AUTO_SELL_MEV_RAPID_WINDOW || '10'));

        setBundleIntermediaryHops(String(loadedSettings.BUNDLE_INTERMEDIARY_HOPS || '2'));
        setHolderIntermediaryHops(String(loadedSettings.HOLDER_INTERMEDIARY_HOPS || '2'));
        setGlobalIntermediaryHops(String(loadedSettings.NUM_INTERMEDIARY_HOPS || '2'));

        setUseJitoForSells((loadedSettings.USE_JITO_FOR_SELLS === 'true') || (loadedSettings.USE_JITO_FOR_SELLS === true));
        setJitoSellTip(String(loadedSettings.JITO_SELL_TIP || '0.0035'));
        setRapidSellPriorityFee(String(loadedSettings.RAPID_SELL_PRIORITY_FEE || '7000000'));
        setHolderPriorityFee(String(loadedSettings.HOLDER_WALLET_PRIORITY_FEE || '100000'));

        if ((loadedSettings.AUTO_SELL_STAGED === 'true') || (loadedSettings.AUTO_SELL_STAGED === true)) {
          setAutoSellMode('staged');
        } else if ((loadedSettings.AUTO_SELL_50_PERCENT === 'true') || (loadedSettings.AUTO_SELL_50_PERCENT === true)) {
          setAutoSellMode('half');
        } else {
          setAutoSellMode('full');
        }

        const isDirect = loadedSettings.DIRECT_SEND_MODE === 'true' || loadedSettings.DIRECT_SEND_MODE === true;
        const isMulti = loadedSettings.USE_MULTI_INTERMEDIARY_SYSTEM === 'true' || loadedSettings.USE_MULTI_INTERMEDIARY_SYSTEM === true;
        if (isDirect) setFundingMethod('direct');
        else if (isMulti) setFundingMethod('multi');
        else setFundingMethod('mixing');
      } catch (error) {
        setStatus(`Failed to load settings: ${error.message}`);
      } finally {
        setLoadingSettings(false);
      }
    };

    load();
    loadCurrentToken();

    const handleActiveTokenCleared = () => {
      setMintAddress('');
      setStatus('Active token cleared.');
    };

    const handleActiveTokenUpdated = () => {
      loadCurrentToken();
    };

    window.addEventListener('active-token-cleared', handleActiveTokenCleared);
    window.addEventListener('active-token-updated', handleActiveTokenUpdated);

    return () => {
      window.removeEventListener('active-token-cleared', handleActiveTokenCleared);
      window.removeEventListener('active-token-updated', handleActiveTokenUpdated);
    };
  }, [loadCurrentToken]);

  const applyPreset = (preset) => {
    setStrategyPreset(preset);

    if (preset === 'safe') {
      setWalletMode('auto');
      setBundleWalletCount('6');
      setHolderWalletCount('6');
      setPumpAmountPerWallet('0.0075');
      setRandomIntervalMin('20');
      setRandomIntervalMax('90');
      setDurationMinutes('20');
      setMinSellPercentage('8');
      setMaxSellPercentage('25');
      setAutoSellEnabled(true);
      setAutoSellProfitPercent('18');
      setAutoSellMode('half');
      setWebsocketTrackingEnabled(false);
      return;
    }

    if (preset === 'aggressive') {
      setWalletMode('auto');
      setBundleWalletCount('16');
      setHolderWalletCount('16');
      setPumpAmountPerWallet('0.02');
      setRandomIntervalMin('5');
      setRandomIntervalMax('25');
      setDurationMinutes('45');
      setMinSellPercentage('20');
      setMaxSellPercentage('65');
      setAutoSellEnabled(true);
      setAutoSellProfitPercent('35');
      setAutoSellMode('full');
      setWebsocketTrackingEnabled(true);
      return;
    }

    setWalletMode('auto');
    setBundleWalletCount('10');
    setHolderWalletCount('10');
    setPumpAmountPerWallet('0.01');
    setRandomIntervalMin('10');
    setRandomIntervalMax('60');
    setDurationMinutes('30');
    setMinSellPercentage('10');
    setMaxSellPercentage('50');
    setAutoSellEnabled(true);
    setAutoSellProfitPercent('25');
    setAutoSellMode('full');
    setWebsocketTrackingEnabled(false);

    if (preset === 'safe') {
      setMaxTotalSpendSol('0.8');
      setMinimumWalletsRequired('6');
    } else if (preset === 'aggressive') {
      setMaxTotalSpendSol('4');
      setMinimumWalletsRequired('16');
    } else {
      setMaxTotalSpendSol('1.5');
      setMinimumWalletsRequired('8');
    }
  };

  const runPreflight = async () => {
    setPreflightRunning(true);
    setStatus('Running preflight checks...');

    const checks = [];

    try {
      const mint = (mintAddress || '').trim();
      const mintLooksValid = mint.length >= 32 && mint.length <= 50;
      checks.push({
        key: 'mint',
        label: 'Token mint format',
        status: mintLooksValid ? 'pass' : 'fail',
        detail: mintLooksValid ? 'Mint address format looks valid.' : 'Mint address is missing or invalid.',
      });

      const deployerRes = await apiService.getDeployerWallet();
      const deployerBalance = Number(deployerRes?.data?.balance || 0);
      checks.push({
        key: 'deployer',
        label: 'Deployer wallet balance',
        status: deployerBalance > 0.01 ? 'pass' : 'warn',
        detail: `Current balance: ${deployerBalance.toFixed(4)} SOL`,
      });

      const walletsRes = await apiService.getWarmingWallets();
      const warmedWalletsCount = Array.isArray(walletsRes?.data?.wallets) ? walletsRes.data.wallets.length : 0;
      const minRequired = parseInt(minimumWalletsRequired, 10) || 0;
      checks.push({
        key: 'wallets',
        label: 'Warmed wallets availability',
        status: warmedWalletsCount >= minRequired ? 'pass' : 'warn',
        detail: `Available: ${warmedWalletsCount}, minimum required: ${minRequired}`,
      });

      const totalWalletsTarget = walletMode === 'auto'
        ? (parseInt(bundleWalletCount, 10) || 0) + (parseInt(holderWalletCount, 10) || 0)
        : warmedWalletsCount;
      const estimatedSpend = totalWalletsTarget * (parseFloat(pumpAmountPerWallet) || 0);
      const hardCap = parseFloat(maxTotalSpendSol) || 0;
      checks.push({
        key: 'risk',
        label: 'Risk guardrail (max total spend)',
        status: hardCap <= 0 || estimatedSpend <= hardCap ? 'pass' : 'fail',
        detail: `Estimated spend: ${estimatedSpend.toFixed(4)} SOL, guardrail: ${hardCap.toFixed(4)} SOL`,
      });

      const failCount = checks.filter((check) => check.status === 'fail').length;
      setStatus(failCount === 0 ? 'Preflight passed.' : `Preflight found ${failCount} blocking issue(s).`);
    } catch (error) {
      setStatus(`Preflight failed: ${getErrorMessage(error, 'Unable to complete checks')}`);
      checks.push({
        key: 'preflight-error',
        label: 'Preflight execution',
        status: 'fail',
        detail: getErrorMessage(error, 'Unable to complete checks'),
      });
    } finally {
      setPreflightChecks(checks);
      setPreflightRunning(false);
    }
  };

  const handleClearToken = async () => {
    try {
      await apiService.clearActiveToken();
      setMintAddress('');
      setStatus('Active token cleared from current run and settings.');
      window.dispatchEvent(new Event('active-token-cleared'));
    } catch (error) {
      setStatus(`Failed to clear active token: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleLaunchPump = async () => {
    const addr = (mintAddress || '').trim();
    if (!addr || addr.length < 32 || addr.length > 50) {
      setStatus('Enter a valid token mint address.');
      return;
    }

    const pumpAmount = parseFloat(pumpAmountPerWallet);
    const intervalMin = parseFloat(randomIntervalMin);
    const intervalMax = parseFloat(randomIntervalMax);
    const duration = parseFloat(durationMinutes);
    const minSell = parseFloat(minSellPercentage);
    const maxSell = parseFloat(maxSellPercentage);
    const bundleCount = parseInt(bundleWalletCount, 10) || 0;
    const holderCount = parseInt(holderWalletCount, 10) || 0;
    const autoSellPercent = parseFloat(autoSellProfitPercent);
    const autoSellThresholdSol = autoSellPercent / 100;
    const maxSpendCap = parseFloat(maxTotalSpendSol);
    const minWallets = parseInt(minimumWalletsRequired, 10) || 0;

    if (isNaN(pumpAmount) || pumpAmount <= 0) {
      setStatus('Pump amount per wallet must be greater than 0.');
      return;
    }

    if (isNaN(intervalMin) || isNaN(intervalMax) || intervalMin <= 0 || intervalMax <= 0 || intervalMin > intervalMax) {
      setStatus('Random buy interval is invalid. Ensure min/max are > 0 and min <= max.');
      return;
    }

    if (isNaN(duration) || duration <= 0) {
      setStatus('Pumping duration must be greater than 0 minutes.');
      return;
    }

    if (isNaN(minSell) || isNaN(maxSell) || minSell < 0 || maxSell < 0 || minSell > maxSell) {
      setStatus('Sell percentage range is invalid. Ensure min <= max and values are not negative.');
      return;
    }

    if (walletMode === 'auto' && bundleCount + holderCount <= 0) {
      setStatus('For auto wallet mode, set bundle or holder wallet count above 0.');
      return;
    }

    if (autoSellEnabled && (isNaN(autoSellPercent) || autoSellPercent <= 0)) {
      setStatus('Auto-sell profit % must be greater than 0 when auto-sell is enabled.');
      return;
    }

    const totalWalletsTarget = walletMode === 'auto' ? (bundleCount + holderCount) : 0;
    const estimatedTotalSpend = Math.max(0, totalWalletsTarget) * pumpAmount;

    if (!isNaN(maxSpendCap) && maxSpendCap > 0 && estimatedTotalSpend > maxSpendCap) {
      setStatus(`Risk guardrail triggered: estimated spend ${estimatedTotalSpend.toFixed(4)} SOL exceeds max ${maxSpendCap.toFixed(4)} SOL.`);
      return;
    }

    if (walletMode === 'auto' && minWallets > 0 && totalWalletsTarget < minWallets) {
      setStatus(`Minimum wallets guardrail: target ${totalWalletsTarget} is below required minimum ${minWallets}.`);
      return;
    }

    setLaunching(true);
    setStatus('Applying pumping configuration...');

    try {
      const fundingSettings =
        fundingMethod === 'direct'
          ? {
              DIRECT_SEND_MODE: 'true',
              USE_MIXING_WALLETS: 'false',
              USE_MULTI_INTERMEDIARY_SYSTEM: 'false',
            }
          : fundingMethod === 'multi'
            ? {
                DIRECT_SEND_MODE: 'false',
                USE_MIXING_WALLETS: 'true',
                USE_MULTI_INTERMEDIARY_SYSTEM: 'true',
              }
            : {
                DIRECT_SEND_MODE: 'false',
                USE_MIXING_WALLETS: 'true',
                USE_MULTI_INTERMEDIARY_SYSTEM: 'false',
              };

      const settingsUpdates = {
        ...fundingSettings,
        BUNDLE_WALLET_COUNT: String(walletMode === 'auto' ? bundleCount : (settings.BUNDLE_WALLET_COUNT || bundleCount)),
        HOLDER_WALLET_COUNT: String(walletMode === 'auto' ? holderCount : (settings.HOLDER_WALLET_COUNT || holderCount)),
        BUNDLE_SWAP_AMOUNTS: bundleSwapAmounts.trim() || makeAmountsString(bundleCount, pumpAmount),
        HOLDER_SWAP_AMOUNTS: holderSwapAmounts.trim() || makeAmountsString(holderCount, pumpAmount),
        SWAP_AMOUNT: String(pumpAmount),
        HOLDER_WALLET_AMOUNT: String(pumpAmount),
        HOLDER_WALLET_PRIORITY_FEE: String(parseInt(holderPriorityFee, 10) || 100000),
        BUNDLE_INTERMEDIARY_HOPS: String(parseInt(bundleIntermediaryHops, 10) || 0),
        HOLDER_INTERMEDIARY_HOPS: String(parseInt(holderIntermediaryHops, 10) || 0),
        NUM_INTERMEDIARY_HOPS: String(parseInt(globalIntermediaryHops, 10) || 0),
        VOLUME_MAKER_ENABLED: 'true',
        VOLUME_MAKER_DURATION_MINUTES: String(duration),
        VOLUME_MAKER_MIN_BUY_AMOUNT: String(pumpAmount),
        VOLUME_MAKER_MAX_BUY_AMOUNT: String(pumpAmount),
        VOLUME_MAKER_MIN_INTERVAL_SECONDS: String(intervalMin),
        VOLUME_MAKER_MAX_INTERVAL_SECONDS: String(intervalMax),
        VOLUME_MAKER_MIN_SELL_PERCENTAGE: String(minSell),
        VOLUME_MAKER_MAX_SELL_PERCENTAGE: String(maxSell),
        AUTO_SELL_ENABLED: autoSellEnabled ? 'true' : 'false',
        AUTO_SELL_50_PERCENT: autoSellEnabled && autoSellMode === 'half' ? 'true' : 'false',
        AUTO_SELL_STAGED: autoSellEnabled && autoSellMode === 'staged' ? 'true' : 'false',
        AUTO_RAPID_SELL: autoSellEnabled ? 'true' : 'false',
        AUTO_SELL_DEFAULT_THRESHOLD: String(autoSellEnabled ? autoSellThresholdSol : 0),
        AUTO_SELL_MEV_ENABLED: mevProtectionEnabled ? 'true' : 'false',
        AUTO_SELL_MEV_CONFIRMATION_DELAY: String(parseFloat(mevConfirmationDelaySec) || 3),
        AUTO_SELL_MEV_LAUNCH_COOLDOWN: String(parseFloat(mevLaunchCooldownSec) || 5),
        AUTO_SELL_MEV_RAPID_WINDOW: String(parseFloat(mevRapidWindowSec) || 10),
        WEBSOCKET_TRACKING_ENABLED: websocketTrackingEnabled ? 'true' : 'false',
        WEBSOCKET_EXTERNAL_BUY_THRESHOLD: String(parseFloat(externalBuyThreshold) || 1),
        WEBSOCKET_EXTERNAL_BUY_WINDOW: String(parseFloat(externalBuyWindow) || 60),
        USE_JITO_FOR_SELLS: useJitoForSells ? 'true' : 'false',
        JITO_SELL_TIP: String(parseFloat(jitoSellTip) || 0.0035),
        RAPID_SELL_PRIORITY_FEE: String(parseInt(rapidSellPriorityFee, 10) || 7000000),
        EXISTING_TOKEN_AUTO_SELL_PROFIT_PERCENT: String(autoSellEnabled ? autoSellPercent : 0),
      };

      await apiService.updateSettings(settingsUpdates);

      if (mevProtectionEnabled) {
        await apiService.setMevProtection({
          confirmationDelaySec: parseFloat(mevConfirmationDelaySec) || 3,
          launchCooldownSec: parseFloat(mevLaunchCooldownSec) || 5,
        });
      }

      setStatus('Preparing current run for existing token...');
      let setActiveRes = await apiService.setActiveToken(addr, walletMode === 'all-wallets' ? 'all-wallets' : 'auto');

      if (walletMode === 'auto') {
        const wanted = bundleCount + holderCount;
        const currentTotal = setActiveRes?.data?.summary?.totalWallets || 0;
        if (wanted > 0 && currentTotal < wanted) {
          const missing = wanted - currentTotal;
          setStatus(`Auto-generating ${missing} wallet(s)...`);
          for (let index = 0; index < missing; index += 1) {
            await apiService.createWarmingWallet(['holder']);
          }
          setActiveRes = await apiService.setActiveToken(addr, 'auto');
        }
      }

      const totalWallets = setActiveRes?.data?.summary?.totalWallets || 0;
      if (totalWallets > 0) {
        await apiService.updateSettings({ VOLUME_MAKER_WALLET_COUNT: String(totalWallets) });
      }

      if (autoSellEnabled) {
        setStatus('Configuring auto-sell per wallet...');
        const walletsRes = await apiService.getHolderWallets();
        const wallets = walletsRes?.data?.wallets || [];
        const walletConfigMap = {};
        wallets.forEach((wallet) => {
          if (wallet?.address) {
            walletConfigMap[wallet.address] = { threshold: autoSellThresholdSol };
          }
        });

        if (Object.keys(walletConfigMap).length > 0) {
          await apiService.configureAllAutoSell(walletConfigMap, true);
        }
      } else {
        await apiService.toggleAutoSell(false);
      }

      setStatus('Starting pumping with current settings config...');
      await apiService.executeCommand('volume-maker');
      setStatus('Pumping started successfully.');
      if (onLaunch) onLaunch();
      window.dispatchEvent(new Event('active-token-updated'));
    } catch (error) {
      setStatus(`Launch failed: ${getErrorMessage(error, 'Unknown launch error')}`);
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-3">
          <RocketLaunchIcon className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-bold text-white">Pump Existing Token</h2>
        </div>
        <p className="text-sm text-gray-400 mb-4">Use an existing token mint and start pumping with your current settings.</p>

        <label className="block text-sm text-gray-300 mb-2">Token Mint Address</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={mintAddress}
            onChange={(e) => setMintAddress(e.target.value)}
            placeholder="Paste existing token mint address..."
            className="flex-1 px-4 py-2 bg-black/50 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-mono text-sm"
          />
          <button
            type="button"
            onClick={loadCurrentToken}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 rounded-lg text-sm"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={handleClearToken}
            disabled={!mintAddress}
            className="px-3 py-2 bg-red-900/40 hover:bg-red-800/50 disabled:opacity-50 border border-red-700/50 text-red-200 rounded-lg text-sm"
          >
            Clear Token
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">Clearing token removes it from current run so Trading Terminal and Pump Existing Token refresh together.</p>
      </div>

      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <CubeIcon className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Pumping Configuration</h3>
        </div>

        {loadingSettings ? (
          <div className="text-sm text-gray-400 flex items-center gap-2">
            <ArrowPathIcon className="w-4 h-4 animate-spin" />
            Loading settings...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-black/40 border border-gray-800 rounded-lg md:col-span-2">
              <div className="text-gray-300 font-medium mb-2">Quick Strategy Presets</div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('safe')}
                  className={`px-3 py-1.5 rounded border text-xs ${strategyPreset === 'safe' ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'}`}
                >
                  Safe
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('balanced')}
                  className={`px-3 py-1.5 rounded border text-xs ${strategyPreset === 'balanced' ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'}`}
                >
                  Balanced
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('aggressive')}
                  className={`px-3 py-1.5 rounded border text-xs ${strategyPreset === 'aggressive' ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'}`}
                >
                  Aggressive
                </button>
              </div>
            </div>

            <div className="p-3 bg-black/40 border border-gray-800 rounded-lg md:col-span-2">
              <div className="text-gray-300 font-medium mb-2">Advanced Risk Guardrails</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <div className="text-gray-400 mb-1">Max Total Spend (SOL)</div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={maxTotalSpendSol}
                    onChange={(e) => setMaxTotalSpendSol(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                  />
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Minimum Wallets Required</div>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={minimumWalletsRequired}
                    onChange={(e) => setMinimumWalletsRequired(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-black/40 border border-gray-800 rounded-lg md:col-span-2">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="text-gray-300 font-medium">Preflight Validation</div>
                <button
                  type="button"
                  onClick={runPreflight}
                  disabled={preflightRunning}
                  className="px-3 py-1.5 rounded border text-xs bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700 disabled:opacity-60 flex items-center gap-1"
                >
                  {preflightRunning ? <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" /> : <CheckCircleIcon className="w-3.5 h-3.5" />}
                  {preflightRunning ? 'Running...' : 'Run Checks'}
                </button>
              </div>

              {preflightChecks.length === 0 ? (
                <div className="text-xs text-gray-500">Run preflight checks to validate mint, wallets, balance, and guardrails before launch.</div>
              ) : (
                <div className="space-y-2">
                  {preflightChecks.map((check) => (
                    <div key={check.key} className={`px-3 py-2 rounded border text-xs ${check.status === 'pass' ? 'bg-emerald-900/20 border-emerald-700/40 text-emerald-200' : check.status === 'warn' ? 'bg-amber-900/20 border-amber-700/40 text-amber-200' : 'bg-red-900/20 border-red-700/40 text-red-200'}`}>
                      <div className="flex items-center gap-2 font-medium">
                        {check.status === 'fail' ? <ExclamationTriangleIcon className="w-3.5 h-3.5" /> : <CheckCircleIcon className="w-3.5 h-3.5" />}
                        <span>{check.label}</span>
                      </div>
                      <div className="opacity-85 mt-0.5">{check.detail}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 bg-black/40 border border-gray-800 rounded-lg md:col-span-2">
              <div className="text-gray-400 mb-2">Wallet Mode</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setWalletMode('all-wallets')}
                  className={`px-3 py-1.5 rounded border text-xs ${walletMode === 'all-wallets' ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'}`}
                >
                  Use All Wallets
                </button>
                <button
                  type="button"
                  onClick={() => setWalletMode('auto')}
                  className={`px-3 py-1.5 rounded border text-xs ${walletMode === 'auto' ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'}`}
                >
                  Auto Generate by Settings
                </button>
              </div>
              <div className="mt-2 text-xs text-cyan-300">Effective wallet target: {effectiveWalletTarget}</div>
            </div>

            {walletMode === 'auto' && (
              <>
                <div className="p-3 bg-black/40 border border-gray-800 rounded-lg">
                  <div className="text-gray-400 mb-1">Bundle Wallet Count</div>
                  <input
                    type="number"
                    min="0"
                    value={bundleWalletCount}
                    onChange={(e) => setBundleWalletCount(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                  />
                </div>
                <div className="p-3 bg-black/40 border border-gray-800 rounded-lg">
                  <div className="text-gray-400 mb-1">Holder Wallet Count</div>
                  <input
                    type="number"
                    min="0"
                    value={holderWalletCount}
                    onChange={(e) => setHolderWalletCount(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                  />
                </div>
              </>
            )}

            <div className="p-3 bg-black/40 border border-gray-800 rounded-lg md:col-span-2">
              <div className="text-gray-400 mb-1">Funding Method</div>
              <select
                value={fundingMethod}
                onChange={(e) => setFundingMethod(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
              >
                <option value="direct">Direct Send</option>
                <option value="mixing">Mixing Wallets</option>
                <option value="multi">Multi-Intermediary</option>
              </select>
            </div>

            <div className="p-3 bg-black/40 border border-gray-800 rounded-lg md:col-span-2">
              <div className="flex items-center gap-2 text-gray-300 font-medium mb-2">
                <AdjustmentsHorizontalIcon className="w-4 h-4 text-cyan-400" />
                Wallet Routing
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="text-gray-400 mb-1">Bundle Hops</div>
                  <input type="number" min="0" max="5" step="1" value={bundleIntermediaryHops} onChange={(e) => setBundleIntermediaryHops(e.target.value)} className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white" />
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Holder Hops</div>
                  <input type="number" min="0" max="5" step="1" value={holderIntermediaryHops} onChange={(e) => setHolderIntermediaryHops(e.target.value)} className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white" />
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Global Hops</div>
                  <input type="number" min="0" max="5" step="1" value={globalIntermediaryHops} onChange={(e) => setGlobalIntermediaryHops(e.target.value)} className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white" />
                </div>
              </div>
            </div>

            <div className="p-3 bg-black/40 border border-gray-800 rounded-lg">
              <div className="text-gray-400 mb-1">Pumping Amount Per Wallet (SOL)</div>
              <input
                type="number"
                min="0.0001"
                step="0.0001"
                value={pumpAmountPerWallet}
                onChange={(e) => setPumpAmountPerWallet(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
              />
            </div>

            <div className="p-3 bg-black/40 border border-gray-800 rounded-lg">
              <div className="text-gray-400 mb-1">Duration (minutes)</div>
              <input
                type="number"
                min="1"
                step="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
              />
            </div>

            <div className="p-3 bg-black/40 border border-gray-800 rounded-lg">
              <div className="text-gray-400 mb-1">Random Buy Interval (seconds)</div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={randomIntervalMin}
                  onChange={(e) => setRandomIntervalMin(e.target.value)}
                  placeholder="Min"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                />
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={randomIntervalMax}
                  onChange={(e) => setRandomIntervalMax(e.target.value)}
                  placeholder="Max"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                />
              </div>
            </div>

            <div className="p-3 bg-black/40 border border-gray-800 rounded-lg">
              <div className="text-gray-400 mb-1">Random Sell % Range</div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={minSellPercentage}
                  onChange={(e) => setMinSellPercentage(e.target.value)}
                  placeholder="Min %"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                />
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={maxSellPercentage}
                  onChange={(e) => setMaxSellPercentage(e.target.value)}
                  placeholder="Max %"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                />
              </div>
            </div>

            <div className="p-3 bg-black/40 border border-gray-800 rounded-lg md:col-span-2">
              <div className="text-gray-400 mb-1">Per-Wallet Amount Overrides (comma-separated)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={bundleSwapAmounts}
                  onChange={(e) => setBundleSwapAmounts(e.target.value)}
                  placeholder="Bundle: 0.4,0.5,0.6"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                />
                <input
                  type="text"
                  value={holderSwapAmounts}
                  onChange={(e) => setHolderSwapAmounts(e.target.value)}
                  placeholder="Holder: 0.1,0.1,0.2"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                />
              </div>
            </div>

            <div className="p-3 bg-black/40 border border-gray-800 rounded-lg md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <div className="text-gray-300 font-medium">Auto Sell</div>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={autoSellEnabled}
                    onChange={(e) => setAutoSellEnabled(e.target.checked)}
                    className="w-4 h-4"
                  />
                  Enabled
                </label>
              </div>
              {autoSellEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <div className="text-gray-400 mb-1">Auto Sell Profit % Per Wallet</div>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={autoSellProfitPercent}
                      onChange={(e) => setAutoSellProfitPercent(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                    />
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">Auto Sell Mode</div>
                    <select
                      value={autoSellMode}
                      onChange={(e) => setAutoSellMode(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                    >
                      <option value="full">Rapid Sell All</option>
                      <option value="half">Sell 50%</option>
                      <option value="staged">Staged Sell</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-black/40 border border-gray-800 rounded-lg md:col-span-2">
              <div className="flex items-center gap-2 mb-2 text-gray-300 font-medium">
                <BoltIcon className="w-4 h-4 text-yellow-400" />
                Real-time Triggering
              </div>
              <div className="flex items-center gap-2 mb-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={websocketTrackingEnabled}
                  onChange={(e) => setWebsocketTrackingEnabled(e.target.checked)}
                  className="w-4 h-4"
                />
                Enable WebSocket external-buy tracking
              </div>
              {websocketTrackingEnabled && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-gray-400 mb-1">External Buy Threshold (SOL)</div>
                    <input type="number" min="0.1" step="0.1" value={externalBuyThreshold} onChange={(e) => setExternalBuyThreshold(e.target.value)} className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white" />
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">Aggregation Window (sec)</div>
                    <input type="number" min="10" step="1" value={externalBuyWindow} onChange={(e) => setExternalBuyWindow(e.target.value)} className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-black/40 border border-gray-800 rounded-lg md:col-span-2">
              <div className="flex items-center gap-2 mb-2 text-gray-300 font-medium">
                <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
                Auto-Sell MEV Protection
              </div>
              <div className="flex items-center gap-2 mb-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={mevProtectionEnabled}
                  onChange={(e) => setMevProtectionEnabled(e.target.checked)}
                  className="w-4 h-4"
                />
                Enable MEV Protection
              </div>
              {mevProtectionEnabled && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-gray-400 mb-1">Confirmation Delay (sec)</div>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={mevConfirmationDelaySec}
                      onChange={(e) => setMevConfirmationDelaySec(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                    />
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">Launch Cooldown (sec)</div>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={mevLaunchCooldownSec}
                      onChange={(e) => setMevLaunchCooldownSec(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-gray-400 mb-1">Rapid Window (sec)</div>
                    <input
                      type="number"
                      min="5"
                      step="1"
                      value={mevRapidWindowSec}
                      onChange={(e) => setMevRapidWindowSec(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-black/40 border border-gray-800 rounded-lg md:col-span-2">
              <div className="text-gray-300 font-medium mb-2">Sell Execution Options</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <input type="checkbox" checked={useJitoForSells} onChange={(e) => setUseJitoForSells(e.target.checked)} className="w-4 h-4" />
                  Use Jito For Sells
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Jito Sell Tip (SOL)</div>
                  <input type="number" min="0.0001" step="0.0001" value={jitoSellTip} onChange={(e) => setJitoSellTip(e.target.value)} className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white" />
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Rapid Sell Priority Fee (lamports)</div>
                  <input type="number" min="0" step="1000" value={rapidSellPriorityFee} onChange={(e) => setRapidSellPriorityFee(e.target.value)} className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-gray-400 mb-1">Holder Wallet Priority Fee (lamports)</div>
                <input type="number" min="0" step="1000" value={holderPriorityFee} onChange={(e) => setHolderPriorityFee(e.target.value)} className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white" />
              </div>
            </div>

            <div className="p-3 bg-black/40 border border-gray-800 rounded-lg md:col-span-2">
              <div className="text-gray-300 font-medium mb-2">Execution Summary</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                <div className="px-3 py-2 rounded bg-gray-900 border border-gray-700 text-gray-300">Wallet Target: <span className="text-white font-semibold">{effectiveWalletTarget}</span></div>
                <div className="px-3 py-2 rounded bg-gray-900 border border-gray-700 text-gray-300">Buy Interval: <span className="text-white font-semibold">{randomIntervalMin}s - {randomIntervalMax}s</span></div>
                <div className="px-3 py-2 rounded bg-gray-900 border border-gray-700 text-gray-300">Duration: <span className="text-white font-semibold">{durationMinutes} min</span></div>
                <div className="px-3 py-2 rounded bg-gray-900 border border-gray-700 text-gray-300">Buy Size: <span className="text-white font-semibold">{pumpAmountPerWallet} SOL</span></div>
                <div className="px-3 py-2 rounded bg-gray-900 border border-gray-700 text-gray-300">Sell Range: <span className="text-white font-semibold">{minSellPercentage}% - {maxSellPercentage}%</span></div>
                <div className="px-3 py-2 rounded bg-gray-900 border border-gray-700 text-gray-300">Auto-Sell: <span className="text-white font-semibold">{autoSellEnabled ? `${autoSellProfitPercent}% (${autoSellMode})` : 'Disabled'}</span></div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={runPreflight}
            disabled={launching || preflightRunning}
            className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            {preflightRunning ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <CheckCircleIcon className="w-4 h-4" />}
            {preflightRunning ? 'Checking...' : 'Preflight'}
          </button>
          <button
            onClick={handleLaunchPump}
            disabled={launching}
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            {launching ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <RocketLaunchIcon className="w-4 h-4" />}
            {launching ? 'Launching...' : 'Launch'}
          </button>
          {status && <span className="text-sm text-gray-300">{status}</span>}
        </div>
      </div>
    </div>
  );
}
