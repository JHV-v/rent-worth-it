'use client'

import { useState, useCallback } from 'react'
import type { RentFormData } from '../lib/adapter'
import HeaderSection from './HeaderSection'
import TagSelectGroup from './TagSelectGroup'
import DetailTagGroup from './DetailTagGroup'
import BasicInfoFields from './BasicInfoFields'
import ContractSelectGroup from './ContractSelectGroup'
import CommuteInput from './CommuteInput'

// ============================================================
// 表单选项配置
// ============================================================

const CITY_TYPES = ['一线', '新一线', '二线', '三线及以下']
const HOUSING_TYPES = ['整租一居', '整租二居', '合租主卧', '合租次卧']
const UTILITY_TYPES = ['民水民电', '商水商电']
const SUNLIGHT_OPTIONS = ['阳光大满贯', '中规中矩', '常年小黑屋']
const SUNLIGHT_ICONS = [
  { icon: 'wb_sunny', color: 'text-amber-500' },
  { icon: 'cloud', color: 'text-slate-400' },
  { icon: 'nights_stay', color: 'text-indigo-500' },
]
const NOISE_OPTIONS = ['极其安静', '偶尔噪音', '隔音极差']
// v1.6.3 D5/D12b：周边便利度拆成"商超 / 餐饮 / 医疗"3 个独立维度，每个 3 档
const CONVENIENCE_OPTIONS = ['很方便', '一般', '不方便']
const SPACE_OPTIONS = ['拥挤', '偏小', '刚好', '宽敞']
// v1.6.3 D12a：楼层 4 档（旧 3 档由 normalize 自动迁移）
const FLOOR_OPTIONS = ['电梯房', '低层步梯(1-3)', '中层步梯(4-5)', '高层步梯(6+)']
const APPLIANCE_OPTIONS = ['齐全且新', '刚好够用', '破旧老化', '纯毛坯房']
const BATHROOM_OPTIONS = ['独立卫浴', '双人共卫', '多人共卫']
const KITCHEN_OPTIONS = ['不做饭', '偶尔排队', '经常排队', '基本自由使用']
const DETAIL_OPTIONS = [
  '宠物友好', '晾晒方便', '有阳台', '快递方便', '外卖方便', '晚上安静',
  '隔壁不吵', '电梯稳定', '附近便利店多', '适合居家办公', '收纳空间够', '小区安全感好',
]

// ============================================================
// 表单数据初始值
// ============================================================

function createEmptyForm(): RentFormData {
  return {
    salary: '',
    rent: '',
    deposit: '押一',
    agencyFee: '无',
    paymentCycle: '月付',
    contractTerm: '1年',
    activeOptions: {},
    commuteTimes: {},
    commuteOrder: ['骑行', '公共交通', '驾车', '步行'],
  }
}

// ============================================================
// Props
// ============================================================

interface RentFormProps {
  initialData?: RentFormData | null
  onSubmit: (data: RentFormData) => void
  errorMessage?: string | null
  onClearError?: () => void
}

