import React, { useState } from 'react';
import { X, Database, Trash2, ArrowUpRight, Search, Clock, Tag, DollarSign, CheckCircle2 } from 'lucide-react';

export default function SavedProductModal({ 
  isOpen, 
  onClose, 
  products, 
  onSelectProduct, 
  onDeleteProduct 
}) {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = (products || []).filter(p => {
    const q = search.toLowerCase();
    return (
      (p.original_name && p.original_name.toLowerCase().includes(q)) ||
      (p.generated_title && p.generated_title.toLowerCase().includes(q)) ||
      (p.supplier && p.supplier.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800/50 flex items-center justify-center text-indigo-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                저장된 상품 DB 목록
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-600/30 text-indigo-300 font-normal">
                  {products?.length || 0}건
                </span>
              </h3>
              <p className="text-xs text-slate-400">로컬 SQLite DB에 안전하게 보관된 상품화 데이터입니다.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="상품명, 가공상품명, 공급처 검색..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              {search ? '검색 결과가 없습니다.' : '저장된 상품이 없습니다. 상품화 후 저장해보세요.'}
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-600/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  {/* Status & Created At */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {item.status || 'SAVED'}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.created_at).toLocaleString('ko-KR')}
                    </span>
                    {item.supplier && (
                      <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                        공급처: {item.supplier}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-bold text-white truncate group-hover:text-indigo-300 transition">
                    {item.generated_title || item.original_name}
                  </h4>

                  {/* Original name */}
                  <p className="text-xs text-slate-400 truncate">
                    원문: {item.original_name}
                  </p>

                  {/* Pricing info */}
                  <div className="flex items-center gap-3 text-xs pt-1">
                    <span className="text-slate-400">
                      원가: <strong className="text-slate-300 font-mono">₩{item.cost_price?.toLocaleString()}</strong>
                    </span>
                    <span className="text-slate-400">
                      판매가: <strong className="text-emerald-400 font-mono">₩{item.selling_price?.toLocaleString()}</strong>
                    </span>
                    <span className="text-slate-400">
                      마진율: <strong className="text-indigo-400 font-mono">{item.margin_rate}%</strong>
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => onSelectProduct(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
                  >
                    <span>불러오기</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteProduct(item.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-lg transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
