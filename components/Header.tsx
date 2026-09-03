/**
 * 头部导航组件
 * 展示品牌标识和隐私入口
 */
export function Header() {
  return (
    <header className="h-16 border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-between">
        {/* 品牌标识 - 紫粉渐变 */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧥</span>
          <span className="font-bold text-lg bg-gradient-to-r from-[#7C5CFC] to-[#F472B6] bg-clip-text text-transparent">
            智能换装
          </span>
        </div>

        {/* 右侧 - 隐私信息 */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="hidden sm:inline">🔒 图片不存储</span>
          <a href="#" className="hover:text-[#7C5CFC] transition-colors">
            隐私说明
          </a>
        </div>
      </div>
    </header>
  );
}