export default function RentForm({ initialData, onSubmit, errorMessage, onClearError }: RentFormProps) {
  const [form, setForm] = useState<RentFormData>(initialData ?? createEmptyForm)

  const updateOption = useCallback((label: string, value: string | string[]) => {
    setForm((prev) => ({
      ...prev,
      activeOptions: { ...prev.activeOptions, [label]: Array.isArray(value) ? value : [value] },
    }))
    onClearError?.()
  }, [onClearError])

  const updateContract = useCallback((field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    onClearError?.()
  }, [onClearError])

  const handleSubmit = () => {
    onSubmit(form)
  }

  // 当前租赁类型，用于判断合租专属字段显示
  const housingType = form.activeOptions['租赁类型']?.[0]
  const isShared = housingType?.startsWith('合租')

  return (
    <main className="max-w-xl mx-auto px-4 py-12 space-y-8">
      <HeaderSection />

      <div className="bg-white rounded-3xl border border-stone-100/60 overflow-hidden transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.05),0_1px_4px_rgba(0,0,0,0.02)]">
        {/* 基础开销 */}
        <section className="p-8 space-y-10">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-50">
            <span className="material-symbols-outlined text-primary">payments</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">基础开销</h2>
          </div>

          <div className="space-y-6">

          <TagSelectGroup
            label="城市类型"
            options={CITY_TYPES}
            value={form.activeOptions['城市类型']?.[0]}
            onChange={(v) => updateOption('城市类型', v)}
            variant="segmented"
          />

          <TagSelectGroup
            label="租赁类型"
            options={HOUSING_TYPES}
            value={form.activeOptions['租赁类型']?.[0]}
            onChange={(v) => updateOption('租赁类型', v)}
            variant="segmented"
          />

          <BasicInfoFields
            salary={form.salary}
            rent={form.rent}
            housingType={housingType}
            onSalaryChange={(v) => setForm((prev) => ({ ...prev, salary: v }))}
            onRentChange={(v) => setForm((prev) => ({ ...prev, rent: v }))}
          />

          <ContractSelectGroup
            deposit={form.deposit}
            agencyFee={form.agencyFee}
            paymentCycle={form.paymentCycle}
            contractTerm={form.contractTerm}
            onChange={updateContract}
          />

          <TagSelectGroup
            label="水电收费"
            options={UTILITY_TYPES}
            value={form.activeOptions['水电收费']?.[0]}
            onChange={(v) => updateOption('水电收费', v)}
            variant="segmented"
          />
          </div>
        </section>

        <div className="h-px bg-stone-100" />

        {/* 通勤出行 */}
        <section className="p-8 space-y-10">
          <div className="flex items-center justify-between pb-2 border-b border-stone-50">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">commute</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">通勤出行</h2>
            </div>
          </div>

          <CommuteInput
            times={form.commuteTimes}
            order={form.commuteOrder}
            onTimesChange={(times) => setForm((prev) => ({ ...prev, commuteTimes: times }))}
            onOrderChange={(order) => setForm((prev) => ({ ...prev, commuteOrder: order }))}
          />
        </section>

        <div className="h-px bg-stone-100" />

        {/* 居住体验 */}
        <section className="p-8 space-y-10">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-50">
            <span className="material-symbols-outlined text-primary">home_work</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">居住体验</h2>
          </div>

          <div className="space-y-6">

          <TagSelectGroup
            label="采光通风"
            options={SUNLIGHT_OPTIONS}
            value={form.activeOptions['采光通风']?.[0]}
            onChange={(v) => updateOption('采光通风', v)}
            variant="grid"
            icons={SUNLIGHT_ICONS}
          />

          <TagSelectGroup
            label="隔音水平"
            options={NOISE_OPTIONS}
            value={form.activeOptions['隔音水平']?.[0]}
            onChange={(v) => updateOption('隔音水平', v)}
            variant="segmented"
          />

          <TagSelectGroup
            label="商超便利"
            options={CONVENIENCE_OPTIONS}
            value={form.activeOptions['商超便利']?.[0]}
            onChange={(v) => updateOption('商超便利', v)}
            variant="segmented"
          />

          <TagSelectGroup
            label="餐饮便利"
            options={CONVENIENCE_OPTIONS}
            value={form.activeOptions['餐饮便利']?.[0]}
            onChange={(v) => updateOption('餐饮便利', v)}
            variant="segmented"
          />

          <TagSelectGroup
            label="医疗便利"
            options={CONVENIENCE_OPTIONS}
            value={form.activeOptions['医疗便利']?.[0]}
            onChange={(v) => updateOption('医疗便利', v)}
            variant="segmented"
          />

          <TagSelectGroup
            label="空间感觉"
            options={SPACE_OPTIONS}
            value={form.activeOptions['空间感觉']?.[0]}
            onChange={(v) => updateOption('空间感觉', v)}
            variant="segmented"
          />

          <TagSelectGroup
            label="楼层类型"
            options={FLOOR_OPTIONS}
            value={form.activeOptions['楼层类型']?.[0]}
            onChange={(v) => updateOption('楼层类型', v)}
            variant="segmented"
          />

          <TagSelectGroup
            label="家电配置"
            options={APPLIANCE_OPTIONS}
            value={form.activeOptions['家电配置']?.[0]}
            onChange={(v) => updateOption('家电配置', v)}
            variant="segmented"
          />

          {isShared && (
            <>
              <TagSelectGroup
                label="卫浴体验 (合租)"
                labelIcon="bathtub"
                options={BATHROOM_OPTIONS}
                value={form.activeOptions['卫浴体验 (合租)']?.[0]}
                onChange={(v) => updateOption('卫浴体验 (合租)', v)}
                variant="segmented"
              />
              <TagSelectGroup
                label="厨房体验 (合租)"
                labelIcon="restaurant"
                options={KITCHEN_OPTIONS}
                value={form.activeOptions['厨房体验 (合租)']?.[0]}
                onChange={(v) => updateOption('厨房体验 (合租)', v)}
                variant="segmented"
              />
            </>
          )}
          </div>
        </section>

        <div className="h-px bg-stone-100" />

        {/* 生活小细节 */}
        <section className="p-8 space-y-10">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-50">
            <span className="material-symbols-outlined text-primary">tips_and_updates</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">生活小细节</h2>
          </div>

          <div className="space-y-6">
          <DetailTagGroup
            label="生活小细节"
            options={DETAIL_OPTIONS}
            values={form.activeOptions['生活小细节'] ?? []}
            onChange={(v) => updateOption('生活小细节', v)}
          />
          </div>
        </section>

        <div className="h-px bg-stone-100" />

        {/* 提交按钮 */}
        <div className="p-8 bg-stone-50/80 border-t border-stone-100 space-y-3">
          {errorMessage && (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {errorMessage}
            </div>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full premium-btn py-4 rounded-2xl text-white font-headline-sm shadow-lg shadow-primary/30 btn-hover-effect flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined fill-1">search</span>
            查看我的租房性价比报告
          </button>
        </div>
      </div>
    </main>
  )
}
