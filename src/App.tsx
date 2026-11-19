import React, { useState, useEffect } from 'react'
import {
  ShieldAlert,
  Zap,
  Activity,
  Coins,
  History,
  Settings,
  Flame,
  Search,
  RefreshCw,
  Wallet,
  Play,
  Square,
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
  Layers,
  Radio,
  Sliders,
  Sparkles,
  TrendingUp,
  Percent,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  ArrowDownRight,
  ShieldCheck,
  Check,
  X,
  ChevronDown
} from 'lucide-react'

interface TokenItem {
  id: string
  name: string
  symbol: string
  mint: string
  dex: string
  ageMinutes: number
  priceUsd: number
  priceSol: number
  liquidityUsd: number
  mcapUsd: number
  volume24hUsd: number
  buyTxCount: number
  sellTxCount: number
  buySellRatio: number
  priceChange1h: number
  holdersCount: number
  devHoldingsPct: number
  top10ConcentrationPct: number
  security: {
    score: number
    isMintRevoked: boolean
    isFreezeDisabled: boolean
    isLpBurned: boolean
    rugRisk: string
    warnings: string[]
  }
  aiScore: {
    opportunity: number
    momentum: number
    safety: number
    verdict: string
    reasoning: string
  }
}

interface PositionItem {
  id: string
  tokenSymbol: string
  tokenName: string
  mint: string
  pair: string
  dex: string
  entryPrice: number
  currentPrice: number
  investedSol: number
  tokenAmount: number
  unrealizedPnlSol: number
  unrealizedPnlPct: number
  stopLossPrice: number
  takeProfitPrice: number
  status: string
  openedAt: string
  ataAddress: string
}

interface RentAccountItem {
  address: string
  mint: string
  tokenName: string
  program: string
  tokenBalance: number
  lamports: number
  recoverableSol: number
  status: string
  method: string
  isZeroBalance: boolean
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scanner' | 'analyzer' | 'orderflow' | 'positions' | 'paper' | 'backtest' | 'rent' | 'strategies' | 'settings'>('dashboard')
  const [tokens, setTokens] = useState<TokenItem[]>([])
  const [positions, setPositions] = useState<PositionItem[]>([])
  const [rentAccounts, setRentAccounts] = useState<RentAccountItem[]>([])
  const [rentSummary, setRentSummary] = useState<any>({
    totalRecoverableSol: 0,
    totalRecoveredSol: 3.419,
    eligibleAccountsCount: 0,
    autoClaimActive: true,
  })
  const [walletInfo, setWalletInfo] = useState<any>({ solBalance: 14.825, network: 'solana-mainnet' })
  const [botConfig, setBotConfig] = useState<any>({
    isArmed: false,
    mode: 'paper',
    buyAmountSol: 0.5,
    maxSlippagePct: 2.5,
    autoClaimRent: true,
    takeProfitPct: 50,
    stopLossPct: 15,
  })
  const [orderFlow, setOrderFlow] = useState<any>({ buyPressurePct: 74, sellPressurePct: 26, recentTrades: [] })
  const [systemLogs, setSystemLogs] = useState<any[]>([])
  const [solanaSlot, setSolanaSlot] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  // Token analyzer specific selection
  const [selectedMint, setSelectedMint] = useState<string>('9zW2X6B4mKq9rL7yG1uPvRtW3xT4eN8bQ2yU6iO5pL1')
  const [analysisReport, setAnalysisReport] = useState<any>(null)

  // Backtest form
  const [backtestConfig, setBacktestConfig] = useState({
    strategyName: 'New Launch Sniping + AI Sentinel',
    timePeriod: '7D',
    initialSol: 10,
    takeProfitPct: 50,
    stopLossPct: 15,
  })
  const [backtestResult, setBacktestResult] = useState<any>(null)

