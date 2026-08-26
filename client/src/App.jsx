import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import Navbar from './components/Navbar';
import DailyDashboardView from './components/DailyDashboardView';
import MarketResearchView from './components/MarketResearchView';
import RankTrackerView from './components/RankTrackerView';
import SupplierSearchView from './components/SupplierSearchView';
import ProductInputForm from './components/ProductInputForm';
import AITransformPreview from './components/AITransformPreview';
import SavedProductModal from './components/SavedProductModal';

const INITIAL_FORM = {
  original_name: '',
  cost_price: '',
  selling_price: '',
  currency: 'KRW',
  exchange_rate: 1,
  moq: 1,
  quantity: 1,
  supplier: '',
  product_url: '',
  image_url: '',
  supply_shipping: 3000,
  customer_shipping: 3000,
  market_fee_rate: 10.8,
  payment_fee_rate: 0,
  packaging_cost: 500,
  ad_cost: 0,
  discount_cost: 0,
  china_local_cost: 0,
  international_shipping: 0,
  tariff_tax: 0,
  batch_forwarding_fee: 0,
  return_exchange_cost: 0,
  defect_cost: 0,
  extra_cost: 0,
  target_margin_rate: 25
};

export default function App() {
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'market' | 'rank' | 'supplier' | 'listing'
  
  // --- Internal State Navigation History Stack ---
  const [navHistory, setNavHistory] = useState([
    { tab: 'daily', title: '오늘의 소싱' }
  ]);

  // --- Market Research State ---
  const [currentMarketReport, setCurrentMarketReport] = useState(null);
  const [isAnalyzingMarket, setIsAnalyzingMarket] = useState(false);
  const [marketSamples, setMarketSamples] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);

  // --- Listing Studio State ---
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [transformedData, setTransformedData] = useState(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [savedProducts, setSavedProducts] = useState([]);
  const [listingSamples, setListingSamples] = useState([]);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  // Show toast notification
  const showToast = (msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Resolve screen readable titles
  const getTabTitle = (tab) => {
    const titles = {
      daily: '오늘의 소싱',
      market: '시장 분석',
      rank: '순위 추적',
      supplier: '공급처 탐색 Hub',
      listing: 'Listing Studio'
    };
    return titles[tab] || tab;
  };

  // Internal Navigation (Pure React State Routing)
  const navigateTo = (tab, context = {}) => {
    const title = getTabTitle(tab);
    const newEntry = {
      tab,
      title,
      candidateId: context.candidateId !== undefined ? context.candidateId : selectedCandidateId,
      ...context
    };

    setNavHistory(prev => {
      // Don't push duplicate consecutive tabs
      if (prev.length > 0 && prev[prev.length - 1].tab === tab && !context.candidateId) {
        return prev;
      }
      return [...prev, newEntry];
    });

    setActiveTab(tab);

    // Sync with browser history state to prevent falling out to Google
    try {
      window.history.pushState({ tab, title }, '', '#' + tab);
    } catch (e) {}
  };

  // Internal Navigate Back (Pops internal state without leaving WOOJUNG SELLER)
  const handleNavigateBack = () => {
    setNavHistory(prev => {
      if (prev.length > 1) {
        const updated = [...prev];
        updated.pop(); // Remove current
        const previous = updated[updated.length - 1];
        
        setActiveTab(previous.tab);
        if (previous.candidateId !== undefined) {
          setSelectedCandidateId(previous.candidateId);
        }
        return updated;
      } else {
        // Root reached -> stay on daily dashboard
        setActiveTab('daily');
        return [{ tab: 'daily', title: '오늘의 소싱' }];
      }
    });
  };

  // Previous Screen Title Helper
  const getPreviousTitle = () => {
    if (navHistory.length > 1) {
      return navHistory[navHistory.length - 2].title;
    }
    return activeTab !== 'daily' ? '오늘의 소싱' : null;
  };

  // Direct Tab Switch from Navbar
  const handleTabSwitch = (tab) => {
    navigateTo(tab);
  };

  // Prevent Browser Back from exiting app
  useEffect(() => {
    try {
      window.history.replaceState({ tab: 'daily', title: '오늘의 소싱' }, '', '#daily');
    } catch (e) {}

    const handlePopState = (e) => {
      e.preventDefault();
      handleNavigateBack();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch initial data on mount
  useEffect(() => {
    fetchMarketSamples();
    fetchListingSamples();
    fetchSavedProducts();
  }, []);

  const fetchMarketSamples = async () => {
    try {
      const res = await fetch('/api/market/samples');
      const data = await res.json();
      if (data.success) {
        setMarketSamples(data.samples);
      }
    } catch (err) {
      console.error('Fetch market samples error:', err);
    }
  };

  const fetchListingSamples = async () => {
    try {
      const res = await fetch('/api/samples');
      const data = await res.json();
      if (data.success) {
        setListingSamples(data.samples);
      }
    } catch (err) {
      console.error('Fetch listing samples error:', err);
    }
  };

  const fetchSavedProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        setSavedProducts(data.data);
      }
    } catch (err) {
      console.error('Fetch products error:', err);
    }
  };

  // --- Market Research Actions ---
  const handleAnalyzeMarket = async (keyword) => {
    if (!keyword) return;
    setIsAnalyzingMarket(true);
    try {
      const res = await fetch('/api/market/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword })
      });
      const json = await res.json();
      if (json.success) {
        setCurrentMarketReport(json.data);
        showToast(`'${keyword}' 시장 분석이 완료되었습니다.`, 'success');
      } else {
        showToast(json.error || '분석 실패', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('시장 분석 서버 통신 실패', 'error');
    } finally {
      setIsAnalyzingMarket(false);
    }
  };

  // Open Supplier Search View for a specific Candidate
  const handleOpenSupplierSearch = (candidateId) => {
    setSelectedCandidateId(candidateId);
    navigateTo('supplier', { candidateId });
    showToast('공급처 탐색 Hub로 이동했습니다.', 'info');
  };

  // Jump to Market Research View with specific keyword
  const handleInspectMarketKeyword = (keyword) => {
    handleAnalyzeMarket(keyword);
    navigateTo('market', { keyword });
  };

  // Seamless Transfer: Market Research or Supplier Search -> Listing Studio
  const handleTransferToListing = async (candidateId) => {
    try {
      const res = await fetch(`/api/workflow/candidates/${candidateId}/listing-seed`);
      const json = await res.json();
      if (!json.success) return showToast(json.error || 'Listing 연결 실패', 'error');
      setFormData(prev => ({
        ...INITIAL_FORM,
        ...json.data
      }));
      navigateTo('listing', { candidateId });
      showToast('선택된 공급처 기준으로 Listing Studio로 이동했습니다.', 'success');
    } catch (err) { showToast('Listing 연결 서버 통신 실패', 'error'); }
  };

  // --- Listing Studio Actions ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLoadListingSample = (sample) => {
    setFormData({
      original_name: sample.original_name,
      cost_price: sample.cost_price,
      selling_price: sample.selling_price,
      supplier: sample.supplier,
      product_url: sample.product_url,
      image_url: sample.image_url,
      supply_shipping: sample.supply_shipping || 3000,
      customer_shipping: sample.customer_shipping || 3000,
      market_fee_rate: sample.market_fee_rate || 10.8,
      packaging_cost: sample.packaging_cost || 500
    });
    showToast(`'${sample.original_name.slice(0, 18)}...' 샘플을 로드했습니다.`, 'success');
  };

  const handleTransform = async () => {
    if (!formData.original_name) {
      showToast('원본 상품명을 입력해주세요.', 'error');
      return;
    }

    setIsTransforming(true);
    try {
      const res = await fetch('/api/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const json = await res.json();

      if (json.success) {
        setTransformedData(json.data);
        showToast('AI 상품화 가공이 완료되었습니다!', 'success');
      } else {
        showToast(json.error || '가공 실패', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('상품화 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsTransforming(false);
    }
  };

  const handleTransformedChange = (updated) => {
    setTransformedData(updated);
  };

  const handleSaveToDB = async () => {
    if (!transformedData) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transformedData)
      });
      const json = await res.json();

      if (json.success) {
        setSavedSuccess(true);
        showToast('상품 DB에 성공적으로 저장되었습니다.', 'success');
        fetchSavedProducts();
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        showToast(json.error || '저장 실패', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectProduct = (product) => {
    setFormData({
      original_name: product.original_name,
      cost_price: product.cost_price,
      selling_price: product.selling_price,
      supplier: product.supplier,
      product_url: product.product_url,
      image_url: product.image_url,
      supply_shipping: product.supply_shipping,
      customer_shipping: product.customer_shipping,
      market_fee_rate: product.market_fee_rate,
      packaging_cost: product.packaging_cost
    });

    setTransformedData(product);
    setIsSavedModalOpen(false);
    setActiveTab('listing');
    showToast(`'${(product.generated_title || product.original_name).slice(0, 18)}...' 데이터를 불러왔습니다.`, 'info');
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('이 상품을 DB에서 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('상품이 삭제되었습니다.', 'info');
        fetchSavedProducts();
        if (transformedData && transformedData.id === id) {
          setTransformedData(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM);
    setTransformedData(null);
    showToast('입력이 초기화되었습니다.', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
          <div className={`px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border ${
            notification.type === 'success' 
              ? 'bg-emerald-950 text-emerald-200 border-emerald-800' 
              : notification.type === 'error'
              ? 'bg-rose-950 text-rose-200 border-rose-800'
              : 'bg-indigo-950 text-indigo-200 border-indigo-800'
          }`}>
            <span>{notification.msg}</span>
          </div>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleTabSwitch}
        savedCount={savedProducts.length}
        onOpenSaved={() => setIsSavedModalOpen(true)}
        onReset={handleReset}
        isTransforming={isTransforming}
        onNavigateBack={handleNavigateBack}
        canGoBack={navHistory.length > 1 || activeTab !== 'daily'}
        previousTitle={getPreviousTitle()}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab 0: V4 Daily Sourcing Dashboard (아빠용 메인 첫 화면) */}
        {activeTab === 'daily' && (
          <DailyDashboardView
            onSelectCandidateForSupplier={handleOpenSupplierSearch}
            onInspectMarketKeyword={handleInspectMarketKeyword}
          />
        )}

        {/* Tab 1: Market Research Engine & Candidate Finder */}
        {activeTab === 'market' && (
          <MarketResearchView
            onTransferToListing={handleTransferToListing}
            onAnalyzeKeyword={handleAnalyzeMarket}
            onOpenSupplierSearch={handleOpenSupplierSearch}
            isAnalyzing={isAnalyzingMarket}
            currentReport={currentMarketReport}
            sampleKeywords={marketSamples}
          />
        )}

        {/* Tab 2: SmartStore Keyword Rank Tracker V1 */}
        {activeTab === 'rank' && (
          <RankTrackerView />
        )}

        {/* Tab 3: Supplier Search Hub */}
        {activeTab === 'supplier' && (
          <SupplierSearchView
            candidateId={selectedCandidateId}
            onBack={handleNavigateBack}
            backLabel={getPreviousTitle() ? `${getPreviousTitle()} 화면으로 돌아가기` : '이전 화면으로 돌아가기'}
            onTransferToListing={handleTransferToListing}
          />
        )}

        {/* Tab 4: Listing Studio (AI Transformation) */}
        {activeTab === 'listing' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-purple-950/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-1">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold font-mono">1</span>
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold font-mono">2</span>
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold font-mono">3</span>
                </div>
                <div>
                  <h1 className="text-sm font-bold text-white">Listing Studio - 단일 상품 자동 상품화</h1>
                  <p className="text-xs text-slate-400">
                    원천 정보 및 공급원가 입력 ➔ AI 가공(상품명/SEO 10개/소구점 3개/상세페이지) ➔ 로컬 DB 저장
                  </p>
                </div>
              </div>

              <button
                onClick={handleNavigateBack}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm self-start md:self-auto active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-indigo-400" />
                <span>{getPreviousTitle() ? `${getPreviousTitle()} 화면으로 돌아가기` : '이전 화면으로 돌아가기'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Product Input & Margin (5 Cols) */}
              <div className="lg:col-span-5 space-y-6">
                <ProductInputForm
                  formData={formData}
                  onChange={handleInputChange}
                  onTransform={handleTransform}
                  isTransforming={isTransforming}
                  onLoadSample={handleLoadListingSample}
                  samples={listingSamples}
                />
              </div>

              {/* Right Column: AI Transform Preview & Editor (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                <AITransformPreview
                  transformedData={transformedData}
                  onChange={handleTransformedChange}
                  onSave={handleSaveToDB}
                  isSaving={isSaving}
                  savedSuccess={savedSuccess}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Saved Product Modal */}
      <SavedProductModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        products={savedProducts}
        onSelectProduct={handleSelectProduct}
        onDeleteProduct={handleDeleteProduct}
      />
    </div>
  );
}
