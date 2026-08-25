import React, { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Save, 
  Edit3, 
  Eye, 
  Hash, 
  ListOrdered, 
  FileText, 
  Layers, 
  CheckCircle2, 
  Plus, 
  X,
  Clock,
  HelpCircle,
  Share2
} from 'lucide-react';

export default function AITransformPreview({
  transformedData,
  onChange,
  onSave,
  isSaving,
  savedSuccess
}) {
  const [copyStatus, setCopyStatus] = useState({});
  const [copyTab, setCopyTab] = useState('preview'); // 'preview' | 'edit'
  const [newKeyword, setNewKeyword] = useState('');

  if (!transformedData) {
    return (
      <div className="bg-slate-900/50 border border-slate-800/80 border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[480px]">
        <div className="w-16 h-16 rounded-2xl bg-indigo-950/50 border border-indigo-800/50 flex items-center justify-center mb-4 text-indigo-400">
          <Sparkles className="w-8 h-8 opacity-70 animate-pulse" />
        </div>
        <h3 className="text-base font-bold text-slate-300">AI 상품화 대기 중</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
          좌측 폼에 원본 상품명을 입력하고 <strong className="text-indigo-400">'상품화 시작'</strong>을 누르면 
          한국어 상품명, SEO 태그 10개, 핵심 장점 3개, 상세페이지 구성안 및 카피 초안이 자동 생성됩니다.
        </p>
      </div>
    );
  }

  // Copy helper
  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopyStatus(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  // Keyword Helpers
  const handleRemoveKeyword = (index) => {
    const nextKeywords = [...(transformedData.keywords || [])];
    nextKeywords.splice(index, 1);
    onChange('keywords', nextKeywords);
  };

  const handleAddKeyword = (e) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    const nextKeywords = [...(transformedData.keywords || []), newKeyword.trim()];
    onChange('keywords', nextKeywords);
    setNewKeyword('');
  };

  // Benefit Helpers
  const handleBenefitChange = (index, field, value) => {
    const nextBenefits = [...(transformedData.key_benefits || [])];
    nextBenefits[index] = { ...nextBenefits[index], [field]: value };
    onChange('key_benefits', nextBenefits);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header & Save Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
              2. AI 상품화 변환 결과
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded-md font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              생성 완료 (수정 가능)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-slate-500" />
            생성일시: {new Date(transformedData.created_at || Date.now()).toLocaleString('ko-KR')}
          </p>
        </div>

        {/* Save Button */}
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all ${
            savedSuccess
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 cursor-pointer active:scale-95'
          }`}
        >
          {savedSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>DB 저장 완료!</span>
            </>
          ) : isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>저장 중...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>상품 DB에 저장하기</span>
            </>
          )}
        </button>
      </div>

      {/* 1. 한국어 최적화 상품명 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md bg-indigo-950 text-indigo-400 flex items-center justify-center text-[11px] font-mono">1</span>
            한국어 최적화 상품명
          </label>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-mono">
              {(transformedData.generated_title || '').length}자
            </span>
            <button
              type="button"
              onClick={() => handleCopy(transformedData.generated_title || '', 'title')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 transition"
            >
              {copyStatus['title'] ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copyStatus['title'] ? '복사됨' : '복사'}
            </button>
          </div>
        </div>
        <input
          type="text"
          value={transformedData.generated_title || ''}
          onChange={(e) => onChange('generated_title', e.target.value)}
          className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-indigo-900/50 rounded-xl text-sm font-semibold text-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
        />
      </div>

      {/* 2. SEO 핵심 키워드 10개 */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md bg-indigo-950 text-indigo-400 flex items-center justify-center text-[11px] font-mono">2</span>
            SEO 핵심 키워드 10선
          </label>
          <button
            type="button"
            onClick={() => handleCopy((transformedData.keywords || []).join(', '), 'keywords')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 transition"
          >
            {copyStatus['keywords'] ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copyStatus['keywords'] ? '전체 태그 복사됨' : '쉼표(,)로 전체 복사'}
          </button>
        </div>

        {/* Tag chips */}
        <div className="flex flex-wrap gap-2 p-3 bg-slate-950/80 border border-slate-800 rounded-xl min-h-[52px] items-center">
          {(transformedData.keywords || []).map((kw, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-950/70 text-indigo-200 border border-indigo-800/50 shadow-sm"
            >
              <Hash className="w-3 h-3 text-indigo-400" />
              {kw}
              <button
                type="button"
                onClick={() => handleRemoveKeyword(idx)}
                className="hover:text-rose-400 transition"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Add custom tag input */}
          <form onSubmit={handleAddKeyword} className="inline-flex items-center">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="+ 키워드 추가"
              className="px-2 py-1 bg-transparent text-xs text-slate-300 placeholder-slate-600 focus:outline-none border-b border-dashed border-slate-700 w-24 focus:w-32 transition-all"
            />
          </form>
        </div>
      </div>

      {/* 3. 상품 핵심 장점 3개 도출 */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-md bg-indigo-950 text-indigo-400 flex items-center justify-center text-[11px] font-mono">3</span>
          상품 핵심 장점 3개 (차별화 소구점 USP)
        </label>

        <div className="grid grid-cols-1 gap-3">
          {(transformedData.key_benefits || []).map((benefit, idx) => (
            <div 
              key={idx}
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2 relative group hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs font-bold font-mono">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={benefit.title || ''}
                  onChange={(e) => handleBenefitChange(idx, 'title', e.target.value)}
                  placeholder={`핵심 장점 ${idx + 1} 제목`}
                  className="w-full bg-transparent font-semibold text-xs text-white border-b border-transparent focus:border-indigo-500 focus:outline-none pb-0.5"
                />
              </div>
              <textarea
                rows={2}
                value={benefit.description || ''}
                onChange={(e) => handleBenefitChange(idx, 'description', e.target.value)}
                placeholder="장점에 대한 구체적인 고객 가치 및 해결책 설명"
                className="w-full px-2.5 py-1.5 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 4. 상세페이지 5단 구성안 */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-md bg-indigo-950 text-indigo-400 flex items-center justify-center text-[11px] font-mono">4</span>
          상세페이지 기획 구성안 (5단계)
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {(transformedData.detail_structure || []).map((step, idx) => (
            <div key={idx} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 font-mono block">STEP 0{step.step || idx + 1}</span>
                <span className="text-xs font-bold text-slate-200 block mt-0.5 leading-tight">{step.name}</span>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">{step.objective}</p>
              </div>
              {step.components && (
                <div className="mt-2 pt-2 border-t border-slate-800/60">
                  <span className="text-[10px] text-slate-500 block font-medium mb-1">포함 요소:</span>
                  <ul className="text-[10px] text-slate-400 space-y-0.5 list-disc list-inside">
                    {step.components.map((comp, cIdx) => (
                      <li key={cIdx} className="truncate">{comp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 5. 상세페이지 카피 초안 생성 */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md bg-indigo-950 text-indigo-400 flex items-center justify-center text-[11px] font-mono">5</span>
            상세페이지 카피라이팅 초안
          </label>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setCopyTab('preview')}
                className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1 transition ${
                  copyTab === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3 h-3" />
                미리보기
              </button>
              <button
                type="button"
                onClick={() => setCopyTab('edit')}
                className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1 transition ${
                  copyTab === 'edit' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Edit3 className="w-3 h-3" />
                직접 수정
              </button>
            </div>

            {/* Copy Button */}
            <button
              type="button"
              onClick={() => handleCopy(transformedData.detail_copy || '', 'copy')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 transition"
            >
              {copyStatus['copy'] ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copyStatus['copy'] ? '복사 완료' : '전체 카피 복사'}
            </button>
          </div>
        </div>

        {/* Content Box */}
        {copyTab === 'preview' ? (
          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans max-h-96 overflow-y-auto whitespace-pre-wrap selection:bg-indigo-500 selection:text-white">
            {transformedData.detail_copy}
          </div>
        ) : (
          <textarea
            rows={14}
            value={transformedData.detail_copy || ''}
            onChange={(e) => onChange('detail_copy', e.target.value)}
            className="w-full p-4 rounded-xl bg-slate-950/90 border border-slate-700 font-mono text-xs text-slate-200 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y"
            placeholder="상세페이지 카피 내용을 자유롭게 수정하세요."
          />
        )}
      </div>
    </div>
  );
}
