'use client'

import { useId } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface CommuteItem {
  id: string
  label: string
  icon: string
  minutes: string
}

interface CommuteInputProps {
  times: Record<string, string>
  order: string[]
  onTimesChange: (times: Record<string, string>) => void
  onOrderChange: (order: string[]) => void
}

const COMMUTE_ICONS: Record<string, string> = {
  骑行: 'directions_bike',
  公共交通: 'directions_bus',
  驾车: 'directions_car',
  步行: 'directions_walk',
}

const COMMUTE_COMMENTS: Record<number, string> = {
  0: '不考虑此方式',
  15: '晨练刚热身就到了',
  30: '刚好刷完两集短剧',
  45: '闭目养神的好时机',
  60: '可以读完半本书了',
  90: '通勤极限，勇气可嘉',
  120: '这属于跨城旅行吧',
}

function getCommuteComment(minutes: number): string {
  const keys = Object.keys(COMMUTE_COMMENTS)
    .map(Number)
    .sort((a, b) => a - b)
  let closest = keys[0]
  for (const key of keys) {
    if (Math.abs(minutes - key) < Math.abs(minutes - closest)) {
      closest = key
    }
  }
  return COMMUTE_COMMENTS[closest]
}

function SortableItem({
  item,
  onMinutesChange,
}: {
  item: CommuteItem
  onMinutesChange: (id: string, value: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const inputId = useId()
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    // v1.6.4：拖拽期间提示浏览器走 GPU 合成层，避免布局抖动卡顿（移动端尤其明显）
    willChange: isDragging ? ('transform' as const) : undefined,
    touchAction: 'pan-y' as const,
  }

  const minutes = parseInt(item.minutes, 10) || 0
  const comment = minutes > 0 ? getCommuteComment(minutes) : ''

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`draggable-item flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 transition-all ${
        isDragging ? 'scale-[1.02] shadow-lg' : ''
      }`}
    >
      <button
        type="button"
        aria-label="拖动排序"
        className="cursor-grab active:cursor-grabbing text-on-surface-variant touch-none p-2 -m-1 select-none"
        {...attributes}
        {...listeners}
      >
        <span className="material-symbols-outlined pointer-events-none">drag_indicator</span>
      </button>
      <span className={`material-symbols-outlined text-primary`}>{COMMUTE_ICONS[item.label]}</span>
      <label htmlFor={inputId} className="font-label-md text-label-md text-on-surface min-w-[48px] sm:min-w-[60px]">
        {item.label}
      </label>
      <div className="flex-1 flex items-center gap-1 justify-end sm:justify-start">
        <input
          id={inputId}
          type="number"
          inputMode="numeric"
          min={0}
          max={300}
          step={1}
          aria-label={`${item.label}通勤时长（分钟）`}
          value={item.minutes}
          onChange={(e) => onMinutesChange(item.id, e.target.value)}
          placeholder="0"
          className="w-16 sm:w-20 px-2 sm:px-3 py-2 rounded-lg border border-outline-variant/50 bg-white text-on-surface text-center font-body-md focus:outline-none"
        />
        <span className="text-on-surface-variant text-sm">min</span>
      </div>
      {comment && (
        <span className="hidden sm:inline text-xs text-on-surface-variant max-w-[120px] truncate">{comment}</span>
      )}
    </div>
  )
}

export default function CommuteInput({ times, order, onTimesChange, onOrderChange }: CommuteInputProps) {
  const defaultOrder = ['骑行', '公共交通', '驾车', '步行']
  const currentOrder = order.length > 0 ? order : defaultOrder

  const items: CommuteItem[] = currentOrder.map((label) => ({
    id: label,
    label,
    icon: COMMUTE_ICONS[label],
    minutes: times[label] ?? '',
  }))

  // v1.6.4：拖动手感优化
  // - PointerSensor distance 5→3：桌面端更灵敏
  // - TouchSensor 改用 distance（取代 delay 200ms）：移动端按下立即响应，避免按住等待的延迟感
  //   listeners 只挂在拖动手柄按钮上（已带 touch-none），不会拦截 list 外的滚动手势
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = currentOrder.indexOf(active.id as string)
    const newIndex = currentOrder.indexOf(over.id as string)
    if (oldIndex < 0 || newIndex < 0) return
    const newOrder = arrayMove(currentOrder, oldIndex, newIndex)
    onOrderChange(newOrder)
  }

  const handleMinutesChange = (id: string, value: string) => {
    onTimesChange({ ...times, [id]: value })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-on-surface-variant">
        <span className="material-symbols-outlined text-sm">swap_vert</span>
        <span>拖拽排序 · 顶部权重最高</span>
        <span className="text-stone-300">·</span>
        <span>0 min 表示不考虑此方式</span>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((item) => (
              <SortableItem key={item.id} item={item} onMinutesChange={handleMinutesChange} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
