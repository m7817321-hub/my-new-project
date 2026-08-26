import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  ExternalLink, 
  Plus, 
  Trash2, 
  DollarSign, 
  TrendingUp, 
  PackageCheck, 
  Layers, 
  ShoppingBag, 
  Copy, 
  Check, 
  Send, 
  HelpCircle, 
  AlertCircle, 
  Search, 
  CheckCircle2, 
  Clock, 
  Ban, 
  Image as ImageIcon, 
  Download, 
  Link, 
  Camera, 
  Star, 
  Sliders, 
  Calculator, 
  X, 
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import MarginCalculatorSection from './MarginCalculatorSection';

export default function SupplierSearchView({
  candidateId,
  onBack,
  backLabel,
  onTransferToListing
}) {
  const [candidateData, setCandidateData] = useState(null);
  const [features, setFeatures] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(null);
  const [imageActionNotice, setImageActionNotice] = useState(null);

  // 공급처 신규 등록 폼 상태
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    platform: '1688',
    product_title: '',
    supplier_name: '',
    supplier_url: '',
    unit_cost: '',
    currency: 'CNY',
    exchange_rate: 195,
    moq: 1,
    supply_shipping: 6000,
    customer_shipping: 3000,
    packaging_cost: 500,
    market_fee_rate: 10.8,
    notes: '',
    verification_status: 'UNVERIFIED'
  });

  // Margin Calculator V2 모달 상태
  const [marginModalSupplier, setMarginModalSupplier] = useState(null);
  const [marginModalForm, setMarginModalForm] = useState({});
  const [isSavingMargin, setIsSavingMargin] = useState(false);

  useEffect(() => {
    if (candidateId) {
      fetchCandidateAndSuppliers();
    }
  }, [candidateId]);

  const fetchCandidateAndSuppliers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/supplier/candidate/${candidateId}`);
      const data = await res.json();
      if (data.success) {
        setCandidateData(data.candidate);
        setFeatures(data.features);
        setSuppliers(data.suppliers || []);
      }
    } catch (err) {
      console.error('Fetch supplier info error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyKeyword = (kw, idx) => {
    navigator.clipboard.writeText(kw);
    setCopiedKey(idx);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Image Sourcing Bridge: 1688 이미지 검색창 + 고화질 원본 이미지 동시 열기
  const handleOpen1688ImageSearch = () => {
    if (!candidateData?.image_url) return;

    window.open('https://s.1688.com/youyuan.html', '_blank', 'noopener,noreferrer');
    window.open(candidateData.image_url, '_blank', 'noopener,noreferrer');

    setImageActionNotice('1688 이미지 검색창과 원본 이미지가 열렸습니다. 이미지를 1688 검색창에 업로드하거나 드래그하여 검색하세요.');
    setTimeout(() => setImageActionNotice(null), 6000);
  };

  const handleDownloadImage = async () => {
    if (!candidateData?.image_url) return;
    try {
      const a = document.createElement('a');
      a.href = candidateData.image_url;
      a.download = `${candidateData.keyword || 'product'}_benchmark_image.jpg`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      window.open(candidateData.image_url, '_blank');
    }
  };

  const handlePlatformChange = (newPlatform) => {
    let currency = 'KRW';
    let exchangeRate = 1;
    let shipping = 3000;

    if (newPlatform === '1688') {
      currency = 'CNY';
      exchangeRate = 195;
      shipping = 6000;
    } else if (newPlatform === '도매꾹' || newPlatform === '도매매') {
      currency = 'KRW';
      exchangeRate = 1;
      shipping = 3000;
    }

    setSupplierForm(prev => ({
      ...prev,
      platform: newPlatform,
      currency,
      exchange_rate: exchangeRate,
      supply_shipping: shipping
    }));
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();

    try {
      const currency = supplierForm.currency || (supplierForm.platform === '1688' ? 'CNY' : 'KRW');
      const exchangeRate = Number(supplierForm.exchange_rate) || (currency === 'CNY' ? 195 : currency === 'USD' ? 1350 : 1);
      const rawCost = supplierForm.unit_cost !== '' && supplierForm.unit_cost !== null && supplierForm.unit_cost !== undefined
        ? Number(supplierForm.unit_cost)
        : null;

      const payload = {
        ...supplierForm,
        candidate_id: candidateId,
        selling_price: candidateData?.price || 0,
        unit_cost: rawCost,
        currency,
        exchange_rate: exchangeRate,
        supply_shipping: Number(supplierForm.supply_shipping) || 0,
        customer_shipping: Number(supplierForm.customer_shipping) || 3000,
        packaging_cost: Number(supplierForm.packaging_cost) || 500,
        market_fee_rate: Number(supplierForm.market_fee_rate) || 10.8,
        moq: Number(supplierForm.moq) || 1
      };

      const res = await fetch('/api/supplier/item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setIsFormOpen(false);
        setSupplierForm({
          platform: '1688',
          product_title: '',
          supplier_name: '',
          supplier_url: '',
          unit_cost: '',
          currency: 'CNY',
          exchange_rate: 195,
          moq: 1,
          supply_shipping: 6000,
          customer_shipping: 3000,
          packaging_cost: 500,
          market_fee_rate: 10.8,
          notes: '',
          verification_status: 'UNVERIFIED'
        });
        fetchCandidateAndSuppliers();
      }
    } catch (err) {
      console.error('Save supplier item error:', err);
    }
  };

  const handleDeleteSupplier = async (id) => {
    if (!window.confirm('이 공급처 후보를 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/supplier/item/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchCandidateAndSuppliers();
      }
    } catch (err) {
      console.error('Delete supplier item error:', err);
    }
  };

  const handleSelectSupplier = async (id) => {
    const res = await fetch(`/api/supplier/item/${id}/workflow-status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'SELECTED' })
    });
    const data = await res.json();
    if (!data.success) return alert(data.error || '공급처 선택 실패');
    fetchCandidateAndSuppliers();
  };

  // Margin Calculator V2 모달 열기
  const handleOpenMarginModal = (supplier) => {
    setMarginModalSupplier(supplier);
    setMarginModalForm({
      candidate_id: candidateId,
      supplier_item_id: supplier.id,
      supplier: supplier.supplier_name || supplier.platform,
      original_name: candidateData?.title || '',
      selling_price: candidateData?.price || 25000,
      cost_price: supplier.unit_cost !== null ? supplier.unit_cost : '',
      currency: supplier.currency || (supplier.platform === '1688' ? 'CNY' : 'KRW'),
      exchange_rate: supplier.exchange_rate || (supplier.currency === 'CNY' ? 195 : supplier.currency === 'USD' ? 1350 : 1),
      moq: supplier.moq || 1,
      supply_shipping: supplier.supply_shipping !== undefined ? supplier.supply_shipping : (supplier.platform === '1688' ? 6000 : 3000),
      customer_shipping: 3000,
      packaging_cost: 500,
      market_fee_rate: 10.8,
      ...(supplier.margin_simulation || {})
    });
  };

  const handleMarginModalFormChange = (e) => {
    const { name, value } = e.target;
    setMarginModalForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveMarginFromModal = async () => {
    if (!marginModalSupplier) return;
    setIsSavingMargin(true);
    try {
      const payload = {
        ...marginModalSupplier,
        ...marginModalForm,
        unit_cost: marginModalForm.cost_price !== '' && marginModalForm.cost_price !== null ? Number(marginModalForm.cost_price) : null,
        selling_price: Number(marginModalForm.selling_price) || 0,
        exchange_rate: Number(marginModalForm.exchange_rate) || 1,
        moq: Number(marginModalForm.moq) || 1,
        supply_shipping: Number(marginModalForm.supply_shipping) || 0,
        customer_shipping: Number(marginModalForm.customer_shipping) || 3000,
        packaging_cost: Number(marginModalForm.packaging_cost) || 500,
        market_fee_rate: Number(marginModalForm.market_fee_rate) || 10.8
      };

      const res = await fetch('/api/supplier/item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setMarginModalSupplier(null);
        fetchCandidateAndSuppliers();
      } else {
        alert(data.error || '마진 저장 실패');
      }
    } catch (err) {
      console.error('Save margin modal error:', err);
      alert('마진 저장 중 오류: ' + err.message);
    } finally {
      setIsSavingMargin(false);
    }
  };

  const selectedSupplier = suppliers.find(s => s.workflow_status === 'SELECTED') || null;

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-400">공급처 탐색 정보 로딩 중...</p>
      </div>
    );
  }

  if (!candidateData) {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
        <p className="text-sm text-slate-300">선택된 상품 후보 정보를 찾을 수 없습니다.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
        >
          {backLabel || '이전 화면으로 돌아가기'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header & Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 transition cursor-pointer shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-400" />
          <span>{backLabel || '이전 화면으로 돌아가기'}</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">타깃 키워드:</span>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
            {candidateData.keyword}
          </span>
        </div>
      </div>

      {/* Image Action Bridge Alert Toast */}
      {imageActionNotice && (
        <div className="p-4 rounded-xl bg-purple-950/90 border border-purple-500/50 text-xs text-purple-200 flex items-center justify-between gap-3 shadow-2xl animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-purple-400 shrink-0" />
            <span>{imageActionNotice}</span>
          </div>
          <button 
            onClick={() => setImageActionNotice(null)} 
            className="text-purple-400 hover:text-white font-bold text-xs cursor-pointer"
          >
            확인
          </button>
        </div>
      )}

      {/* 2. Domestic Benchmark Target Card (기준 상품 정보) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-indigo-300">
              국내 벤치마크 타깃 상품 (기준 상품)
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {candidateData.is_catalog === 'CATALOG' || candidateData.seller_count > 1 ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Layers className="w-3 h-3" />
                카탈로그 묶음 ({candidateData.seller_count || 1}개 몰 경쟁)
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                단독 상품 ({candidateData.brand_type || 'SOHO'})
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {candidateData.status || 'INTEREST'} 후보
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-5 items-start md:items-center justify-between p-4 rounded-xl bg-slate-950/80 border border-slate-800/80">
          <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
            {/* Image Thumbnail with Overlay Action */}
            <div className="relative group shrink-0">
              {candidateData.image_url ? (
                <>
                  <img
                    src={candidateData.image_url}
                    alt={candidateData.title}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-slate-700 shadow-md"
                  />
                  <a
                    href={candidateData.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition rounded-xl flex items-center justify-center text-white text-[10px] font-bold gap-1"
                    title="고화질 이미지 새창 열기"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>확대</span>
                  </a>
                </>
              ) : (
                <div className="w-20 h-20 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center text-slate-600">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}
            </div>

            <div className="space-y-1.5 min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                {candidateData.title}
              </h3>
              
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span>판매처: <strong className="text-slate-200">{candidateData.mall_name}</strong></span>
                <span>•</span>
                <span>국내 판매가: <strong className="text-emerald-400 font-mono font-bold text-sm">₩{candidateData.price?.toLocaleString()}원</strong></span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  리뷰: <strong className="text-slate-200">{candidateData.review_count !== null ? candidateData.review_count + '개' : 'UNKNOWN'}</strong>
                  {candidateData.rating && (
                    <span className="text-amber-400 font-bold inline-flex items-center ml-1">
                      <Star className="w-3 h-3 fill-amber-400 inline mr-0.5" />
                      {candidateData.rating}
                    </span>
                  )}
                </span>

                {candidateData.nv_mid && (
                  <>
                    <span>•</span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      ID: {candidateData.nv_mid}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons: Image Sourcing Bridge & Domestic Link */}
          <div className="flex flex-wrap sm:flex-col items-stretch gap-2 shrink-0 w-full md:w-auto">
            {candidateData.image_url && (
              <button
                onClick={handleOpen1688ImageSearch}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white text-xs font-bold shadow-lg shadow-purple-500/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                title="1688 이미지 검색창과 원본 이미지를 함께 엽니다"
              >
                <Camera className="w-4 h-4 text-amber-300" />
                <span>📷 이미지로 1688 찾기</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              {candidateData.image_url && (
                <button
                  onClick={handleDownloadImage}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>이미지 받기</span>
                </button>
              )}

              {candidateData.product_url && (
                <a
                  href={candidateData.product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition flex items-center justify-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>국내 원문</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. SELECTED 공급처 전용 액션 배너 (하이라이트) */}
      {selectedSupplier && (
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border-2 border-emerald-500/50 rounded-2xl p-5 shadow-2xl space-y-3 animate-in zoom-in-95 duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-xs font-extrabold tracking-wide uppercase">
                  SELECTED 공급처
                </span>
                <span className="text-xs font-bold text-white">
                  [{selectedSupplier.platform}] {selectedSupplier.supplier_name || selectedSupplier.product_title || '공급처'}
                </span>
              </div>
              <p className="text-xs text-slate-300 flex flex-wrap items-center gap-2">
                <span>공급가: <strong className="text-indigo-300 font-mono">
                  {selectedSupplier.currency === 'CNY' ? `¥${selectedSupplier.unit_cost}` : `₩${selectedSupplier.unit_cost?.toLocaleString()}원`}
                </strong></span>
                <span>•</span>
                <span>실질원가: <strong className="text-emerald-300 font-mono">
                  ₩{selectedSupplier.margin_simulation?.effective_unit_cost?.toLocaleString() || selectedSupplier.margin_simulation?.item_cost_breakdown?.effective_unit_cost?.toLocaleString() || '-'}원
                </strong></span>
                <span>•</span>
                <span>예상순이익: <strong className="text-emerald-400 font-mono">
                  ₩{selectedSupplier.margin_simulation?.margin_amount?.toLocaleString() || '-'}원
                </strong> ({selectedSupplier.margin_simulation?.margin_rate || '-'}%)</span>
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => handleOpenMarginModal(selectedSupplier)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 border border-indigo-500/30 cursor-pointer shadow-md"
              >
                <Calculator className="w-4 h-4 text-indigo-400" />
                <span>📊 마진 계산기 V2 상세 분석</span>
              </button>

              {onTransferToListing && (
                <button
                  onClick={() => onTransferToListing(candidateId)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 cursor-pointer active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>🚀 AI 상품화(Listing Studio)로 이동</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Supplier Scout: 1688 / 도매꾹 / 도매매 탐색 채널 */}
      <div className="bg-gradient-to-br from-purple-950/30 via-slate-900 to-slate-900 border border-purple-500/30 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-purple-900/40">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              공급처 다채널 탐색 (1688 / 도매꾹 / 도매매)
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              원하는 키워드 옆의 <strong>[1688]</strong>, <strong>[도매꾹]</strong>, <strong>[도매매]</strong> 버튼을 누르면 검색 결과 페이지가 즉시 열립니다.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {features?.detected_materials?.map((m, i) => (
              <span key={i} className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px]">
                소재: {m}
              </span>
            ))}
            {features?.detected_features?.map((f, i) => (
              <span key={i} className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px]">
                특징: {f}
              </span>
            ))}
          </div>
        </div>

        {/* Search Keyword Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          {features?.search_keywords?.map((kItem, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-purple-500/50 transition flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-purple-400 font-bold tracking-wide uppercase block">
                    {kItem.target}
                  </span>
                  <span className="text-xs font-bold text-white font-mono truncate block mt-0.5">
                    {kItem.keyword}
                  </span>
                </div>

                <button
                  onClick={() => handleCopyKeyword(kItem.keyword, idx)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
                  title="검색어 복사"
                >
                  {copiedKey === idx ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Action Buttons: 1688 / 도매꾹 / 도매매 Direct Search */}
              <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800/80">
                <a
                  href={kItem.url_1688}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1.5 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 border border-orange-500/30 transition flex items-center justify-center gap-1 text-[11px] font-bold text-center"
                  title="1688 검색 열기"
                >
                  <Search className="w-3 h-3 text-orange-400 shrink-0" />
                  <span className="truncate">1688</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
                </a>

                <a
                  href={kItem.url_domeggook || `https://domeggook.com/ssl/search/?kw=${encodeURIComponent(kItem.keyword)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 transition flex items-center justify-center gap-1 text-[11px] font-bold text-center"
                  title="도매꾹 검색 열기"
                >
                  <Search className="w-3 h-3 text-purple-400 shrink-0" />
                  <span className="truncate">도매꾹</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
                </a>

                <a
                  href={kItem.url_domeme}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition flex items-center justify-center gap-1 text-[11px] font-bold text-center"
                  title="도매매 검색 열기"
                >
                  <Search className="w-3 h-3 text-blue-400 shrink-0" />
                  <span className="truncate">도매매</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Supplier Comparison & Management (공급처 비교 테이블 & 빠른 등록) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              발굴된 공급처 후보 비교 ({suppliers.length}개)
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              1688, 도매꾹, 도매매에서 찾은 상품 URL과 공급가를 등록하고 실질 원가 및 마진을 비교하세요.
            </p>
          </div>

          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ 공급처 후보 추가</span>
          </button>
        </div>

        {/* Quick Registration Form */}
        {isFormOpen && (
          <form onSubmit={handleSaveSupplier} className="p-5 rounded-xl bg-slate-950/90 border border-emerald-500/40 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                공급처 후보 빠른 등록 (URL 복사 & 붙여넣기)
              </h5>
              <span className="text-[11px] text-slate-400">
                * 공급가가 없는 경우 비워두면 UNKNOWN으로 안전하게 보류됩니다.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">공급 플랫폼 *</label>
                <select
                  value={supplierForm.platform}
                  onChange={(e) => handlePlatformChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="1688">1688 (해외 사입 / 이미지 검색 결과)</option>
                  <option value="도매꾹">도매꾹 (국내 B2B 대량 도매)</option>
                  <option value="도매매">도매매 (국내 B2B 위탁/배송대행)</option>
                  <option value="동대문">동대문 / 국내 공장</option>
                  <option value="기타">기타 공급처</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">공급처 상품명</label>
                <input
                  type="text"
                  value={supplierForm.product_title}
                  onChange={(e) => setSupplierForm({ ...supplierForm, product_title: e.target.value })}
                  placeholder="예: 2026 나일론 캠프캡 무지"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">판매자 / 공장 상호</label>
                <input
                  type="text"
                  value={supplierForm.supplier_name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, supplier_name: e.target.value })}
                  placeholder="예: 광저우 모자 직판공장"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">통화</label>
                <select
                  value={supplierForm.currency || 'CNY'}
                  onChange={(e) => {
                    const c = e.target.value;
                    setSupplierForm({
                      ...supplierForm,
                      currency: c,
                      exchange_rate: c === 'CNY' ? 195 : c === 'USD' ? 1350 : 1
                    });
                  }}
                  className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-semibold"
                >
                  <option value="CNY">CNY (¥)</option>
                  <option value="KRW">KRW (₩)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">
                  공급원가 ({supplierForm.currency === 'CNY' ? '¥ 위안' : supplierForm.currency === 'USD' ? '$ 달러' : '₩ 원화'})
                </label>
                <input
                  type="number"
                  step="any"
                  value={supplierForm.unit_cost}
                  onChange={(e) => setSupplierForm({ ...supplierForm, unit_cost: e.target.value })}
                  placeholder={supplierForm.currency === 'CNY' ? '예: 25' : '예: 5800'}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-emerald-400 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">적용 환율</label>
                <input
                  type="number"
                  step="0.1"
                  disabled={supplierForm.currency === 'KRW'}
                  value={supplierForm.currency === 'KRW' ? 1 : (supplierForm.exchange_rate || 195)}
                  onChange={(e) => setSupplierForm({ ...supplierForm, exchange_rate: e.target.value })}
                  className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">MOQ (최소주문수량)</label>
                <input
                  type="number"
                  min="1"
                  value={supplierForm.moq}
                  onChange={(e) => setSupplierForm({ ...supplierForm, moq: e.target.value })}
                  className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">공급 배송비 (KRW)</label>
                <input
                  type="number"
                  value={supplierForm.supply_shipping}
                  onChange={(e) => setSupplierForm({ ...supplierForm, supply_shipping: e.target.value })}
                  className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">검증 상태</label>
                <select
                  value={supplierForm.verification_status}
                  onChange={(e) => setSupplierForm({ ...supplierForm, verification_status: e.target.value })}
                  className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="UNVERIFIED">검토 대기</option>
                  <option value="VERIFIED">검증 완료</option>
                  <option value="REJECTED">탈락/부적합</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">공급처 상품 URL (복사한 1688 / 도매 링크) *</label>
                <input
                  type="url"
                  value={supplierForm.supplier_url}
                  onChange={(e) => setSupplierForm({ ...supplierForm, supplier_url: e.target.value })}
                  placeholder="https://detail.1688.com/offer/... 또는 도매 링크"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">메모 / 특이사항</label>
                <input
                  type="text"
                  value={supplierForm.notes}
                  onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                  placeholder="예: 이미지 검색으로 발굴, 원단 퀄리티 우수"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                저장 & 비교표 반영
              </button>
            </div>
          </form>
        )}

        {/* Supplier Comparison Table */}
        {suppliers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/60">
                  <th className="py-3 px-3">플랫폼 / 공급처</th>
                  <th className="py-3 px-3">상품명 & URL</th>
                  <th className="py-3 px-3 text-right">공급가 (통화/환율)</th>
                  <th className="py-3 px-3 text-center">MOQ / 배송비</th>
                  <th className="py-3 px-3 text-right">실질 원가</th>
                  <th className="py-3 px-3 text-right">예상 순이익</th>
                  <th className="py-3 px-3 text-center">순이익률</th>
                  <th className="py-3 px-3 text-center">상태</th>
                  <th className="py-3 px-3 text-center">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {suppliers.map((sup) => {
                  const sim = sup.margin_simulation || {};
                  const hasCost = sup.unit_cost !== null && sup.unit_cost !== undefined;
                  const isProfitable = sim.margin_amount > 0;
                  const isSelected = sup.workflow_status === 'SELECTED';
                  const currency = sup.currency || 'KRW';
                  const rate = sup.exchange_rate || (currency === 'CNY' ? 195 : currency === 'USD' ? 1350 : 1);
                  const effectiveCost = sim.effective_unit_cost !== undefined 
                    ? sim.effective_unit_cost 
                    : (sim.item_cost_breakdown?.effective_unit_cost !== undefined ? sim.item_cost_breakdown.effective_unit_cost : null);

                  return (
                    <tr 
                      key={sup.id} 
                      className={`transition ${
                        isSelected 
                          ? 'bg-emerald-950/30 hover:bg-emerald-950/40 border-l-4 border-l-emerald-500' 
                          : 'hover:bg-slate-950/40'
                      }`}
                    >
                      {/* 플랫폼 / 판매자 */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-block ${
                            sup.platform === '1688'
                              ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                              : sup.platform === '도매꾹'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                              : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          }`}>
                            {sup.platform}
                          </span>
                          <div className="text-xs font-bold text-white truncate max-w-[130px]">
                            {sup.supplier_name || '판매자 미기재'}
                          </div>
                        </div>
                      </td>

                      {/* 상품명 & URL */}
                      <td className="py-3.5 px-3 max-w-xs">
                        <div className="space-y-1">
                          <div className="text-xs text-slate-200 truncate font-medium">
                            {sup.product_title || '공급처 상품'}
                          </div>
                          {sup.supplier_url ? (
                            <a
                              href={sup.supplier_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-indigo-400 inline-flex items-center gap-1 text-[11px] truncate max-w-full"
                            >
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              <span className="truncate">공급처 페이지 열기</span>
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-600">URL 없음</span>
                          )}
                          {sup.notes && (
                            <div className="text-[10px] text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800/80 truncate">
                              메모: {sup.notes}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 공급가 (통화 & 환산) */}
                      <td className="py-3.5 px-3 text-right">
                        {hasCost ? (
                          <div className="space-y-0.5">
                            <span className="text-sm font-bold font-mono text-indigo-300 block">
                              {currency === 'CNY' ? `¥${sup.unit_cost}` : currency === 'USD' ? `$${sup.unit_cost}` : `₩${sup.unit_cost?.toLocaleString()}원`}
                            </span>
                            {currency !== 'KRW' && (
                              <span className="text-[10px] text-slate-400 font-mono block">
                                (₩{Math.round(sup.unit_cost * rate).toLocaleString()}원)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[11px] font-semibold">
                            UNKNOWN
                          </span>
                        )}
                      </td>

                      {/* MOQ & 배송비 */}
                      <td className="py-3.5 px-3 text-center font-mono text-slate-300">
                        <div className="space-y-0.5">
                          <span className="block text-xs">{sup.moq ? `${sup.moq}개` : '1개'}</span>
                          <span className="block text-[10px] text-slate-500">배송: ₩{sup.supply_shipping?.toLocaleString() || 0}</span>
                        </div>
                      </td>

                      {/* 실질 원가 (Effective Unit Cost) */}
                      <td className="py-3.5 px-3 text-right font-mono">
                        {hasCost && effectiveCost !== null ? (
                          <span className="text-xs font-bold text-slate-200">
                            ₩{effectiveCost.toLocaleString()}원
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      {/* 예상 순이익 */}
                      <td className="py-3.5 px-3 text-right font-mono">
                        {hasCost && sim.margin_amount !== null && sim.margin_amount !== undefined ? (
                          <span className={`text-sm font-bold ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                            ₩{sim.margin_amount.toLocaleString()}원
                          </span>
                        ) : (
                          <span className="text-slate-500 font-normal">판정보류</span>
                        )}
                      </td>

                      {/* 순이익률 */}
                      <td className="py-3.5 px-3 text-center font-mono">
                        {hasCost && sim.margin_rate !== null && sim.margin_rate !== undefined ? (
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            isProfitable 
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {sim.margin_rate}%
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      {/* 상태 (워크플로우 & 검증) */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="space-y-1">
                          {isSelected ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500 text-slate-950">
                              <Check className="w-3 h-3" />
                              SELECTED
                            </span>
                          ) : sup.workflow_status === 'REJECTED' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              REJECTED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                              CANDIDATE
                            </span>
                          )}

                          <div>
                            {sup.verification_status === 'VERIFIED' ? (
                              <span className="text-[10px] text-emerald-400 font-medium">검증완료</span>
                            ) : sup.verification_status === 'REJECTED' ? (
                              <span className="text-[10px] text-rose-400 font-medium">부적합</span>
                            ) : (
                              <span className="text-[10px] text-slate-500">검토대기</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 액션 */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {!isSelected && (
                            <button 
                              onClick={() => handleSelectSupplier(sup.id)} 
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition cursor-pointer shadow-sm"
                              title="이 공급처를 기준 공급처(SELECTED)로 선택"
                            >
                              선택
                            </button>
                          )}

                          {/* 마진 계산기 V2 상세 튜닝 버튼 */}
                          <button
                            onClick={() => handleOpenMarginModal(sup)}
                            className="p-1.5 rounded bg-slate-800 hover:bg-indigo-600/30 text-indigo-300 hover:text-white transition cursor-pointer border border-indigo-500/30"
                            title="Margin Calculator V2에서 세부 원가/마진 분석"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                          </button>

                          {onTransferToListing && hasCost && (
                            <button
                              onClick={() => onTransferToListing(candidateId)}
                              disabled={!isSelected}
                              className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-700"
                              title={isSelected ? "Listing Studio로 전달" : "SELECTED(선택) 상태인 공급처만 Listing으로 전달할 수 있습니다"}
                            >
                              <Send className="w-3 h-3" />
                              <span>상품화</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteSupplier(sup.id)}
                            className="p-1.5 rounded bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl space-y-2">
            <PackageCheck className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">
              아직 등록된 공급처가 없습니다. 상단의 <strong>[📷 이미지로 1688 찾기]</strong> 또는 다채널 검색 후 <strong>[+ 공급처 후보 추가]</strong>를 눌러 URL과 공급가를 등록하세요.
            </p>
          </div>
        )}
      </div>

      {/* 6. Margin Calculator V2 Modal (공급처 상세 원가 튜닝) */}
      {marginModalSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    Margin Calculator V2 - 상세 원가 & 마진 시뮬레이션
                    <span className="px-2 py-0.5 rounded text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      [{marginModalSupplier.platform}] {marginModalSupplier.supplier_name || '공급처'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    환율, 중국내 운송비, 국제 배송비, 통관세, 플랫폼 수수료 및 광고비를 실시간 튜닝합니다.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setMarginModalSupplier(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: MarginCalculatorSection */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <MarginCalculatorSection
                formData={marginModalForm}
                onChange={handleMarginModalFormChange}
              />
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/50">
              <div className="text-xs text-slate-400">
                * 저장 시 공급처 후보의 실질 원가와 예상 순이익이 자동으로 갱신됩니다.
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMarginModalSupplier(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  닫기
                </button>
                <button
                  type="button"
                  onClick={handleSaveMarginFromModal}
                  disabled={isSavingMargin}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingMargin ? '저장 중...' : '마진 설정 저장 & 반영'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
