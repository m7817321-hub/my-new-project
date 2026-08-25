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
  Camera
} from 'lucide-react';

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

  // 공급처 신규 등록 폼 상태 (Image Sourcing Bridge 연동)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    platform: '1688',
    product_title: '',
    supplier_name: '',
    supplier_url: '',
    unit_cost: '',
    currency: 'KRW',
    moq: 1,
    supply_shipping: 6000,
    customer_shipping: 3000,
    packaging_cost: 500,
    market_fee_rate: 10.8,
    notes: '',
    verification_status: 'UNVERIFIED'
  });

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

  // Image Sourcing Bridge: 이미지 다운로드/열기 & 1688 이미지 검색 안내
  const handleOpen1688ImageSearch = () => {
    if (!candidateData?.image_url) return;

    // 1. 새 탭으로 1688 이미지 검색 페이지 열기
    window.open('https://s.1688.com/youyuan.html', '_blank', 'noopener,noreferrer');

    // 2. 새 탭으로 고화질 원본 이미지 열기 (드래그 앤 드롭 또는 우클릭 복사용)
    window.open(candidateData.image_url, '_blank', 'noopener,noreferrer');

    // 3. 안내 알림 토글
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

  const handleSaveSupplier = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...supplierForm,
        candidate_id: candidateId,
        selling_price: candidateData?.price || 0,
        unit_cost: supplierForm.unit_cost !== '' ? Number(supplierForm.unit_cost) : null,
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
          currency: 'KRW',
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
          <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
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

      {/* 2. Domestic Benchmark Target Card with Image Sourcing Bridge */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4" />
            국내 벤치마크 타깃 상품 (기준 상품)
          </span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            INTEREST 후보
          </span>
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
                <span>리뷰 수: <strong className="text-slate-200">{candidateData.review_count !== null ? candidateData.review_count + '개' : 'UNKNOWN'}</strong></span>
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
                <a
                  href={candidateData.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition flex items-center justify-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>이미지 열기</span>
                </a>
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

      {/* 3. Supplier Scout V3: Search Keywords & Direct Search Buttons */}
      <div className="bg-gradient-to-br from-purple-950/30 via-slate-900 to-slate-900 border border-purple-500/30 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-purple-900/40">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              1688 / 도매매 키워드 검색 (자동 키워드 생성)
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              원하는 키워드 옆의 <strong>[1688 검색]</strong> 또는 <strong>[도매매 검색]</strong>을 누르면 검색 결과 페이지가 즉시 열립니다.
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

              {/* Action Buttons: 1688 / 도매매 Direct Search */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                <a
                  href={kItem.url_1688}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 border border-orange-500/30 transition flex items-center justify-center gap-1.5 text-[11px] font-bold text-center"
                >
                  <Search className="w-3 h-3 text-orange-400" />
                  <span>1688 키워드 검색</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                </a>

                <a
                  href={kItem.url_domeme}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition flex items-center justify-center gap-1.5 text-[11px] font-bold text-center"
                >
                  <Search className="w-3 h-3 text-blue-400" />
                  <span>도매매 검색</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Supplier Scout V3 & V4: 공급처 비교 테이블 & 빠른 URL 등록 */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              발굴된 공급처 후보 목록 ({suppliers.length}개)
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              1688 이미지 검색 또는 도매매에서 찾은 상품 URL과 공급가를 붙여넣어 마진을 실시간 비교하세요.
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
                  onChange={(e) => setSupplierForm({ 
                    ...supplierForm, 
                    platform: e.target.value,
                    supply_shipping: e.target.value === '1688' ? 6000 : 3000
                  })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="1688">1688 (해외 사입 / 이미지 검색 결과)</option>
                  <option value="도매매">도매매 (국내 B2B)</option>
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

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">공급원가 (₩ 원화 환산가)</label>
                <input
                  type="number"
                  value={supplierForm.unit_cost}
                  onChange={(e) => setSupplierForm({ ...supplierForm, unit_cost: e.target.value })}
                  placeholder="예: 5800 (미확인 시 빈칸)"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-emerald-400 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">MOQ (최소주문수량)</label>
                <input
                  type="number"
                  value={supplierForm.moq}
                  onChange={(e) => setSupplierForm({ ...supplierForm, moq: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">공급 배송비</label>
                <input
                  type="number"
                  value={supplierForm.supply_shipping}
                  onChange={(e) => setSupplierForm({ ...supplierForm, supply_shipping: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">검증 상태</label>
                <select
                  value={supplierForm.verification_status}
                  onChange={(e) => setSupplierForm({ ...supplierForm, verification_status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="UNVERIFIED">검토 대기 (UNVERIFIED)</option>
                  <option value="VERIFIED">검증 완료 (VERIFIED)</option>
                  <option value="REJECTED">탈락/부적합 (REJECTED)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">공급처 상품 URL (복사한 1688 링크 붙여넣기) *</label>
                <input
                  type="url"
                  value={supplierForm.supplier_url}
                  onChange={(e) => setSupplierForm({ ...supplierForm, supplier_url: e.target.value })}
                  placeholder="https://detail.1688.com/offer/..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">메모 / 특이사항</label>
                <input
                  type="text"
                  value={supplierForm.notes}
                  onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                  placeholder="예: 이미지 검색으로 찾음, 원단 퀄리티 우수"
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
                  <th className="py-3 px-3">플랫폼 / 판매자</th>
                  <th className="py-3 px-3">상품명 & URL</th>
                  <th className="py-3 px-3 text-right">공급가 (원가)</th>
                  <th className="py-3 px-3 text-center">MOQ</th>
                  <th className="py-3 px-3 text-right">예상 마진액</th>
                  <th className="py-3 px-3 text-center">마진율</th>
                  <th className="py-3 px-3 text-center">상태</th>
                  <th className="py-3 px-3 text-center">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {suppliers.map((sup) => {
                  const sim = sup.margin_simulation || {};
                  const hasCost = sup.unit_cost !== null && sup.unit_cost !== undefined;
                  const isProfitable = sim.margin_amount > 0;

                  return (
                    <tr key={sup.id} className="hover:bg-slate-950/40 transition">
                      {/* 플랫폼 / 판매자 */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-block ${
                            sup.platform === '1688'
                              ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                              : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          }`}>
                            {sup.platform}
                          </span>
                          <div className="text-xs font-bold text-white">
                            {sup.supplier_name || '판매자 미기재'}
                          </div>
                        </div>
                      </td>

                      {/* 상품명 & URL */}
                      <td className="py-3.5 px-3 max-w-xs">
                        <div className="space-y-1">
                          <div className="text-xs text-slate-200 truncate">
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
                              <span className="truncate">공급처 페이지</span>
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-600">URL 없음</span>
                          )}
                          {sup.notes && (
                            <div className="text-[10px] text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800/80">
                              메모: {sup.notes}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 공급가 */}
                      <td className="py-3.5 px-3 text-right">
                        {hasCost ? (
                          <span className="text-sm font-bold font-mono text-indigo-300">
                            ₩{sup.unit_cost?.toLocaleString()}원
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[11px] font-semibold">
                            UNKNOWN
                          </span>
                        )}
                      </td>

                      {/* MOQ */}
                      <td className="py-3.5 px-3 text-center font-mono text-slate-300">
                        {sup.moq ? `${sup.moq}개` : '-'}
                      </td>

                      {/* 예상 마진액 */}
                      <td className="py-3.5 px-3 text-right font-mono">
                        {hasCost && sim.margin_amount !== null && sim.margin_amount !== undefined ? (
                          <span className={`text-sm font-bold ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                            ₩{sim.margin_amount.toLocaleString()}원
                          </span>
                        ) : (
                          <span className="text-slate-500 font-normal">판정 보류</span>
                        )}
                      </td>

                      {/* 마진율 */}
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

                      {/* 검증 상태 */}
                      <td className="py-3.5 px-3 text-center">
                        {sup.verification_status === 'VERIFIED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            검증완료
                          </span>
                        ) : sup.verification_status === 'REJECTED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <Ban className="w-3 h-3" />
                            부적합
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                            <Clock className="w-3 h-3" />
                            검토대기
                          </span>
                        )}
                      </td>

                      {/* 액션 */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {sup.workflow_status !== 'SELECTED' && (
                            <button onClick={() => handleSelectSupplier(sup.id)} className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition cursor-pointer">
                              선택
                            </button>
                          )}
                          {onTransferToListing && hasCost && (
                            <button
                              onClick={() => onTransferToListing(candidateId)}
                              disabled={sup.workflow_status !== 'SELECTED'}
                              className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Listing Studio로 전달"
                            >
                              <Send className="w-3 h-3" />
                              <span>상품화</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteSupplier(sup.id)}
                            className="p-1 rounded bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition cursor-pointer"
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
              아직 등록된 공급처가 없습니다. 상단의 <strong>[📷 이미지로 1688 찾기]</strong> 또는 키워드 검색 후 <strong>[+ 공급처 후보 추가]</strong>를 눌러 URL을 등록하세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
