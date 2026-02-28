import { useState, useEffect, useRef } from 'react';
import { 
  RocketLaunchIcon, 
  ArrowPathIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../services/api';

export default function LaunchProgress({ onComplete, tokenInfo }) {
  const [currentStage, setCurrentStage] = useState('Preparing launch...');
  const [status, setStatus] = useState('launching'); // launching, success, failed
  const [mintAddress, setMintAddress] = useState(null);
  const [error, setError] = useState(null);
  const [keyEvents, setKeyEvents] = useState([]);
  const [walletsSaved, setWalletsSaved] = useState(false);
  const [runData, setRunData] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const pollRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const previousStateRef = useRef({
    mintAddress: null,
    launchStatus: null,
    launchStage: null,
    walletsSaved: false,
  });

  // Start polling and timer
  useEffect(() => {
    startPolling();
    startTimer();
    
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  };

  const startPolling = () => {
    const poll = async () => {
      try {
        const res = await apiService.getCurrentRun();
        const data = res.data.data || res.data;
        setRunData(prev => {
          if (!prev) return data;
          if (
            prev?.mintAddress === data?.mintAddress &&
            prev?.launchStatus === data?.launchStatus &&
            prev?.launchStage === data?.launchStage &&
            (prev?.bundleWalletKeys?.length || 0) === (data?.bundleWalletKeys?.length || 0) &&
            (prev?.holderWalletKeys?.length || 0) === (data?.holderWalletKeys?.length || 0)
          ) {
            return prev;
          }
          return data;
        });

        if (data.launchStage && previousStateRef.current.launchStage !== data.launchStage) {
          previousStateRef.current.launchStage = data.launchStage;
          setCurrentStage(data.launchStage.replace(/_/g, ' '));
        }

        // Check for mint address
        if (data.mintAddress && previousStateRef.current.mintAddress !== data.mintAddress) {
          previousStateRef.current.mintAddress = data.mintAddress;
          setMintAddress(data.mintAddress);
          addKeyEvent('🪙 Token address generated');
        }

        // Check for wallets saved
        const nowWalletsSaved = (data.bundleWalletKeys?.length || 0) > 0;
        if (nowWalletsSaved && !previousStateRef.current.walletsSaved) {
          previousStateRef.current.walletsSaved = true;
          setWalletsSaved(true);
          addKeyEvent('💾 All wallets saved to current-run.json');
        }

        if (data.launchStatus === 'SUCCESS' && previousStateRef.current.launchStatus !== 'SUCCESS') {
          previousStateRef.current.launchStatus = 'SUCCESS';
          setStatus('success');
          setCurrentStage('Launch complete');
          addKeyEvent('🎉 TOKEN IS LIVE!');
          if (timerRef.current) clearInterval(timerRef.current);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 3000);
        } else if (data.launchStatus === 'FAILED' && previousStateRef.current.launchStatus !== 'FAILED') {
          previousStateRef.current.launchStatus = 'FAILED';
          setStatus('failed');
          setError(data.failureReason || 'Bundle may not have landed');
          setCurrentStage('Launch failed');
          addKeyEvent('❌ Launch failed - ' + (data.failureReason || 'Unknown error'));
          if (timerRef.current) clearInterval(timerRef.current);
        }
      } catch (err) {
        // Ignore polling errors
      }
    };

    poll();
    pollRef.current = setInterval(poll, 2000);
  };

  const addKeyEvent = (message) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setKeyEvents(prev => {
      // Prevent duplicates
      if (prev.some(e => e.message === message)) return prev;
      return [...prev, { time, message }].slice(-8);
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    addKeyEvent('📋 Address copied to clipboard');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              status === 'success' ? 'bg-green-500' :
              status === 'failed' ? 'bg-red-500' :
              'bg-yellow-500 animate-pulse'
            }`} />
            <h2 className="text-xl font-bold text-white">
              {status === 'success' ? 'Launch Complete!' :
               status === 'failed' ? 'Launch Failed' :
               'Launching Token...'}
            </h2>
          </div>
          <div className="text-sm text-gray-400 font-mono">
            {formatTime(elapsedTime)}
          </div>
        </div>
        <p className="text-sm text-gray-400 mt-2">{currentStage}</p>
      </div>

      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
        {tokenInfo && (
          <div className="bg-black/40 border border-gray-800 rounded-lg p-4 mb-4 flex items-center gap-4">
            {tokenInfo.image && (
              <img src={tokenInfo.image} alt="" className="w-14 h-14 rounded-lg object-cover" />
            )}
            <div>
              <h3 className="text-lg font-bold text-white">{tokenInfo.name || 'New Token'}</h3>
              <p className="text-cyan-400 font-semibold">${tokenInfo.symbol || 'TOKEN'}</p>
            </div>
          </div>
        )}

        {walletsSaved && status === 'launching' && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4 flex items-center gap-3">
            <ShieldCheckIcon className="w-8 h-8 text-green-400 flex-shrink-0" />
            <div>
              <div className="text-green-400 font-bold">Wallets Saved Securely</div>
              <div className="text-green-400/70 text-sm">
                All wallet keys are saved in current-run.json. Even if launch fails, your SOL is recoverable.
              </div>
            </div>
          </div>
        )}

        {mintAddress && (
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 mb-4">
            <div className="text-cyan-400 text-sm font-semibold mb-2">Token Address</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-900 px-3 py-2 rounded text-white font-mono text-sm break-all border border-gray-700">
                {mintAddress}
              </code>
              <button
                onClick={() => copyToClipboard(mintAddress)}
                className="p-2 bg-gray-800 rounded hover:bg-gray-700 transition-colors"
                title="Copy"
              >
                <ClipboardDocumentIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        )}

        {status === 'failed' && error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-400 flex-shrink-0" />
              <div>
                <div className="text-red-400 font-bold">Launch Failed</div>
                <div className="text-red-400/70 text-sm">{error}</div>
                <div className="text-gray-400 text-xs mt-2">
                  Your wallets are saved. Run `npm run gather` to recover SOL.
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-black/40 border border-gray-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400">Activity Log</h3>
          </div>
          <div className="p-4 max-h-48 overflow-y-auto space-y-2">
            {keyEvents.length === 0 ? (
              <div className="text-gray-600 text-sm">Waiting for updates...</div>
            ) : (
              keyEvents.map((event, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm">
                  <span className="text-gray-600 font-mono text-xs whitespace-nowrap">{event.time}</span>
                  <span className="text-gray-300">{event.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-500">{runData?.bundleWalletKeys?.length || 0} bundle wallets • {runData?.holderWalletKeys?.length || 0} holder wallets</div>
          <div className="text-gray-600">Tip: keep this open until complete</div>
        </div>
      </div>
    </div>
  );
}