  // Load live data from server routes
  const fetchData = async () => {
    try {
      const [statusRes, tokensRes, posRes, rentSumRes, rentAccRes, ofRes, logsRes, configRes] = await Promise.all([
        fetch('/api/tatum/status').then(r => r.json()),
        fetch('/api/tatum/scanner/tokens').then(r => r.json()),
        fetch('/api/tatum/positions').then(r => r.json()),
        fetch('/api/tatum/rent/summary').then(r => r.json()),
        fetch('/api/tatum/rent/accounts').then(r => r.json()),
        fetch('/api/tatum/orderflow').then(r => r.json()),
        fetch('/api/tatum/logs').then(r => r.json()),
        fetch('/api/tatum/sniper/config').then(r => r.json()),
      ])

      if (statusRes.solanaSlot) setSolanaSlot(statusRes.solanaSlot)
      if (tokensRes.tokens) setTokens(tokensRes.tokens)
      if (posRes.positions) setPositions(posRes.positions)
      if (rentSumRes) setRentSummary(rentSumRes)
      if (rentAccRes.accounts) setRentAccounts(rentAccRes.accounts)
      if (ofRes) setOrderFlow(ofRes)
      if (logsRes.logs) setSystemLogs(logsRes.logs)
      if (configRes) setBotConfig(configRes)
    } catch (err) {
      console.error('Fetch error:', err)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 8000)
    return () => clearInterval(interval)
  }, [])

  // Analyze single mint
  const runAnalysis = async (mint: string) => {
    setSelectedMint(mint)
    setIsLoading(true)
    try {
      const res = await fetch(`/api/tatum/security/analyze/${mint}`).then(r => r.json())
      setAnalysisReport(res)
      setActiveTab('analyzer')
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  // Snipe Token Action
  const executeSnipe = async (token: TokenItem) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/tatum/sniper/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mint: token.mint,
          symbol: token.symbol.replace('$', ''),
          name: token.name,
          buyAmountSol: botConfig.buyAmountSol || 0.5,
          dex: token.dex
        })
      }).then(r => r.json())

      if (res.success) {
        setActionNotice(`Successfully opened position for ${token.symbol} (${botConfig.buyAmountSol} SOL)`)
        fetchData()
      } else {
        setActionNotice(`Failed: ${res.error}`)
      }
    } catch (e: any) {
      setActionNotice(`Error: ${e.message}`)
    } finally {
      setIsLoading(false)
      setTimeout(() => setActionNotice(null), 4000)
    }
  }

  // Close Position
  const closePosition = async (id: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/tatum/positions/close/${id}`, { method: 'POST' }).then(r => r.json())
      if (res.success) {
        setActionNotice(`Closed position. Reclaimed rent: ${res.recoveredSol ? res.recoveredSol + ' SOL' : 'Queued'}`)
        fetchData()
      }
    } catch (e: any) {
      setActionNotice(`Error: ${e.message}`)
    } finally {
      setIsLoading(false)
      setTimeout(() => setActionNotice(null), 4000)
    }
  }

  // Claim Rent
  const claimRent = async (addresses: string[] | 'ALL') => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/tatum/rent/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresses })
      }).then(r => r.json())

      if (res.success) {
        setActionNotice(`Claimed +${res.reclaimedSol.toFixed(6)} SOL from ${res.reclaimedAccountsCount} accounts!`)
        fetchData()
      } else {
        setActionNotice(`Failed to claim rent: ${res.error}`)
      }
    } catch (e: any) {
      setActionNotice(`Error: ${e.message}`)
    } finally {
      setIsLoading(false)
      setTimeout(() => setActionNotice(null), 4000)
    }
  }

  // Toggle Bot Armed state
  const toggleArm = async () => {
    const updated = { ...botConfig, isArmed: !botConfig.isArmed }
    await fetch('/api/tatum/sniper/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    })
    setBotConfig(updated)
    fetchData()
  }

  // Run Backtest
  const runBacktest = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/tatum/backtest/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backtestConfig)
      }).then(r => r.json())
      setBacktestResult(res)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary text-primary flex flex-col font-sans">
      {/* Top Banner Alert (Matching Alert Recipe: flex gap-lg rounded-xl bg-utility-brand-50 p-xl) */}
      {actionNotice && (
        <div className="mx-2xl mt-md flex items-center justify-between gap-lg rounded-xl bg-utility-brand-50 p-xl border border-utility-brand-200">
          <div className="flex items-center gap-md">
            <CheckCircle2 className="size-5 shrink-0 text-utility-brand-600" />
            <div>
              <p className="text-sm font-semibold text-utility-brand-600">Action Confirmed</p>
              <p className="text-sm text-tertiary">{actionNotice}</p>
            </div>
          </div>
          <button 
            onClick={() => setActionNotice(null)} 
            className="inline-flex items-center gap-sm rounded-lg bg-primary px-lg py-sm text-sm font-semibold text-secondary border border-primary shadow-xs hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Navigation */}
      <header className="border-b border-secondary bg-secondary px-2xl py-md sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-xl">
          <div className="flex items-center gap-md">
            <div className="w-8 h-8 rounded-md bg-brand-solid flex items-center justify-center text-primary-on-brand shadow-xs">
              <Zap className="size-5 text-fg-white" />
            </div>
            <div>
              <div className="flex items-center gap-sm">
                <span className="text-heading-xs font-bold tracking-tight">SOLSNIPER AI</span>
                {/* Badge recipe: rounded-full border px-md py-xxs text-xs font-medium */}
                <span className="inline-flex items-center gap-xs rounded-full border border-utility-brand-200 bg-utility-brand-50 px-md py-xxs text-xs font-medium text-utility-brand-700">
                  v2.4.0
                </span>
                <span className="inline-flex items-center gap-xs rounded-full border border-utility-warning-200 bg-utility-warning-50 px-md py-xxs text-xs font-medium text-utility-warning-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-warning-primary animate-pulse" />
                  Solana Mainnet-Beta
                </span>
              </div>
              <p className="text-xs text-tertiary">Autonomous Memecoin Sniper, Rent Recovery & Order Flow Engine</p>
            </div>
          </div>

          {/* Quick Engine Status Badges (Badge Recipe) */}
          <div className="hidden lg:flex items-center gap-sm">
            <span className={`inline-flex items-center gap-xs rounded-full border px-md py-xxs text-xs font-medium ${botConfig.mode === 'paper' ? 'border-utility-brand-200 bg-utility-brand-50 text-utility-brand-700' : 'border-secondary bg-secondary text-tertiary'}`}>
              <Sparkles className="size-3.5 text-fg-brand-primary" />
              Paper Mode: ON
            </span>
            <span className={`inline-flex items-center gap-xs rounded-full border px-md py-xxs text-xs font-medium ${botConfig.isArmed ? 'border-utility-error-200 bg-utility-error-50 text-utility-error-700' : 'border-secondary bg-secondary text-tertiary'}`}>
              <span className={`w-2 h-2 rounded-full ${botConfig.isArmed ? 'bg-error-primary animate-ping' : 'bg-disabled'}`} />
              Auto-Sniper: {botConfig.isArmed ? 'ARMED' : 'STANDBY'}
            </span>
            <span className="inline-flex items-center gap-xs rounded-full border border-secondary bg-secondary px-md py-xxs text-xs font-medium text-tertiary">
              <Coins className="size-3.5 text-fg-secondary" />
              Slot: {solanaSlot ? solanaSlot.toLocaleString() : 'Syncing...'}
            </span>
          </div>
        </div>

        {/* Right Action Bar (Button Recipe: primary and secondary) */}
        <div className="flex items-center gap-md">
          <button
            onClick={toggleArm}
            className={`inline-flex items-center gap-sm rounded-lg border border-transparent px-lg py-sm text-sm font-semibold shadow-xs focus-visible:ring-2 focus-visible:ring-focus-ring ${
              botConfig.isArmed
                ? 'bg-error-primary text-primary-on-brand hover:bg-error-secondary'
                : 'bg-brand-solid text-primary-on-brand hover:bg-brand-solid-hover'
            }`}
          >
            {botConfig.isArmed ? <Square className="size-4 text-fg-white" /> : <Play className="size-4 text-fg-white" />}
            {botConfig.isArmed ? 'Disarm Sniper' : 'Arm Auto-Sniper'}
          </button>

          <div className="h-6 w-[1px] bg-secondary" />

          {/* Wallet Info Pill */}
          <div className="flex items-center gap-sm px-md py-xs rounded-md bg-tertiary border border-secondary text-xs">
            <Wallet className="size-4 text-fg-secondary" />
            <div>
              <span className="text-secondary font-medium block">7xKX...3bWq</span>
              <span className="text-primary font-bold">{walletInfo.solBalance.toFixed(3)} SOL</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-64 border-r border-secondary bg-secondary flex flex-col justify-between p-md">
          <nav className="space-y-xxs">
            {[
              { id: 'dashboard', label: 'Dashboard & Monitor', icon: Activity },
              { id: 'scanner', label: 'Live Memecoin Scanner', icon: Flame },
              { id: 'analyzer', label: 'Token & Rug Analyzer', icon: ShieldAlert },
              { id: 'orderflow', label: 'Whale & Order Flow', icon: Radio },
              { id: 'positions', label: 'Active Positions & TP/SL', icon: TrendingUp },
              { id: 'paper', label: 'Paper Trading Engine', icon: Sparkles },
              { id: 'backtest', label: 'Strategy Backtester', icon: History },
              { id: 'rent', label: 'Rent Recovery (Reclaim SOL)', icon: Coins },
              { id: 'strategies', label: 'AI & Custom Strategies', icon: Sliders },
              { id: 'settings', label: 'Bot & Risk Controls', icon: Settings },
            ].map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-md py-sm rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-solid text-primary-on-brand shadow-xs'
                      : 'text-secondary hover:text-primary hover:bg-secondary-hover'
                  }`}
                >
                  <div className="flex items-center gap-md">
                    <Icon className={`size-4 ${isActive ? 'text-fg-white' : 'text-fg-secondary'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.id === 'rent' && rentSummary.totalRecoverableSol > 0 && (
                    <span className={`inline-flex items-center gap-xs rounded-full border px-sm py-xxs text-xs font-semibold ${isActive ? 'border-primary bg-primary text-brand-primary' : 'border-utility-brand-200 bg-utility-brand-50 text-utility-brand-700'}`}>
                      +{rentSummary.totalRecoverableSol.toFixed(3)} SOL
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Bottom Sidebar Status */}
          <div className="p-md rounded-xl bg-tertiary border border-secondary space-y-xs">
            <div className="flex items-center justify-between text-xs text-secondary">
              <span>RPC Gateway</span>
              <span className="text-utility-success-700 font-medium">Tatum High-Speed</span>
            </div>
            <div className="flex items-center justify-between text-xs text-secondary">
              <span>Solana Slot</span>
              <span className="text-primary font-mono font-medium">{solanaSlot ? solanaSlot.toLocaleString() : 'Loading'}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-secondary">
              <span>Jito MEV Guard</span>
              <span className="text-utility-brand-700 font-medium">Enabled (0.001)</span>
            </div>
            <div className="flex items-center justify-between text-xs text-secondary">
              <span>Deterministic Risk</span>
              <span className="text-utility-success-700 font-medium">Enforced</span>
            </div>
          </div>
        </aside>

        {/* Dynamic Main Workspace */}
        <main className="flex-1 overflow-y-auto p-2xl space-y-2xl">
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-2xl">
              {/* Top Metrics Row - Card Recipe: rounded-xl border border-secondary bg-primary p-xl shadow-xs */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
                <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs">
                  <div className="flex items-center justify-between text-tertiary text-sm">
                    <p>Portfolio Net Worth</p>
                    <Wallet className="size-4 text-fg-quaternary" />
                  </div>
                  <p className="mt-md text-heading-xs font-semibold text-primary font-mono">$18,492.30</p>
                  <div className="mt-xs flex items-center gap-xs text-xs text-utility-success-700">
                    <TrendingUp className="size-3.5 text-fg-success-primary" />
                    <span>+24.8% (24h)</span>
                  </div>
                </section>

                <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs">
                  <div className="flex items-center justify-between text-tertiary text-sm">
                    <p>Realized Profit (SOL)</p>
                    <Coins className="size-4 text-fg-quaternary" />
                  </div>
                  <p className="mt-md text-heading-xs font-semibold text-primary font-mono">+38.45 SOL</p>
                  <p className="mt-xs text-xs text-utility-success-700">68.2% Win Rate (31 trades)</p>
                </section>

                <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs">
                  <div className="flex items-center justify-between text-tertiary text-sm">
                    <p>Active Positions</p>
                    <Activity className="size-4 text-fg-quaternary" />
                  </div>
                  <p className="mt-md text-heading-xs font-semibold text-primary font-mono">{positions.length} Open</p>
                  <p className="mt-xs text-xs text-tertiary">Max Concurrent: {botConfig.maxConcurrentPositions || 4}</p>
                </section>

                <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs">
                  <div className="flex items-center justify-between text-tertiary text-sm">
                    <p>Reclaimable Rent</p>
                    <ShieldAlert className="size-4 text-fg-quaternary" />
                  </div>
                  <p className="mt-md text-heading-xs font-semibold text-utility-brand-700 font-mono">
                    {rentSummary.totalRecoverableSol ? rentSummary.totalRecoverableSol.toFixed(4) : '0.0000'} SOL
                  </p>
                  <p className="mt-xs text-xs text-tertiary">{rentSummary.eligibleAccountsCount} Empty Accounts</p>
                </section>
              </div>

              {/* Live Scanner Stream & AI Opportunity Card */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
                <section className="lg:col-span-2 rounded-xl border border-secondary bg-primary p-xl shadow-xs space-y-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-heading-xs font-semibold text-primary">Live Memecoin Sniping Stream</h2>
                      <p className="text-xs text-tertiary">Real-time bonding curves, Raydium & Pump.fun liquidity launches</p>
                    </div>
                    <span className="inline-flex items-center gap-xs rounded-full border border-utility-success-200 bg-utility-success-50 px-md py-xxs text-xs font-medium text-utility-success-700">
                      <span className="w-2 h-2 rounded-full bg-success-primary animate-pulse" />
                      Streaming Blocks
                    </span>
                  </div>

                  {/* Table Recipe: overflow-hidden rounded-xl border border-secondary bg-primary */}
                  <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
                    <table className="w-full text-left">
                      <thead className="sticky top-0 z-10 bg-secondary">
                        <tr className="border-b border-secondary">
                          <th className="px-lg py-md text-sm font-semibold text-quaternary">Token / Pair</th>
                          <th className="px-lg py-md text-sm font-semibold text-quaternary">Liquidity</th>
                          <th className="px-lg py-md text-sm font-semibold text-quaternary">MCap</th>
                          <th className="px-lg py-md text-sm font-semibold text-quaternary">Safety Score</th>
                          <th className="px-lg py-md text-sm font-semibold text-quaternary">AI Signal</th>
                          <th className="px-lg py-md text-sm font-semibold text-quaternary text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tokens.map((tok) => (
                          <tr key={tok.id} className="border-b border-secondary hover:bg-secondary-hover">
                            <td className="px-lg py-md">
                              <p className="text-sm font-medium text-primary">{tok.name} ({tok.symbol})</p>
                              <p className="text-xs text-tertiary font-mono">{tok.mint.slice(0, 4)}...{tok.mint.slice(-4)} • {tok.dex}</p>
                            </td>
                            <td className="px-lg py-md text-sm font-mono text-tertiary">${tok.liquidityUsd.toLocaleString()}</td>
                            <td className="px-lg py-md text-sm font-mono text-tertiary">${tok.mcapUsd.toLocaleString()}</td>
                            <td className="px-lg py-md">
                              <span className={`inline-flex items-center gap-xs rounded-full border px-md py-xxs text-xs font-medium ${
                                tok.security.score >= 80
                                  ? 'border-utility-success-200 bg-utility-success-50 text-utility-success-700'
                                  : 'border-utility-error-200 bg-utility-error-50 text-utility-error-700'
                              }`}>
                                {tok.security.score}/100 {tok.security.rugRisk}
                              </span>
                            </td>
                            <td className="px-lg py-md">
                              <span className={`inline-flex items-center gap-xs rounded-full border px-md py-xxs text-xs font-medium ${
                                tok.aiScore.opportunity >= 80
                                  ? 'border-utility-brand-200 bg-utility-brand-50 text-utility-brand-700'
                                  : 'border-utility-gray-200 bg-utility-gray-50 text-utility-gray-700'
                              }`}>
                                {tok.aiScore.verdict}
                              </span>
                            </td>
                            <td className="px-lg py-md text-right">
                              <div className="flex items-center justify-end gap-xs">
                                <button
                                  onClick={() => runAnalysis(tok.mint)}
                                  className="inline-flex items-center gap-sm rounded-lg bg-primary px-sm py-xs text-xs font-semibold text-secondary border border-primary shadow-xs hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                                >
                                  Audit
                                </button>
                                {tok.security.score >= 70 ? (
                                  <button
                                    onClick={() => executeSnipe(tok)}
                                    className="inline-flex items-center gap-sm rounded-lg border border-transparent bg-brand-solid px-md py-xs text-xs font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                                  >
                                    Snipe {botConfig.buyAmountSol || 0.5} SOL
                                  </button>
                                ) : (
                                  <span className="text-xs text-utility-error-700 px-xs py-xxs font-medium">Blocked</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {/* Pagination Recipe */}
                    <div className="flex items-center justify-between border-t border-secondary px-3xl py-md">
                      <p className="text-sm text-tertiary">Showing 1 to {tokens.length} of 184 detected tokens</p>
                      <div className="flex gap-sm">
                        <button className="rounded-lg bg-primary px-lg py-sm text-sm font-semibold text-secondary border border-primary hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-focus-ring disabled:opacity-50" disabled>
                          Previous
                        </button>
                        <button className="rounded-lg bg-primary px-lg py-sm text-sm font-semibold text-secondary border border-primary hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-focus-ring">
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* AI Opportunity Card & Sentinel */}
                <div className="space-y-xl">
                  {tokens.length > 0 && (
                    <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs space-y-md">
                      <div className="flex items-center gap-sm">
                        <Sparkles className="size-5 text-fg-brand-primary" />
                        <h3 className="text-heading-xs font-semibold text-primary">Top AI Sniper Signal</h3>
                      </div>
                      <div className="p-md rounded-xl bg-secondary border border-secondary space-y-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-primary">{tokens[0].name} ({tokens[0].symbol})</span>
                          <span className="text-xs text-utility-success-700 font-bold">+{tokens[0].priceChange1h}% 1h</span>
                        </div>
                        <p className="text-xs text-secondary leading-relaxed">
                          {tokens[0].aiScore.reasoning}
                        </p>
                        <div className="grid grid-cols-2 gap-sm text-xs">
                          <div className="p-sm rounded-lg bg-primary border border-primary">
                            <span className="text-tertiary block">Opportunity / Safety</span>
                            <span className="font-mono font-medium text-primary">{tokens[0].aiScore.opportunity} / {tokens[0].security.score}</span>
                          </div>
                          <div className="p-sm rounded-lg bg-primary border border-primary">
                            <span className="text-tertiary block">DEX / Age</span>
                            <span className="font-mono font-medium text-secondary">{tokens[0].dex} • {tokens[0].ageMinutes}m</span>
                          </div>
                        </div>
                        <button
                          onClick={() => executeSnipe(tokens[0])}
                          className="w-full inline-flex items-center justify-center gap-sm rounded-lg border border-transparent bg-brand-solid px-lg py-sm text-sm font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                        >
                          Auto-Snipe with Preset {botConfig.buyAmountSol || 0.5} SOL
                        </button>
                      </div>
                    </section>
                  )}

                  {/* Rent Recovery Summary Card */}
                  <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs space-y-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-sm">
                        <Coins className="size-5 text-fg-brand-primary" />
                        <h3 className="text-heading-xs font-semibold text-primary">Solana Rent Recovery</h3>
                      </div>
                      <span className="inline-flex items-center gap-xs rounded-full border border-utility-brand-200 bg-utility-brand-50 px-md py-xxs text-xs font-medium text-utility-brand-700">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-secondary leading-relaxed">
                      Reclaim locked lamports from closed positions and zero-balance SPL Token accounts automatically.
                    </p>
                    <div className="flex items-center justify-between p-md rounded-xl bg-secondary border border-secondary">
                      <div>
                        <p className="text-xs text-tertiary">Estimated Recoverable</p>
                        <p className="text-heading-xs font-mono font-bold text-primary">
                          {rentSummary.totalRecoverableSol ? rentSummary.totalRecoverableSol.toFixed(4) : '0.0000'} SOL
                        </p>
                      </div>
                      <button 
                        onClick={() => claimRent('ALL')}
                        className="inline-flex items-center gap-sm rounded-lg border border-transparent bg-brand-solid px-lg py-sm text-sm font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                      >
                        Claim All Rent
                      </button>
                    </div>
                  </section>
                </div>
              </div>

              {/* Active Positions Overview */}
              <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs space-y-md">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-heading-xs font-semibold text-primary">Active Trading Positions & Auto-Sell</h2>
                    <p className="text-xs text-tertiary">Trailing Stop Loss, Multi-Level Take Profit, and Auto-Rent Reclaim on exit</p>
                  </div>
                  <span className="text-xs text-secondary">{positions.length} Positions Open</span>
                </div>
                
                {/* Table Recipe */}
                <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 z-10 bg-secondary">
                      <tr className="border-b border-secondary">
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Position Token</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Invested Amount</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Entry Price</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Current Price</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Unrealized PnL</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Exit Condition</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary text-right">Emergency Action</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      {positions.map((pos) => (
                        <tr key={pos.id} className="border-b border-secondary hover:bg-secondary-hover">
                          <td className="px-lg py-md font-sans">
                            <p className="font-medium text-primary">{pos.tokenName} (${pos.tokenSymbol})</p>
                            <p className="text-xs text-tertiary font-mono">{pos.dex} • {pos.ataAddress.slice(0, 8)}...</p>
                          </td>
                          <td className="px-lg py-md text-sm text-tertiary">{pos.investedSol.toFixed(2)} SOL</td>
                          <td className="px-lg py-md text-sm text-tertiary">${pos.entryPrice.toFixed(6)}</td>
                          <td className="px-lg py-md text-sm text-tertiary">${pos.currentPrice.toFixed(6)}</td>
                          <td className="px-lg py-md text-sm text-utility-success-700 font-bold">
                            +{pos.unrealizedPnlPct.toFixed(2)}% (+{pos.unrealizedPnlSol.toFixed(3)} SOL)
                          </td>
                          <td className="px-lg py-md font-sans">
                            <span className="inline-flex items-center gap-xs rounded-full border border-utility-brand-200 bg-utility-brand-50 px-md py-xxs text-xs font-medium text-utility-brand-700">
                              SL ${pos.stopLossPrice.toFixed(6)} / TP ${pos.takeProfitPrice.toFixed(6)}
                            </span>
                          </td>
                          <td className="px-lg py-md text-right font-sans">
                            <button
                              onClick={() => closePosition(pos.id)}
                              className="inline-flex items-center gap-sm rounded-lg border border-transparent bg-error-primary px-lg py-sm text-sm font-semibold text-primary-on-brand shadow-xs hover:bg-error-secondary focus-visible:ring-2 focus-visible:ring-focus-ring"
                            >
                              Sell Market 100%
                            </button>
                          </td>
                        </tr>
                      ))}
                      {positions.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-3xl py-xl text-center text-tertiary font-sans text-sm">
                            No active positions. Execute a snipe from the scanner or arm the auto-sniper.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* SCANNER TAB */}
          {activeTab === 'scanner' && (
            <div className="space-y-xl">
              <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs flex items-center justify-between">
                <div>
                  <h1 className="text-heading-xs font-semibold text-primary">Live Memecoin Scanner & Discovery Engine</h1>
                  <p className="text-xs text-tertiary">Real-time monitoring of Raydium, Pump.fun bonding curves, Orca, and Meteora pools.</p>
                </div>
                <div className="flex items-center gap-sm">
                  <span className="text-xs text-secondary font-mono">Current Slot: {solanaSlot || 'Syncing...'}</span>
                  <button 
                    onClick={fetchData} 
                    className="inline-flex items-center gap-sm rounded-lg bg-primary px-lg py-sm text-sm font-semibold text-secondary border border-primary shadow-xs hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    <RefreshCw className="size-4 text-fg-secondary" />
                    Refresh Feed
                  </button>
                </div>
              </section>

              {/* Filters row with proper Input Recipe & Select Recipe */}
              <div className="rounded-xl border border-secondary bg-secondary p-xl grid grid-cols-2 md:grid-cols-5 gap-md">
                <div className="flex flex-col gap-sm">
                  <label className="text-sm font-medium text-secondary">Min Liquidity</label>
                  <input className="rounded-md bg-primary px-lg py-sm text-sm text-primary placeholder:text-placeholder border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring font-mono" defaultValue="$10,000" />
                </div>
                <div className="flex flex-col gap-sm">
                  <label className="text-sm font-medium text-secondary">Max Dev Holdings</label>
                  <input className="rounded-md bg-primary px-lg py-sm text-sm text-primary placeholder:text-placeholder border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring font-mono" defaultValue="5.0%" />
                </div>
                <div className="flex flex-col gap-sm">
                  <label className="text-sm font-medium text-secondary">Min Safety Score</label>
                  <input className="rounded-md bg-primary px-lg py-sm text-sm text-primary placeholder:text-placeholder border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring font-mono" defaultValue="75/100" />
                </div>
                <div className="flex flex-col gap-sm">
                  <label className="text-sm font-medium text-secondary">DEX Launchpad</label>
                  <select className="rounded-md bg-primary px-lg py-sm text-sm text-primary border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring">
                    <option>All DEXes (Pump.fun, Raydium, Meteora)</option>
                    <option>Pump.fun Only</option>
                    <option>Raydium CPMM</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button className="w-full inline-flex items-center justify-center gap-sm rounded-lg border border-transparent bg-brand-solid px-lg py-sm text-sm font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring">
                    Apply Filters
                  </button>
                </div>
              </div>

              {/* Scanner Grid / Table */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
                {tokens.map((tok) => (
                  <section key={tok.id} className="rounded-xl border border-secondary bg-primary p-xl shadow-xs space-y-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-sm">
                          <span className="text-heading-xs font-semibold text-primary">{tok.name}</span>
                          <span className="inline-flex items-center gap-xs rounded-full border border-utility-gray-200 bg-utility-gray-50 px-md py-xxs text-xs font-medium text-utility-gray-700 font-mono">
                            {tok.symbol}
                          </span>
                          <span className="text-xs text-tertiary">{tok.dex}</span>
                        </div>
                        <p className="text-xs text-tertiary font-mono">{tok.mint}</p>
                      </div>
                      <span className={`inline-flex items-center gap-xs rounded-full border px-md py-xxs text-xs font-medium ${
                        tok.security.score >= 80 ? 'border-utility-success-200 bg-utility-success-50 text-utility-success-700' : 'border-utility-error-200 bg-utility-error-50 text-utility-error-700'
                      }`}>
                        {tok.security.score}/100
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-sm text-xs font-mono">
                      <div className="p-sm rounded-lg bg-secondary border border-secondary">
                        <span className="text-tertiary block font-sans">Price</span>
                        <span className="text-primary">${tok.priceUsd.toFixed(6)}</span>
                      </div>
                      <div className="p-sm rounded-lg bg-secondary border border-secondary">
                        <span className="text-tertiary block font-sans">Liquidity</span>
                        <span className="text-primary">${tok.liquidityUsd.toLocaleString()}</span>
                      </div>
                      <div className="p-sm rounded-lg bg-secondary border border-secondary">
                        <span className="text-tertiary block font-sans">MCap</span>
                        <span className="text-primary">${tok.mcapUsd.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="p-sm rounded-lg bg-secondary border border-secondary text-xs space-y-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-tertiary">AI Verdict:</span>
                        <span className="font-semibold text-primary">{tok.aiScore.verdict}</span>
                      </div>
                      <p className="text-secondary text-xs leading-relaxed">{tok.aiScore.reasoning}</p>
                    </div>

                    <div className="flex items-center justify-between pt-xs">
                      <div className="text-xs text-tertiary">
                        Dev: {tok.devHoldingsPct}% • Top 10: {tok.top10ConcentrationPct}%
                      </div>
                      <div className="flex items-center gap-xs">
                        <button
                          onClick={() => runAnalysis(tok.mint)}
                          className="inline-flex items-center gap-sm rounded-lg bg-primary px-lg py-sm text-sm font-semibold text-secondary border border-primary shadow-xs hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                        >
                          Audit Rug Risk
                        </button>
                        <button
                          onClick={() => executeSnipe(tok)}
                          className="inline-flex items-center gap-sm rounded-lg border border-transparent bg-brand-solid px-lg py-sm text-sm font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                        >
                          Snipe 0.5 SOL
                        </button>
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            </div>
          )}

          {/* RENT RECOVERY TAB */}
          {activeTab === 'rent' && (
            <div className="space-y-2xl">
              <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs flex items-center justify-between">
                <div>
                  <h1 className="text-heading-xs font-semibold text-primary">Solana Rent Recovery & Auto-Claim Engine</h1>
                  <p className="text-xs text-tertiary">Reclaim locked lamports from empty SPL & Token-2022 ATAs and withdraw excess balances.</p>
                </div>
                <div className="flex items-center gap-md">
                  <button 
                    onClick={fetchData} 
                    className="inline-flex items-center gap-sm rounded-lg bg-primary px-lg py-sm text-sm font-semibold text-secondary border border-primary shadow-xs hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    <RefreshCw className="size-4 text-fg-secondary" />
                    Scan Wallet Accounts
                  </button>
                  <button 
                    onClick={() => claimRent('ALL')} 
                    className="inline-flex items-center gap-sm rounded-lg border border-transparent bg-brand-solid px-lg py-sm text-sm font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    Claim All Eligible ({rentSummary.totalRecoverableSol ? rentSummary.totalRecoverableSol.toFixed(4) : '0'} SOL)
                  </button>
                </div>
              </section>

              {/* Rent Stats - Card Recipe */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
                <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs">
                  <p className="text-sm text-tertiary">Total Recoverable SOL</p>
                  <p className="mt-md text-heading-xs font-semibold text-primary font-mono">
                    {rentSummary.totalRecoverableSol ? rentSummary.totalRecoverableSol.toFixed(5) : '0.00000'} SOL
                  </p>
                  <p className="mt-xs text-xs text-tertiary">~0.002039 SOL per ATA account</p>
                </section>
                <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs">
                  <p className="text-sm text-tertiary">Total Historically Recovered</p>
                  <p className="mt-md text-heading-xs font-semibold text-utility-success-700 font-mono">
                    {rentSummary.totalRecoveredSol ? rentSummary.totalRecoveredSol.toFixed(4) : '3.4190'} SOL
                  </p>
                  <p className="mt-xs text-xs text-tertiary">142 closed accounts</p>
                </section>
                <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs">
                  <p className="text-sm text-tertiary">Eligible Accounts</p>
                  <p className="mt-md text-heading-xs font-semibold text-primary font-mono">{rentSummary.eligibleAccountsCount} Accounts</p>
                  <p className="mt-xs text-xs text-tertiary">Zero token balance verified</p>
                </section>
                <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs">
                  <p className="text-sm text-tertiary">Auto-Reclaim on Position Exit</p>
                  <p className="mt-md text-heading-xs font-semibold text-utility-brand-700">ENABLED</p>
                  <p className="mt-xs text-xs text-tertiary">Automatic rent reclaim on zero balance</p>
                </section>
              </div>

              {/* Recoverable Accounts Table */}
              <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs space-y-md">
                <div className="flex items-center justify-between">
                  <h3 className="text-heading-xs font-semibold text-primary">Discoverable Token Accounts</h3>
                  <span className="text-xs text-secondary">Showing {rentAccounts.length} Accounts</span>
                </div>

                {/* Table Recipe */}
                <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
                  <table className="w-full text-left font-mono">
                    <thead className="sticky top-0 z-10 bg-secondary font-sans">
                      <tr className="border-b border-secondary">
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Account Address</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Token Mint</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Token Balance</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Locked Lamports</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Recovery Method</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Status</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary text-right font-sans">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rentAccounts.map((acc, idx) => (
                        <tr key={idx} className="border-b border-secondary hover:bg-secondary-hover">
                          <td className="px-lg py-md text-sm text-primary font-semibold">{acc.address.slice(0, 8)}...{acc.address.slice(-6)}</td>
                          <td className="px-lg py-md text-sm text-tertiary font-sans">{acc.tokenName}</td>
                          <td className="px-lg py-md text-sm text-secondary">{acc.tokenBalance}</td>
                          <td className="px-lg py-md text-sm text-secondary">{acc.lamports.toLocaleString()} ({acc.recoverableSol.toFixed(6)} SOL)</td>
                          <td className="px-lg py-md font-sans">
                            <span className="inline-flex items-center gap-xs rounded-full border border-utility-brand-200 bg-utility-brand-50 px-md py-xxs text-xs font-medium text-utility-brand-700">
                              {acc.method} ({acc.program})
                            </span>
                          </td>
                          <td className="px-lg py-md font-sans">
                            <span className={`inline-flex items-center gap-xs rounded-full border px-md py-xxs text-xs font-medium ${
                              acc.status === 'ELIGIBLE' ? 'border-utility-success-200 bg-utility-success-50 text-utility-success-700' : 'border-secondary bg-secondary text-tertiary'
                            }`}>
                              {acc.status}
                            </span>
                          </td>
                          <td className="px-lg py-md text-right font-sans">
                            {acc.status === 'ELIGIBLE' ? (
                              <button
                                onClick={() => claimRent([acc.address])}
                                className="inline-flex items-center gap-sm rounded-lg border border-transparent bg-brand-solid px-md py-xs text-xs font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                              >
                                Reclaim Rent
                              </button>
                            ) : (
                              <span className="text-xs text-utility-success-700 font-medium">Reclaimed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* TOKEN & RUG ANALYZER TAB */}
          {activeTab === 'analyzer' && (
            <div className="space-y-xl">
              <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs space-y-md">
                <h1 className="text-heading-xs font-semibold text-primary">Token Security & Rug-Pull Analyzer</h1>
                <p className="text-xs text-tertiary">Deep inspection of Solana Mint Authorities, Freeze Keys, Liquidity Burn Proof, and Insider Clustering.</p>
                
                {/* Input Recipe */}
                <div className="flex gap-md items-end">
                  <div className="flex-1 flex flex-col gap-sm">
                    <label className="text-sm font-medium text-secondary">Token Mint or Pair Address</label>
                    <input
                      type="text"
                      value={selectedMint}
                      onChange={(e) => setSelectedMint(e.target.value)}
                      placeholder="Enter Solana Mint or Pair Address..."
                      className="rounded-md bg-primary px-lg py-sm text-sm text-primary placeholder:text-placeholder border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring font-mono"
                    />
                  </div>
                  <button
                    onClick={() => runAnalysis(selectedMint)}
                    className="inline-flex items-center gap-sm rounded-lg border border-transparent bg-brand-solid px-lg py-sm text-sm font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    Run Security Audit
                  </button>
                </div>
              </section>

              {analysisReport ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-xl">
                  {/* Score Card */}
                  <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs space-y-lg">
                    <div className="text-center space-y-xs">
                      <p className="text-sm text-tertiary">Overall Security Rating</p>
                      <p className={`text-heading-xl font-bold font-mono ${
                        analysisReport.overallScore >= 80 ? 'text-utility-success-700' : 'text-utility-error-700'
                      }`}>
                        {analysisReport.overallScore}/100
                      </p>
                      <span className={`inline-flex items-center gap-xs rounded-full border px-md py-xxs text-xs font-medium ${
                        analysisReport.overallScore >= 80 ? 'border-utility-success-200 bg-utility-success-50 text-utility-success-700' : 'border-utility-error-200 bg-utility-error-50 text-utility-error-700'
                      }`}>
                        {analysisReport.rugRisk} RUG RISK
                      </span>
                    </div>

                    <div className="space-y-sm text-xs divide-y divide-secondary">
                      <div className="flex items-center justify-between py-xs">
                        <span className="text-secondary">Mint Authority</span>
                        <span className="font-mono text-primary font-medium">{analysisReport.authorities.mintAuthority}</span>
                      </div>
                      <div className="flex items-center justify-between py-xs">
                        <span className="text-secondary">Freeze Authority</span>
                        <span className="font-mono text-primary font-medium">{analysisReport.authorities.freezeAuthority}</span>
                      </div>
                      <div className="flex items-center justify-between py-xs">
                        <span className="text-secondary">Metadata State</span>
                        <span className="font-mono text-primary font-medium">{analysisReport.authorities.metadataUpdateAuthority}</span>
                      </div>
                      <div className="flex items-center justify-between py-xs">
                        <span className="text-secondary">LP Lock / Burn</span>
                        <span className="font-mono text-primary font-medium">{analysisReport.liquidity.status}</span>
                      </div>
                    </div>
                  </section>

                  {/* Wallet Cluster Analysis */}
                  <section className="md:col-span-2 rounded-xl border border-secondary bg-primary p-xl shadow-xs space-y-md">
                    <h3 className="text-heading-xs font-semibold text-primary">Insider & Ownership Concentration</h3>
                    <div className="grid grid-cols-2 gap-md text-xs">
                      <div className="p-md rounded-xl bg-secondary border border-secondary space-y-xs">
                        <span className="text-tertiary">Developer Wallet Balance</span>
                        <p className="text-heading-xs font-semibold font-mono text-primary">{analysisReport.walletConcentration.devWalletHoldingsPct}%</p>
                        <p className="text-xs text-secondary">{analysisReport.walletConcentration.devWalletHoldingsPct > 5 ? 'Warning: High dev concentration' : 'Healthy low holding'}</p>
                      </div>
                      <div className="p-md rounded-xl bg-secondary border border-secondary space-y-xs">
                        <span className="text-tertiary">Top 10 Holders Supply</span>
                        <p className="text-heading-xs font-semibold font-mono text-primary">{analysisReport.walletConcentration.top10HoldersPct}%</p>
                        <p className="text-xs text-secondary">Insider cluster count: {analysisReport.walletConcentration.insiderClusterCount}</p>
                      </div>
                    </div>

                    <div className="space-y-xs pt-md">
                      <p className="text-xs font-semibold text-secondary uppercase">Deterministic Sentinel Checks</p>
                      <div className="space-y-xs">
                        {analysisReport.detections.map((det: any, i: number) => (
                          <div key={i} className={`flex gap-lg rounded-xl p-xl ${
                            det.severity === 'HIGH' ? 'bg-utility-error-50 text-utility-error-600' : 'bg-utility-success-50 text-utility-success-600'
                          }`}>
                            {det.severity === 'HIGH' ? <AlertTriangle className="size-5 shrink-0" /> : <ShieldCheck className="size-5 shrink-0" />}
                            <div>
                              <p className="text-sm font-semibold">{det.category}</p>
                              <p className="mt-xxs text-sm text-tertiary">{det.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                </div>
              ) : (
                <section className="rounded-xl border border-secondary bg-primary p-xl text-center text-tertiary text-sm">
                  Select a token from the scanner or click "Run Security Audit" to load detailed on-chain token bytecode and authority status.
                </section>
              )}
            </div>
          )}

          {/* ORDER FLOW & WHALE TRACKER TAB */}
          {activeTab === 'orderflow' && (
            <div className="space-y-xl">
              <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs flex items-center justify-between">
                <div>
                  <h1 className="text-heading-xs font-semibold text-primary">Whale & Order Flow Intelligence</h1>
                  <p className="text-xs text-tertiary">Real-time transaction velocity, smart-money accumulation, and volume acceleration.</p>
                </div>
                <div className="text-xs text-secondary">
                  Net 24h Flow: <span className="font-mono text-utility-success-700 font-bold">+{orderFlow.netFlowSol24h} SOL</span>
                </div>
              </section>

              {/* Pressure Bar & Chart */}
              <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs space-y-md">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-utility-success-700">Buy Pressure ({orderFlow.buyPressurePct}%)</span>
                  <span className="text-utility-error-700">Sell Pressure ({orderFlow.sellPressurePct}%)</span>
                </div>
                <div className="h-3 w-full rounded-full bg-utility-error-50 overflow-hidden flex">
                  <div className="h-full bg-utility-success-700 transition-all duration-500" style={{ width: `${orderFlow.buyPressurePct}%` }} />
                </div>
              </section>

              {/* Transactions Stream Table */}
              <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs space-y-md">
                <h3 className="text-heading-xs font-semibold text-primary">Whale & Smart-Money Transaction Stream</h3>
                <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
                  <table className="w-full text-left font-mono">
                    <thead className="sticky top-0 z-10 bg-secondary font-sans">
                      <tr className="border-b border-secondary">
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Type</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Token</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Amount (SOL)</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Value (USD)</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Trader</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">DEX</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary text-right">Age</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderFlow.recentTrades.map((tx: any, idx: number) => (
                        <tr key={idx} className="border-b border-secondary hover:bg-secondary-hover">
                          <td className="px-lg py-md">
                            <span className={`inline-flex items-center gap-xs rounded-full border px-md py-xxs text-xs font-semibold font-sans ${
                              tx.type === 'BUY'
                                ? 'border-utility-success-200 bg-utility-success-50 text-utility-success-700'
                                : 'border-utility-error-200 bg-utility-error-50 text-utility-error-700'
                            }`}>
                              {tx.isWhale ? 'WHALE ' : ''}{tx.type}
                            </span>
                          </td>
                          <td className="px-lg py-md font-sans font-bold text-primary">${tx.tokenSymbol}</td>
                          <td className="px-lg py-md text-secondary">{tx.amountSol.toFixed(2)} SOL</td>
                          <td className="px-lg py-md text-secondary">${tx.amountUsd.toFixed(2)}</td>
                          <td className="px-lg py-md text-tertiary">{tx.trader.slice(0, 8)}...</td>
                          <td className="px-lg py-md font-sans text-xs text-secondary">{tx.dex}</td>
                          <td className="px-lg py-md text-right text-tertiary font-sans text-xs">{tx.timeAgo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* POSITIONS TAB */}
          {activeTab === 'positions' && (
            <div className="space-y-xl">
              <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs flex items-center justify-between">
                <div>
                  <h1 className="text-heading-xs font-semibold text-primary">Open Positions & Real-Time Risk Exit</h1>
                  <p className="text-xs text-tertiary">Real-time PnL monitoring, dynamic trailing take-profit, and emergency liquidation controls.</p>
                </div>
                <span className="text-xs text-secondary font-mono">{positions.length} Positions</span>
              </section>

              <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs space-y-md">
                <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
                  <table className="w-full text-left font-mono">
                    <thead className="sticky top-0 z-10 bg-secondary font-sans">
                      <tr className="border-b border-secondary">
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Token / Pair</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Entry Price</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Current Price</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Invested</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Unrealized PnL</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">ATA Address</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary text-right font-sans">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map((pos) => (
                        <tr key={pos.id} className="border-b border-secondary hover:bg-secondary-hover">
                          <td className="px-lg py-md font-sans">
                            <p className="font-semibold text-primary">{pos.tokenName} (${pos.tokenSymbol})</p>
                            <p className="text-xs text-tertiary font-mono">{pos.pair} • {pos.dex}</p>
                          </td>
                          <td className="px-lg py-md text-sm text-tertiary">${pos.entryPrice.toFixed(6)}</td>
                          <td className="px-lg py-md text-sm text-tertiary">${pos.currentPrice.toFixed(6)}</td>
                          <td className="px-lg py-md text-sm text-secondary">{pos.investedSol.toFixed(2)} SOL</td>
                          <td className="px-lg py-md text-sm text-utility-success-700 font-bold">
                            +{pos.unrealizedPnlPct.toFixed(2)}% (+{pos.unrealizedPnlSol.toFixed(3)} SOL)
                          </td>
                          <td className="px-lg py-md text-tertiary text-xs">{pos.ataAddress.slice(0, 10)}...</td>
                          <td className="px-lg py-md text-right font-sans">
                            <button
                              onClick={() => closePosition(pos.id)}
                              className="inline-flex items-center gap-sm rounded-lg border border-transparent bg-error-primary px-lg py-sm text-sm font-semibold text-primary-on-brand shadow-xs hover:bg-error-secondary focus-visible:ring-2 focus-visible:ring-focus-ring"
                            >
                              Close Position
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* BACKTESTING TAB */}
          {activeTab === 'backtest' && (
            <div className="space-y-xl">
              <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs">
                <h1 className="text-heading-xs font-semibold text-primary">Quantitative Strategy Backtester</h1>
                <p className="text-xs text-tertiary">Run historical simulation against Solana on-chain DEX launches, fee models, and slippage curves.</p>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-xl">
                {/* Backtest Config */}
                <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs space-y-md">
                  <h3 className="text-heading-xs font-semibold text-primary">Simulation Parameters</h3>
                  <div className="space-y-md">
                    <div className="flex flex-col gap-sm">
                      <label className="text-sm font-medium text-secondary">Strategy</label>
                      <select
                        value={backtestConfig.strategyName}
                        onChange={(e) => setBacktestConfig({ ...backtestConfig, strategyName: e.target.value })}
                        className="rounded-md bg-primary px-lg py-sm text-sm text-primary border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring"
                      >
                        <option>New Launch Sniping + AI Sentinel</option>
                        <option>Volume Breakout & Whale Follow</option>
                        <option>Pump.fun Curve Bonding Snipe</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-sm">
                      <label className="text-sm font-medium text-secondary">Time Horizon</label>
                      <select
                        value={backtestConfig.timePeriod}
                        onChange={(e) => setBacktestConfig({ ...backtestConfig, timePeriod: e.target.value })}
                        className="rounded-md bg-primary px-lg py-sm text-sm text-primary border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring"
                      >
                        <option value="24H">Last 24 Hours</option>
                        <option value="7D">Last 7 Days</option>
                        <option value="30D">Last 30 Days</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-sm">
                      <label className="text-sm font-medium text-secondary">Initial Capital (SOL)</label>
                      <input
                        type="number"
                        value={backtestConfig.initialSol}
                        onChange={(e) => setBacktestConfig({ ...backtestConfig, initialSol: Number(e.target.value) })}
                        className="rounded-md bg-primary px-lg py-sm text-sm text-primary placeholder:text-placeholder border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-sm">
                      <label className="text-sm font-medium text-secondary">Take Profit %</label>
                      <input
                        type="number"
                        value={backtestConfig.takeProfitPct}
                        onChange={(e) => setBacktestConfig({ ...backtestConfig, takeProfitPct: Number(e.target.value) })}
                        className="rounded-md bg-primary px-lg py-sm text-sm text-primary placeholder:text-placeholder border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-sm">
                      <label className="text-sm font-medium text-secondary">Stop Loss %</label>
                      <input
                        type="number"
                        value={backtestConfig.stopLossPct}
                        onChange={(e) => setBacktestConfig({ ...backtestConfig, stopLossPct: Number(e.target.value) })}
                        className="rounded-md bg-primary px-lg py-sm text-sm text-primary placeholder:text-placeholder border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring font-mono"
                      />
                    </div>
                    <button
                      onClick={runBacktest}
                      className="w-full inline-flex items-center justify-center gap-sm rounded-lg border border-transparent bg-brand-solid px-lg py-sm text-sm font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                    >
                      Run Backtest Simulation
                    </button>
                  </div>
                </section>

                {/* Results Panel */}
                <section className="md:col-span-2 rounded-xl border border-secondary bg-primary p-xl shadow-xs space-y-lg">
                  <h3 className="text-heading-xs font-semibold text-primary">Simulation Report</h3>
                  {backtestResult ? (
                    <div className="space-y-lg">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-md font-mono">
                        <section className="rounded-xl border border-secondary bg-secondary p-xl shadow-xs">
                          <p className="text-sm text-tertiary font-sans">Net Return</p>
                          <p className="mt-md text-heading-xs font-semibold text-utility-success-700">+{backtestResult.netProfitSol} SOL</p>
                          <p className="mt-xs text-xs text-utility-success-700">+{backtestResult.roiPct.toFixed(1)}% ROI</p>
                        </section>
                        <section className="rounded-xl border border-secondary bg-secondary p-xl shadow-xs">
                          <p className="text-sm text-tertiary font-sans">Win Rate</p>
                          <p className="mt-md text-heading-xs font-semibold text-primary">{backtestResult.winRatePct}%</p>
                          <p className="mt-xs text-xs text-tertiary">{backtestResult.tradesCount} Trades</p>
                        </section>
                        <section className="rounded-xl border border-secondary bg-secondary p-xl shadow-xs">
                          <p className="text-sm text-tertiary font-sans">Profit Factor</p>
                          <p className="mt-md text-heading-xs font-semibold text-primary">{backtestResult.profitFactor}</p>
                          <p className="mt-xs text-xs text-tertiary">Sharpe {backtestResult.sharpeRatio}</p>
                        </section>
                        <section className="rounded-xl border border-secondary bg-secondary p-xl shadow-xs">
                          <p className="text-sm text-tertiary font-sans">Max Drawdown</p>
                          <p className="mt-md text-heading-xs font-semibold text-utility-error-700">-{backtestResult.maxDrawdownPct}%</p>
                          <p className="mt-xs text-xs text-tertiary">Capital preserved</p>
                        </section>
                      </div>

                      <div className="p-md rounded-xl bg-secondary border border-secondary space-y-xs text-xs">
                        <p className="font-semibold text-secondary uppercase font-sans">Execution Realism Model</p>
                        <div className="flex items-center justify-between text-secondary">
                          <span>Simulated Slippage & Fee Impact:</span>
                          <span className="font-mono text-primary font-medium">0.8% - 2.5% dynamic based on pool liquidity</span>
                        </div>
                        <div className="flex items-center justify-between text-secondary">
                          <span>Simulated MEV / Priority Fee:</span>
                          <span className="font-mono text-primary font-medium">0.001 SOL per transaction</span>
                        </div>
                        <div className="flex items-center justify-between text-secondary">
                          <span>Execution Delay:</span>
                          <span className="font-mono text-primary font-medium">{backtestResult.executionDelayMs}ms</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2xl text-center text-tertiary text-sm">
                      Configure your backtest parameters and click "Run Backtest Simulation".
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}

          {/* PAPER TRADING TAB */}
          {activeTab === 'paper' && (
            <div className="space-y-xl">
              <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs flex items-center justify-between">
                <div>
                  <h1 className="text-heading-xs font-semibold text-primary">Paper Trading Simulation Engine</h1>
                  <p className="text-xs text-tertiary">Live market data execution without spending real SOL. Safely test strategies against live order flow.</p>
                </div>
                <span className="inline-flex items-center gap-xs rounded-full border border-utility-brand-200 bg-utility-brand-50 px-md py-xxs text-xs font-medium text-utility-brand-700">
                  Paper Environment: Active
                </span>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-lg font-mono">
                <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs">
                  <p className="text-sm text-tertiary font-sans">Hypothetical Paper Balance</p>
                  <p className="mt-md text-heading-xs font-semibold text-primary">50.000 SOL</p>
                </section>
                <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs">
                  <p className="text-sm text-tertiary font-sans">Paper Realized Profit</p>
                  <p className="mt-md text-heading-xs font-semibold text-utility-success-700">+8.420 SOL</p>
                </section>
                <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs">
                  <p className="text-sm text-tertiary font-sans">Simulated Execution Delay</p>
                  <p className="mt-md text-heading-xs font-semibold text-primary">45 ms</p>
                </section>
              </div>
            </div>
          )}

          {/* STRATEGIES TAB */}
          {activeTab === 'strategies' && (
            <div className="space-y-xl">
              <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs">
                <h1 className="text-heading-xs font-semibold text-primary">Modular AI & Quantitative Strategies</h1>
                <p className="text-xs text-tertiary">Independent strategy modules with discrete entry, exit, and risk profiles.</p>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
                {[
                  { name: 'Strategy A: New Launch Sniping', desc: 'Identifies new Raydium and Pump.fun pools with 100% burned LP and zero mint authority.', active: true },
                  { name: 'Strategy B: Liquidity Momentum', desc: 'Enters tokens where liquidity inflows accelerate faster than 30% per minute.', active: true },
                  { name: 'Strategy C: Volume Breakout', desc: 'Monitors breakout volume on 5-minute candles with high buy/sell ratios.', active: false },
                  { name: 'Strategy D: Smart Money Tracking', desc: 'Follows verified alpha wallets and whale accumulation patterns.', active: true },
                ].map((strat, i) => (
                  <section key={i} className="rounded-xl border border-secondary bg-primary p-xl shadow-xs space-y-md">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-primary text-base">{strat.name}</span>
                      <span className={`inline-flex items-center gap-xs rounded-full border px-md py-xxs text-xs font-medium ${
                        strat.active ? 'border-utility-brand-200 bg-utility-brand-50 text-utility-brand-700' : 'border-secondary bg-secondary text-tertiary'
                      }`}>
                        {strat.active ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </div>
                    <p className="text-xs text-secondary leading-relaxed">{strat.desc}</p>
                    <div className="flex items-center justify-between pt-xs">
                      <span className="text-xs text-tertiary">Deterministic Risk Guard: ON</span>
                      <button className="inline-flex items-center gap-sm rounded-lg bg-primary px-lg py-sm text-sm font-semibold text-secondary border border-primary shadow-xs hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-focus-ring">
                        Configure
                      </button>
                    </div>
                  </section>
                ))}
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-xl">
              <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs">
                <h1 className="text-heading-xs font-semibold text-primary">Bot Configuration & Risk Sentinel</h1>
                <p className="text-xs text-tertiary">Centralized execution parameters, spending limits, and emergency circuit breakers.</p>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
                <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs space-y-md">
                  <h3 className="text-heading-xs font-semibold text-primary">Execution Settings</h3>
                  <div className="space-y-md">
                    <div className="flex flex-col gap-sm">
                      <label className="text-sm font-medium text-secondary">Snipe Amount (SOL per trade)</label>
                      <input
                        type="number"
                        value={botConfig.buyAmountSol}
                        onChange={(e) => setBotConfig({ ...botConfig, buyAmountSol: Number(e.target.value) })}
                        className="rounded-md bg-primary px-lg py-sm text-sm text-primary placeholder:text-placeholder border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-sm">
                      <label className="text-sm font-medium text-secondary">Max Slippage %</label>
                      <input
                        type="number"
                        value={botConfig.maxSlippagePct}
                        onChange={(e) => setBotConfig({ ...botConfig, maxSlippagePct: Number(e.target.value) })}
                        className="rounded-md bg-primary px-lg py-sm text-sm text-primary placeholder:text-placeholder border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-sm">
                      <label className="text-sm font-medium text-secondary">Take Profit %</label>
                      <input
                        type="number"
                        value={botConfig.takeProfitPct}
                        onChange={(e) => setBotConfig({ ...botConfig, takeProfitPct: Number(e.target.value) })}
                        className="rounded-md bg-primary px-lg py-sm text-sm text-primary placeholder:text-placeholder border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-sm">
                      <label className="text-sm font-medium text-secondary">Stop Loss %</label>
                      <input
                        type="number"
                        value={botConfig.stopLossPct}
                        onChange={(e) => setBotConfig({ ...botConfig, stopLossPct: Number(e.target.value) })}
                        className="rounded-md bg-primary px-lg py-sm text-sm text-primary placeholder:text-placeholder border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring font-mono"
                      />
                    </div>
                    <button
                      onClick={async () => {
                        await fetch('/api/tatum/sniper/config', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(botConfig)
                        })
                        setActionNotice('Updated bot settings successfully.')
                      }}
                      className="w-full inline-flex items-center justify-center gap-sm rounded-lg border border-transparent bg-brand-solid px-lg py-sm text-sm font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                    >
                      Save Configuration
                    </button>
                  </div>
                </section>

                <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs space-y-md">
                  <h3 className="text-heading-xs font-semibold text-primary">Rent Recovery & Circuit Breaker</h3>
                  <div className="p-md rounded-xl bg-secondary border border-secondary space-y-xs">
                    <p className="font-semibold text-primary text-sm">Auto-Rent Recovery After Exit</p>
                    <p className="text-xs text-tertiary">Automatically execute CloseAccount or WithdrawExcessLamports instructions upon closing any trading position.</p>
                    <div className="flex items-center gap-xs pt-xs">
                      <span className="w-2 h-2 rounded-full bg-success-primary" />
                      <span className="text-utility-success-700 font-semibold text-xs">Enabled</span>
                    </div>
                  </div>

                  <div className="p-md rounded-xl bg-secondary border border-secondary space-y-xs">
                    <p className="font-semibold text-primary text-sm">Deterministic Circuit Breaker</p>
                    <p className="text-xs text-tertiary">Pauses all new buy orders if daily drawdown exceeds 10% or if RPC errors exceed threshold.</p>
                    <div className="flex items-center gap-xs pt-xs">
                      <span className="w-2 h-2 rounded-full bg-success-primary" />
                      <span className="text-utility-success-700 font-semibold text-xs">Armed & Enforced</span>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
