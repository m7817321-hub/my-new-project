import React from 'react';
import { Sparkles, Database, Search, Layers, Zap, RefreshCw, Truck, Home, TrendingUp, ArrowLeft } from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  onSelectTab, 
  savedCount, 
  onOpenSaved, 
  onReset,
  isTransforming,
  onNavigateBack,
  canGoBack,
  previousTitle
}) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Internal Back Navigation */}
        <div className="flex items-center gap-3">
          {canGoBack && (
            <button
              onClick={onNavigateBack}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition cursor-pointer shadow-sm active:scale-95"
              title={previousTitle ? `${previousTitle} 화면으로 돌아가기` : '이전 화면으로 돌아가기'}
            >
              <ArrowLeft className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline font-medium text-slate-300">이전:</span>
              <span>{previousTitle || '이전으로'}</span>
            </button>
          )}

          <div 
            onClick={() => onSelectTab('daily')} 
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">WOOJUNG SELLER</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Market & Rank Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden md:block">시장 분석 & 순위 추적 ➔ 1688/도매매 공급처 탐색 ➔ AI 상품화</p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => onSelectTab('daily')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>오늘의 소싱</span>
          </button>

          <button
            onClick={() => onSelectTab('market')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'market'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>시장 분석</span>
          </button>

          <button
            onClick={() => onSelectTab('rank')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'rank'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>순위 추적</span>
          </button>

          {activeTab === 'supplier' && (
            <button
              onClick={() => onSelectTab('supplier')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold bg-purple-600 text-white shadow-sm transition cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>공급처 탐색 Hub</span>
            </button>
          )}

          <button
            onClick={() => onSelectTab('listing')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'listing'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Listing Studio</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {activeTab === 'listing' && (
            <button
              onClick={onReset}
              disabled={isTransforming}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>초기화</span>
            </button>
          )}

          <button
            onClick={onOpenSaved}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition flex items-center gap-2 cursor-pointer shadow-sm relative"
          >
            <Database className="w-4 h-4 text-indigo-400" />
            <span>저장된 상품</span>
            {savedCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-mono flex items-center justify-center font-bold">
                {savedCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
