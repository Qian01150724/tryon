"use client";
import { useEffect, useState } from "react";
import { HistoryItem, formatRelativeTime } from "@/lib/history";

interface HistoryPanelProps {
  items: HistoryItem[];
  selectedId: string | null;
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
}

export function HistoryPanel({ items, selectedId, onSelect, onDelete }: HistoryPanelProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!items.length) return null;

  return (
    <div className="bg-gray-50 border-t border-gray-100 px-2 py-2">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="relative flex-none cursor-pointer"
            onClick={() => onSelect(item)}
          >
            <img
              src={item.thumbnail}
              alt="历史记录"
              className={`w-[72px] h-[96px] object-cover rounded ${
                selectedId === item.id ? 'ring-2 ring-purple-500' : ''
              }`}
            />
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
              className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center text-[10px] leading-none transition-colors"
              title="删除"
            >
              ×
            </button>
            <p className="text-[10px] text-gray-500 text-center mt-0.5 w-[72px] truncate">
              {formatRelativeTime(item.timestamp)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
