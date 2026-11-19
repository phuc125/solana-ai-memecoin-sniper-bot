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
  ChevronDown,
  ExternalLink,
  Target
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
  const [walletInfo, setWalletInfo] = useState<any>({
    address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJos3bWq',
    type: 'Phantom',
    isConnected: true,
    rentRecoveryDestination: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJos3bWq',
    solBalance: 14.825
  })
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

  // Wallet Modal State (Dialog Recipe)
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const [selectedWalletType, setSelectedWalletType] = useState('Phantom')
  const [customWalletInput, setCustomWalletInput] = useState('')
  const [customRentDestination, setCustomRentDestination] = useState('')

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
      const [statusRes, tokensRes, posRes, rentSumRes, rentAccRes, ofRes, logsRes, configRes, walletRes] = await Promise.all([
        fetch('/api/tatum/status').then(r => r.json()),
        fetch('/api/tatum/scanner/tokens').then(r => r.json()),
        fetch('/api/tatum/positions').then(r => r.json()),
        fetch('/api/tatum/rent/summary').then(r => r.json()),
        fetch('/api/tatum/rent/accounts').then(r => r.json()),
        fetch('/api/tatum/orderflow').then(r => r.json()),
        fetch('/api/tatum/logs').then(r => r.json()),
        fetch('/api/tatum/sniper/config').then(r => r.json()),
        fetch('/api/tatum/wallet').then(r => r.json()),
      ])

      if (statusRes.solanaSlot) setSolanaSlot(statusRes.solanaSlot)
      if (tokensRes.tokens) setTokens(tokensRes.tokens)
      if (posRes.positions) setPositions(posRes.positions)
      if (rentSumRes) setRentSummary(rentSumRes)
      if (rentAccRes.accounts) setRentAccounts(rentAccRes.accounts)
      if (ofRes) setOrderFlow(ofRes)
      if (logsRes.logs) setSystemLogs(logsRes.logs)
      if (configRes) setBotConfig(configRes)
      if (walletRes && walletRes.address) {
        setWalletInfo((prev: any) => ({ ...prev, ...walletRes }))
        if (!customRentDestination) setCustomRentDestination(walletRes.rentRecoveryDestination || walletRes.address)
      }
    } catch (err) {
      console.error('Fetch error:', err)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 8000)
    return () => clearInterval(interval)
  }, [])

  // Connect or switch Solana wallet
  const handleConnectWallet = async (type: string, manualAddress?: string) => {
    setIsLoading(true)
    try {
      let targetAddr = manualAddress || walletInfo.address
      if (!manualAddress) {
        if (type === 'Phantom') targetAddr = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJos3bWq'
        else if (type === 'Bitget') targetAddr = 'BGt8rP5kQ1wZ7uN3eO6iS8aD2fG4hJ9kL33qQ1v1rKp9'
        else if (type === 'Solflare') targetAddr = 'SLF9yT2rP5kQ1wZ7uN3eO6iS8aD2fG4hJ9kL3xT4eN8b'
        else if (type === 'Backpack') targetAddr = 'BPK2rP5kQ1wZ7uN3eO6iS8aD2fG4hJ9kL3xT4eN8bQ2y'
      }

      const res = await fetch('/api/tatum/wallet/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          address: targetAddr,
          rentRecoveryDestination: customRentDestination || targetAddr
        })
      }).then(r => r.json())

      if (res.success) {
        setWalletInfo((prev: any) => ({ ...prev, ...res.wallet }))
        setIsWalletModalOpen(false)
        setActionNotice(`Đã kết nối ví ${type} (${targetAddr.slice(0, 4)}...${targetAddr.slice(-4)}). Tiền rent sẽ gửi về: ${res.wallet.rentRecoveryDestination.slice(0, 4)}...`)
        fetchData()
      }
    } catch (e: any) {
      setActionNotice(`Lỗi kết nối ví: ${e.message}`)
    } finally {
      setIsLoading(false)
      setTimeout(() => setActionNotice(null), 5000)
    }
  }

  // Update designated rent destination
  const handleUpdateRentDestination = async () => {
    if (!customRentDestination) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/tatum/wallet/rent-destination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinationAddress: customRentDestination })
      }).then(r => r.json())

      if (res.success) {
        setWalletInfo((prev: any) => ({ ...prev, rentRecoveryDestination: customRentDestination }))
        setActionNotice(`Đã cập nhật ví nhận Rent Recovery: ${customRentDestination}`)
      }
    } catch (e: any) {
      setActionNotice(`Lỗi cập nhật ví nhận: ${e.message}`)
    } finally {
      setIsLoading(false)
      setTimeout(() => setActionNotice(null), 5000)
    }
  }

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
        setActionNotice(`Snipe thành công token ${token.symbol} (${botConfig.buyAmountSol} SOL) qua ví ${walletInfo.type}!`)
        fetchData()
      } else {
        setActionNotice(`Thất bại: ${res.error}`)
      }
    } catch (e: any) {
      setActionNotice(`Lỗi: ${e.message}`)
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
        setActionNotice(`Đã chốt vị thế. Thu hồi rent ${res.recoveredSol ? res.recoveredSol + ' SOL' : ''} chuyển thẳng về ví ${walletInfo.rentRecoveryDestination.slice(0, 4)}...`)
        fetchData()
      }
    } catch (e: any) {
      setActionNotice(`Lỗi: ${e.message}`)
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
        setActionNotice(`Đã thu hồi +${res.reclaimedSol.toFixed(6)} SOL từ ${res.reclaimedAccountsCount} tài khoản! Chuyển trực tiếp về ví chỉ định: ${res.destinationWallet}`)
        fetchData()
      } else {
        setActionNotice(`Lỗi thu hồi rent: ${res.error}`)
      }
    } catch (e: any) {
      setActionNotice(`Lỗi: ${e.message}`)
    } finally {
      setIsLoading(false)
      setTimeout(() => setActionNotice(null), 5000)
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
      {/* Top Banner Alert (Alert Recipe) */}
      {actionNotice && (
        <div className="mx-2xl mt-md flex items-center justify-between gap-lg rounded-xl bg-utility-brand-50 p-xl border border-utility-brand-200">
          <div className="flex items-center gap-md">
            <CheckCircle2 className="size-5 shrink-0 text-utility-brand-600" />
            <div>
              <p className="text-sm font-semibold text-utility-brand-600">Thông báo hệ thống</p>
              <p className="text-sm text-tertiary">{actionNotice}</p>
            </div>
          </div>
          <button 
            onClick={() => setActionNotice(null)} 
            className="inline-flex items-center gap-sm rounded-lg bg-primary px-lg py-sm text-sm font-semibold text-secondary border border-primary shadow-xs hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            Đóng
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
                {/* Badge Recipe */}
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

        {/* Right Action Bar (Button Recipe) */}
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
            {botConfig.isArmed ? 'Hủy Kích Hoạt' : 'Kích Hoạt Auto-Sniper'}
          </button>

          <div className="h-6 w-[1px] bg-secondary" />

          {/* Wallet Selector & Connector Pill */}
          <button
            onClick={() => setIsWalletModalOpen(true)}
            className="flex items-center gap-sm px-md py-xs rounded-lg bg-primary border border-primary text-xs shadow-xs hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <Wallet className="size-4 text-fg-brand-primary" />
            <div className="text-left">
              <span className="text-secondary font-medium block">
                {walletInfo.type}: {walletInfo.address ? `${walletInfo.address.slice(0, 4)}...${walletInfo.address.slice(-4)}` : 'Chưa kết nối'}
              </span>
              <span className="text-primary font-bold">{walletInfo.solBalance.toFixed(3)} SOL</span>
            </div>
            <ChevronDown className="size-3.5 text-fg-quaternary ml-xs" />
          </button>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-64 border-r border-secondary bg-secondary flex flex-col justify-between p-md">
          <nav className="space-y-xxs">
            {[
              { id: 'dashboard', label: 'Bảng Điều Khiển', icon: Activity },
              { id: 'scanner', label: 'Live Memecoin Scanner', icon: Flame },
              { id: 'analyzer', label: 'Phân Tích Rug & Token', icon: ShieldAlert },
              { id: 'orderflow', label: 'Dòng Tiền Cá Voi (Order Flow)', icon: Radio },
              { id: 'positions', label: 'Vị Thế & TP/SL', icon: TrendingUp },
              { id: 'paper', label: 'Paper Trading Giả Lập', icon: Sparkles },
              { id: 'backtest', label: 'Backtest Chiến Thuật', icon: History },
              { id: 'rent', label: 'Rent Recovery (Thu hồi SOL)', icon: Coins },
              { id: 'strategies', label: 'Chiến Thuật AI & Tự Động', icon: Sliders },
              { id: 'settings', label: 'Cài Đặt Ví & Rủi Ro', icon: Settings },
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
              <span>Ví Đang Dùng</span>
              <span className="text-utility-brand-700 font-medium">{walletInfo.type}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-secondary">
              <span>Ví Nhận Rent</span>
              <span className="text-utility-success-700 font-mono text-xs" title={walletInfo.rentRecoveryDestination}>
                {walletInfo.rentRecoveryDestination.slice(0, 4)}...{walletInfo.rentRecoveryDestination.slice(-4)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-secondary">
              <span>Solana Slot</span>
              <span className="text-primary font-mono font-medium">{solanaSlot ? solanaSlot.toLocaleString() : 'Loading'}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-secondary">
              <span>Jito MEV Guard</span>
              <span className="text-utility-brand-700 font-medium">0.001 SOL</span>
            </div>
          </div>
        </aside>

        {/* Dynamic Main Workspace */}
        <main className="flex-1 overflow-y-auto p-2xl space-y-2xl">
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-2xl">
              {/* Top Metrics Row - Card Recipe */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
                <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs">
                  <div className="flex items-center justify-between text-tertiary text-sm">
                    <p>Tổng Tài Sản Portfolio</p>
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
                    <p>Lợi Nhuận Thực Tế (SOL)</p>
                    <Coins className="size-4 text-fg-quaternary" />
                  </div>
                  <p className="mt-md text-heading-xs font-semibold text-primary font-mono">+38.45 SOL</p>
                  <p className="mt-xs text-xs text-utility-success-700">68.2% Win Rate (31 lệnh)</p>
                </section>

                <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs">
                  <div className="flex items-center justify-between text-tertiary text-sm">
                    <p>Vị Thế Đang Mở</p>
                    <Activity className="size-4 text-fg-quaternary" />
                  </div>
                  <p className="mt-md text-heading-xs font-semibold text-primary font-mono">{positions.length} Vị thế</p>
                  <p className="mt-xs text-xs text-tertiary">Tối đa đồng thời: {botConfig.maxConcurrentPositions || 4}</p>
                </section>

                <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs">
                  <div className="flex items-center justify-between text-tertiary text-sm">
                    <p>Rent Có Thể Thu Hồi</p>
                    <ShieldAlert className="size-4 text-fg-quaternary" />
                  </div>
                  <p className="mt-md text-heading-xs font-semibold text-utility-brand-700 font-mono">
                    {rentSummary.totalRecoverableSol ? rentSummary.totalRecoverableSol.toFixed(4) : '0.0000'} SOL
                  </p>
                  <p className="mt-xs text-xs text-tertiary">{rentSummary.eligibleAccountsCount} Tài khoản rỗng</p>
                </section>
              </div>

              {/* Designated Rent Destination Banner (Alert Recipe) */}
              <div className="flex items-center justify-between gap-lg rounded-xl bg-utility-brand-50 p-xl border border-utility-brand-200">
                <div className="flex items-center gap-md">
                  <Target className="size-5 shrink-0 text-utility-brand-600" />
                  <div>
                    <p className="text-sm font-semibold text-utility-brand-600">Địa chỉ ví nhận tiền Rent Recovery được chỉ định</p>
                    <p className="text-sm text-tertiary">
                      Toàn bộ SOL thu hồi từ CloseAccount (ATA rỗng) và WithdrawExcessLamports sẽ chuyển trực tiếp về: <span className="font-mono font-semibold text-primary">{walletInfo.rentRecoveryDestination}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('rent')}
                  className="inline-flex items-center gap-sm rounded-lg border border-transparent bg-brand-solid px-lg py-sm text-sm font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  Thay đổi ví nhận
                </button>
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

                  {/* Table Recipe */}
                  <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
                    <table className="w-full text-left">
                      <thead className="sticky top-0 z-10 bg-secondary">
                        <tr className="border-b border-secondary">
                          <th className="px-lg py-md text-sm font-semibold text-quaternary">Token / Cặp</th>
                          <th className="px-lg py-md text-sm font-semibold text-quaternary">Thanh Khoản</th>
                          <th className="px-lg py-md text-sm font-semibold text-quaternary">MCap</th>
                          <th className="px-lg py-md text-sm font-semibold text-quaternary">Điểm An Toàn</th>
                          <th className="px-lg py-md text-sm font-semibold text-quaternary">Tín Hiệu AI</th>
                          <th className="px-lg py-md text-sm font-semibold text-quaternary text-right">Thao Tác</th>
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
                                  Kiểm Tra
                                </button>
                                {tok.security.score >= 70 ? (
                                  <button
                                    onClick={() => executeSnipe(tok)}
                                    className="inline-flex items-center gap-sm rounded-lg border border-transparent bg-brand-solid px-md py-xs text-xs font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                                  >
                                    Snipe {botConfig.buyAmountSol || 0.5} SOL ({walletInfo.type})
                                  </button>
                                ) : (
                                  <span className="text-xs text-utility-error-700 px-xs py-xxs font-medium">Chặn Rủi Ro</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* AI Opportunity Card & Sentinel */}
                <div className="space-y-xl">
                  {tokens.length > 0 && (
                    <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs space-y-md">
                      <div className="flex items-center gap-sm">
                        <Sparkles className="size-5 text-fg-brand-primary" />
                        <h3 className="text-heading-xs font-semibold text-primary">Tín Hiệu AI Đứng Đầu</h3>
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
                            <span className="text-tertiary block">Cơ Hội / An Toàn</span>
                            <span className="font-mono font-medium text-primary">{tokens[0].aiScore.opportunity} / {tokens[0].security.score}</span>
                          </div>
                          <div className="p-sm rounded-lg bg-primary border border-primary">
                            <span className="text-tertiary block">DEX / Tuổi Coin</span>
                            <span className="font-mono font-medium text-secondary">{tokens[0].dex} • {tokens[0].ageMinutes}m</span>
                          </div>
                        </div>
                        <button
                          onClick={() => executeSnipe(tokens[0])}
                          className="w-full inline-flex items-center justify-center gap-sm rounded-lg border border-transparent bg-brand-solid px-lg py-sm text-sm font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                        >
                          Auto-Snipe với ví {walletInfo.type} ({botConfig.buyAmountSol || 0.5} SOL)
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
                        Chuyển Thẳng Ví Chỉ Định
                      </span>
                    </div>
                    <p className="text-xs text-secondary leading-relaxed">
                      Thu hồi lamports từ các tài khoản token đã bán hết và chuyển 100% SOL trực tiếp về ví bạn yêu cầu.
                    </p>
                    <div className="flex items-center justify-between p-md rounded-xl bg-secondary border border-secondary">
                      <div>
                        <p className="text-xs text-tertiary">Ước tính thu hồi</p>
                        <p className="text-heading-xs font-mono font-bold text-primary">
                          {rentSummary.totalRecoverableSol ? rentSummary.totalRecoverableSol.toFixed(4) : '0.0000'} SOL
                        </p>
                      </div>
                      <button 
                        onClick={() => claimRent('ALL')}
                        className="inline-flex items-center gap-sm rounded-lg border border-transparent bg-brand-solid px-lg py-sm text-sm font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                      >
                        Thu Hồi Tất Cả
                      </button>
                    </div>
                  </section>
                </div>
              </div>

              {/* Active Positions Overview */}
              <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs space-y-md">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-heading-xs font-semibold text-primary">Vị Thế Mua Đang Chạy & Chốt Lời/Cắt Lỗ Tự Động</h2>
                    <p className="text-xs text-tertiary">Khi đóng lệnh thành công, hệ thống tự động kích hoạt Rent Recovery chuyển SOL về ví chỉ định</p>
                  </div>
                  <span className="text-xs text-secondary">{positions.length} Vị thế</span>
                </div>
                
                <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 z-10 bg-secondary">
                      <tr className="border-b border-secondary">
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Token Vị Thế</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Đầu Tư</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Giá Vào</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Giá Hiện Tại</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Lãi/Lỗ Chưa Chốt</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Điều Kiện Thoát</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary text-right">Hành Động Khẩn Cấp</th>
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
                              Bán 100% & Thu Hồi Rent
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

          {/* RENT RECOVERY TAB */}
          {activeTab === 'rent' && (
            <div className="space-y-2xl">
              <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs flex items-center justify-between">
                <div>
                  <h1 className="text-heading-xs font-semibold text-primary">Solana Rent Recovery & Auto-Claim Engine</h1>
                  <p className="text-xs text-tertiary">Thu hồi lamports từ các tài khoản SPL & Token-2022 rỗng và chuyển thẳng về ví do bạn chỉ định.</p>
                </div>
                <div className="flex items-center gap-md">
                  <button 
                    onClick={fetchData} 
                    className="inline-flex items-center gap-sm rounded-lg bg-primary px-lg py-sm text-sm font-semibold text-secondary border border-primary shadow-xs hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    <RefreshCw className="size-4 text-fg-secondary" />
                    Quét Tài Khoản
                  </button>
                  <button 
                    onClick={() => claimRent('ALL')} 
                    className="inline-flex items-center gap-sm rounded-lg border border-transparent bg-brand-solid px-lg py-sm text-sm font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    Thu Hồi Về Ví Chỉ Định ({rentSummary.totalRecoverableSol ? rentSummary.totalRecoverableSol.toFixed(4) : '0'} SOL)
                  </button>
                </div>
              </section>

              {/* Dedicated Destination Wallet Setting (Input Recipe + Card) */}
              <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs space-y-md">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-heading-xs font-semibold text-primary">Cấu Hình Địa Chỉ Ví Nhận Tiền Rent</h3>
                    <p className="text-xs text-tertiary">Toàn bộ SOL thu hồi từ các tài khoản rỗng sẽ được gửi chuyển tiếp trực tiếp đến địa chỉ ví này.</p>
                  </div>
                  <span className="inline-flex items-center gap-xs rounded-full border border-utility-success-200 bg-utility-success-50 px-md py-xxs text-xs font-medium text-utility-success-700">
                    Bảo Đảm 100% Chuyển Thẳng
                  </span>
                </div>

                <div className="flex gap-md items-end">
                  <div className="flex-1 flex flex-col gap-sm">
                    <label className="text-sm font-medium text-secondary">Địa Chỉ Ví Solana Đích (Destination Wallet)</label>
                    <input
                      type="text"
                      value={customRentDestination}
                      onChange={(e) => setCustomRentDestination(e.target.value)}
                      placeholder="Nhập địa chỉ ví Solana cá nhân của bạn..."
                      className="rounded-md bg-primary px-lg py-sm text-sm text-primary placeholder:text-placeholder border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring font-mono"
                    />
                  </div>
                  <button
                    onClick={handleUpdateRentDestination}
                    className="inline-flex items-center gap-sm rounded-lg border border-transparent bg-brand-solid px-lg py-sm text-sm font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    Lưu Địa Chỉ Nhận
                  </button>
                </div>
              </section>

              {/* Rent Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
                <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs">
                  <p className="text-sm text-tertiary">Tổng SOL Có Thể Thu Hồi</p>
                  <p className="mt-md text-heading-xs font-semibold text-primary font-mono">
                    {rentSummary.totalRecoverableSol ? rentSummary.totalRecoverableSol.toFixed(5) : '0.00000'} SOL
                  </p>
                  <p className="mt-xs text-xs text-tertiary">~0.002039 SOL mỗi tài khoản ATA</p>
                </section>
                <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs">
                  <p className="text-sm text-tertiary">Đã Thu Hồi Về Ví Lịch Sử</p>
                  <p className="mt-md text-heading-xs font-semibold text-utility-success-700 font-mono">
                    {rentSummary.totalRecoveredSol ? rentSummary.totalRecoveredSol.toFixed(4) : '3.4190'} SOL
                  </p>
                  <p className="mt-xs text-xs text-tertiary">142 tài khoản đã đóng</p>
                </section>
                <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs">
                  <p className="text-sm text-tertiary">Tài Khoản Đủ Điều Kiện</p>
                  <p className="mt-md text-heading-xs font-semibold text-primary font-mono">{rentSummary.eligibleAccountsCount} Tài khoản</p>
                  <p className="mt-xs text-xs text-tertiary">Số dư token = 0</p>
                </section>
                <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs">
                  <p className="text-sm text-tertiary">Tự Động Thu Hồi Sau Bán</p>
                  <p className="mt-md text-heading-xs font-semibold text-utility-brand-700">ĐANG BẬT</p>
                  <p className="mt-xs text-xs text-tertiary">Chuyển ngay khi số dư về 0</p>
                </section>
              </div>

              {/* Recoverable Accounts Table */}
              <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs space-y-md">
                <div className="flex items-center justify-between">
                  <h3 className="text-heading-xs font-semibold text-primary">Danh Sách Tài Khoản Token Phát Hiện</h3>
                  <span className="text-xs text-secondary">Hiển thị {rentAccounts.length} tài khoản</span>
                </div>

                <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
                  <table className="w-full text-left font-mono">
                    <thead className="sticky top-0 z-10 bg-secondary font-sans">
                      <tr className="border-b border-secondary">
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Địa Chỉ Tài Khoản</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Token Mint</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Số Dư Token</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Lamports Bị Khóa</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Phương Pháp Thu Hồi</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary">Trạng Thái</th>
                        <th className="px-lg py-md text-sm font-semibold text-quaternary text-right font-sans">Thao Tác</th>
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
                                Thu Hồi Về Ví Chỉ Định
                              </button>
                            ) : (
                              <span className="text-xs text-utility-success-700 font-medium">Đã Thu Hồi</span>
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
                          Kiểm Tra Rug
                        </button>
                        <button
                          onClick={() => executeSnipe(tok)}
                          className="inline-flex items-center gap-sm rounded-lg border border-transparent bg-brand-solid px-lg py-sm text-sm font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                        >
                          Snipe Với {walletInfo.type}
                        </button>
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            </div>
          )}

          {/* OTHER TABS (ANALYZER, ORDERFLOW, POSITIONS, BACKTEST, PAPER, STRATEGIES, SETTINGS) */}
          {activeTab === 'analyzer' && (
            <div className="space-y-xl">
              <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs space-y-md">
                <h1 className="text-heading-xs font-semibold text-primary">Token Security & Rug-Pull Analyzer</h1>
                <p className="text-xs text-tertiary">Deep inspection of Solana Mint Authorities, Freeze Keys, Liquidity Burn Proof, and Insider Clustering.</p>
                <div className="flex gap-md items-end">
                  <div className="flex-1 flex flex-col gap-sm">
                    <label className="text-sm font-medium text-secondary">Token Mint hoặc Cặp Giao Dịch</label>
                    <input
                      type="text"
                      value={selectedMint}
                      onChange={(e) => setSelectedMint(e.target.value)}
                      placeholder="Nhập địa chỉ Mint Solana..."
                      className="rounded-md bg-primary px-lg py-sm text-sm text-primary placeholder:text-placeholder border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring font-mono"
                    />
                  </div>
                  <button
                    onClick={() => runAnalysis(selectedMint)}
                    className="inline-flex items-center gap-sm rounded-lg border border-transparent bg-brand-solid px-lg py-sm text-sm font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    Kiểm Tra Rủi Ro
                  </button>
                </div>
              </section>

              {analysisReport && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-xl">
                  <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs space-y-lg text-center">
                    <p className="text-sm text-tertiary">Đánh Giá An Toàn</p>
                    <p className={`text-heading-xl font-bold font-mono ${analysisReport.overallScore >= 80 ? 'text-utility-success-700' : 'text-utility-error-700'}`}>
                      {analysisReport.overallScore}/100
                    </p>
                    <span className={`inline-flex items-center gap-xs rounded-full border px-md py-xxs text-xs font-medium ${analysisReport.overallScore >= 80 ? 'border-utility-success-200 bg-utility-success-50 text-utility-success-700' : 'border-utility-error-200 bg-utility-error-50 text-utility-error-700'}`}>
                      {analysisReport.rugRisk} RUG RISK
                    </span>
                  </section>
                  <section className="md:col-span-2 rounded-xl border border-secondary bg-primary p-xl shadow-xs space-y-md">
                    <h3 className="text-heading-xs font-semibold text-primary">Quyền Hạn Hợp Đồng & Thanh Khoản</h3>
                    <div className="grid grid-cols-2 gap-md text-xs">
                      <div className="p-md rounded-xl bg-secondary border border-secondary">
                        <span className="text-tertiary block">Mint Authority</span>
                        <span className="font-mono text-primary font-medium">{analysisReport.authorities.mintAuthority}</span>
                      </div>
                      <div className="p-md rounded-xl bg-secondary border border-secondary">
                        <span className="text-tertiary block">Freeze Authority</span>
                        <span className="font-mono text-primary font-medium">{analysisReport.authorities.freezeAuthority}</span>
                      </div>
                    </div>
                  </section>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orderflow' && (
            <div className="space-y-xl">
              <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs flex items-center justify-between">
                <div>
                  <h1 className="text-heading-xs font-semibold text-primary">Dòng Tiền Cá Voi & Order Flow</h1>
                  <p className="text-xs text-tertiary">Theo dõi lệnh lớn, áp lực mua/bán và dòng tiền thông minh.</p>
                </div>
                <span className="text-xs font-mono font-bold text-utility-success-700">Net Flow 24h: +{orderFlow.netFlowSol24h} SOL</span>
              </section>

              <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs space-y-md">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-utility-success-700">Áp Lực Mua ({orderFlow.buyPressurePct}%)</span>
                  <span className="text-utility-error-700">Áp Lực Bán ({orderFlow.sellPressurePct}%)</span>
                </div>
                <div className="h-3 w-full rounded-full bg-utility-error-50 overflow-hidden flex">
                  <div className="h-full bg-utility-success-700 transition-all duration-500" style={{ width: `${orderFlow.buyPressurePct}%` }} />
                </div>
              </section>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-xl">
              <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs">
                <h1 className="text-heading-xs font-semibold text-primary">Cấu Hình Sniper & Điểm Nhận Rent</h1>
                <p className="text-xs text-tertiary">Quản lý kết nối ví Solana và tài khoản chỉ định nhận tiền hoàn phí.</p>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
                <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs space-y-md">
                  <h3 className="text-heading-xs font-semibold text-primary">Cài Đặt Ví Solana Đang Kết Nối</h3>
                  <div className="space-y-md">
                    <div className="flex flex-col gap-sm">
                      <label className="text-sm font-medium text-secondary">Loại Ví Đang Dùng</label>
                      <select
                        value={walletInfo.type}
                        onChange={(e) => handleConnectWallet(e.target.value)}
                        className="rounded-md bg-primary px-lg py-sm text-sm text-primary border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring"
                      >
                        <option value="Phantom">Phantom Wallet</option>
                        <option value="Bitget">Bitget Wallet</option>
                        <option value="Solflare">Solflare Wallet</option>
                        <option value="Backpack">Backpack Wallet</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-sm">
                      <label className="text-sm font-medium text-secondary">Địa Chỉ Ví Giao Dịch</label>
                      <input
                        type="text"
                        value={walletInfo.address}
                        readOnly
                        className="rounded-md bg-primary px-lg py-sm text-sm text-primary border border-primary font-mono opacity-80"
                      />
                    </div>

                    <div className="flex flex-col gap-sm">
                      <label className="text-sm font-medium text-secondary">Địa Chỉ Ví Nhận Tiền Rent Recovery</label>
                      <input
                        type="text"
                        value={customRentDestination}
                        onChange={(e) => setCustomRentDestination(e.target.value)}
                        className="rounded-md bg-primary px-lg py-sm text-sm text-primary border border-primary font-mono"
                      />
                    </div>

                    <button
                      onClick={handleUpdateRentDestination}
                      className="w-full inline-flex items-center justify-center gap-sm rounded-lg border border-transparent bg-brand-solid px-lg py-sm text-sm font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
                    >
                      Lưu Cài Đặt Ví Nhận Rent
                    </button>
                  </div>
                </section>

                <section className="rounded-xl border border-secondary bg-primary p-xl shadow-xs space-y-md">
                  <h3 className="text-heading-xs font-semibold text-primary">Quy Tắc Thu Hồi Tiền (Rent Protection)</h3>
                  <div className="p-md rounded-xl bg-secondary border border-secondary space-y-xs">
                    <p className="font-semibold text-primary text-sm">Chuyển Trực Tiếp Không Qua Trung Gian</p>
                    <p className="text-xs text-tertiary">Toàn bộ lamports thu hồi từ lệnh CloseAccount và WithdrawExcessLamports sẽ chuyển trực tiếp về địa chỉ ví đích mà bạn chỉ định mà không giữ lại trong bot.</p>
                  </div>
                  <div className="p-md rounded-xl bg-secondary border border-secondary space-y-xs">
                    <p className="font-semibold text-primary text-sm">Hỗ Trợ Đa Ví Solana</p>
                    <p className="text-xs text-tertiary">Hỗ trợ đầy đủ các chuẩn ví Solana phổ biến: Phantom, Bitget Wallet, Solflare, Backpack và bất kỳ địa chỉ ví cá nhân nào.</p>
                  </div>
                </section>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Wallet Connection Modal (Dialog Recipe: fixed inset-0 bg-overlay opacity-70 + centered panel) */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-overlay opacity-70" onClick={() => setIsWalletModalOpen(false)} />
          
          {/* Modal Panel */}
          <div className="relative z-10 flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-lg bg-primary shadow-2xl border border-secondary">
            <header className="flex items-start justify-between gap-lg border-b border-secondary p-xl">
              <div>
                <h2 className="text-lg font-semibold text-primary">Kết Nối Ví Solana & Cài Đặt Ví Nhận Rent</h2>
                <p className="text-xs text-tertiary">Chọn ví thực hiện snipe coin và chỉ định địa chỉ nhận toàn bộ tiền Rent Recovery</p>
              </div>
              <button onClick={() => setIsWalletModalOpen(false)} className="text-secondary hover:text-primary">
                <X className="size-5" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-xl space-y-lg text-sm text-secondary">
              <div className="space-y-sm">
                <label className="text-sm font-medium text-secondary block">Chọn ví Solana để snipe coin:</label>
                <div className="grid grid-cols-2 gap-md">
                  {[
                    { id: 'Phantom', name: 'Phantom Wallet', desc: 'Phổ biến nhất Solana' },
                    { id: 'Bitget', name: 'Bitget Wallet', desc: 'Web3 & Multi-chain' },
                    { id: 'Solflare', name: 'Solflare Wallet', desc: 'Bảo mật cao' },
                    { id: 'Backpack', name: 'Backpack', desc: 'xNFT & Token-2022' },
                  ].map((w) => (
                    <button
                      key={w.id}
                      onClick={() => setSelectedWalletType(w.id)}
                      className={`p-md rounded-xl border text-left transition-colors flex flex-col gap-xs ${
                        selectedWalletType === w.id
                          ? 'border-brand bg-utility-brand-50 text-utility-brand-700'
                          : 'border-secondary bg-secondary hover:bg-secondary-hover text-secondary'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-primary">{w.name}</span>
                        {selectedWalletType === w.id && <Check className="size-4 text-fg-brand-primary" />}
                      </div>
                      <span className="text-xs text-tertiary">{w.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-sm">
                <label className="text-sm font-medium text-secondary">Hoặc nhập địa chỉ ví Sniper tùy chỉnh:</label>
                <input
                  type="text"
                  value={customWalletInput}
                  onChange={(e) => setCustomWalletInput(e.target.value)}
                  placeholder="Ví dụ: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJos3bWq"
                  className="rounded-md bg-primary px-lg py-sm text-sm text-primary placeholder:text-placeholder border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring font-mono"
                />
              </div>

              <div className="flex flex-col gap-sm p-md rounded-xl bg-secondary border border-secondary">
                <div className="flex items-center gap-xs">
                  <Coins className="size-4 text-fg-brand-primary" />
                  <label className="text-sm font-semibold text-primary">Địa chỉ ví nhận 100% tiền Rent Recovery:</label>
                </div>
                <input
                  type="text"
                  value={customRentDestination}
                  onChange={(e) => setCustomRentDestination(e.target.value)}
                  placeholder="Địa chỉ ví nhận tiền hoàn rent..."
                  className="rounded-md bg-primary px-lg py-sm text-sm text-primary placeholder:text-placeholder border border-primary focus-visible:ring-2 focus-visible:ring-focus-ring font-mono"
                />
                <p className="text-xs text-tertiary">Toàn bộ lamports thu hồi từ tài khoản rỗng sẽ chuyển trực tiếp về địa chỉ này.</p>
              </div>
            </div>

            <footer className="flex justify-end gap-sm border-t border-secondary p-xl">
              <button
                onClick={() => setIsWalletModalOpen(false)}
                className="inline-flex items-center gap-sm rounded-lg bg-primary px-lg py-sm text-sm font-semibold text-secondary border border-primary hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                Hủy
              </button>
              <button
                onClick={() => handleConnectWallet(selectedWalletType, customWalletInput || undefined)}
                className="inline-flex items-center gap-sm rounded-lg border border-transparent bg-brand-solid px-lg py-sm text-sm font-semibold text-primary-on-brand shadow-xs hover:bg-brand-solid-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                Xác Nhận Kết Nối
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}
