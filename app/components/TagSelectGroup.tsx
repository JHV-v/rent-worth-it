'use client'

interface TagSelectGroupProps {
  label: string
  options: string[]
  value: string | undefined
  onChange: (value: string) => void
  variant?: 'segmented' | 'single' | 'grid'
  icons?: Array<{ icon: string; color: string; activeClass?: string; activeIconColor?: string }>
  labelIcon?: string
  /**
   * v1.6.4：segmented 选中态语义化配色（每个选项独立一组浅色调）。
   * 必须是静态字面量，否则 Tailwind JIT 扫不到。
   * 例：['bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700']
   */
  accents?: string[]
}

export default function TagSelectGroup({
  label,
  options,
  value,
  onChange,
  variant = 'segmented',
  icons,
  labelIcon,
  accents,
}: TagSelectGroupProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-on-surface-variant flex items-center gap-1.5">
        {labelIcon && <span className="material-symbols-outlined text-primary text-lg">{labelIcon}</span>}
        {label}
      </label>

      {variant === 'grid' ? (
        <div className="grid grid-cols-3 gap-3">
          {options.map((opt, i) => {
            const isActive = value === opt
            const iconInfo = icons?.[i]
            // 若调用方提供 activeClass，则按选项独立配色；否则走默认 tag-active 紫主调
            const activeStyle = iconInfo?.activeClass
              ? `${iconInfo.activeClass} font-semibold scale-[0.98] shadow-lg ring-2 ring-offset-2 ring-offset-white transition-all duration-300`
              : 'tag-active border-primary/20'
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChange(opt)}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                  isActive ? activeStyle : 'tag-inactive border-transparent'
                }`}
              >
                {iconInfo && (
                  <span
                    className={`material-symbols-outlined text-3xl ${
                      isActive && iconInfo.activeIconColor ? iconInfo.activeIconColor : iconInfo.color
                    }`}
                  >
                    {iconInfo.icon}
                  </span>
                )}
                <span className="text-xs font-medium">{opt}</span>
              </button>
            )
          })}
        </div>
      ) : variant === 'segmented' ? (
        <div className="flex p-1 bg-stone-100 rounded-2xl w-full hover:bg-stone-200/50 transition-colors duration-300 border border-stone-200/40">
          {options.map((opt, i) => {
            const isActive = value === opt
            const accent = accents?.[i] ?? ''
            // 传了 accents → 走"克制语义色"选中态（浅底 + 深字 + 同色细描边）
            // 没传 accents → 走默认 tag-active 紫主调
            const activeClass = accent
              ? `${accent} font-semibold ring-1 ring-inset transition-all duration-300`
              : 'tag-active'
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChange(opt)}
                className={`flex-1 min-w-[60px] py-2.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer text-center ${
                  isActive ? activeClass : 'tag-inactive'
                }`}
              >
                {opt}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {options.map((opt) => {
            const isActive = value === opt
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChange(opt)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer ${
                  isActive ? 'detail-tag-active' : 'detail-tag-inactive'
                }`}
              >
                {opt}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
