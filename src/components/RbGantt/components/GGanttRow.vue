<template>
  <div
    class="g-gantt-row"
    :style="rowStyle"
    @dragover.prevent="isHovering = true"
    @dragleave="isHovering = false"
    @drop="onDrop($event)"
    @mouseover="isHovering = true"
    @mouseleave="isHovering = false"
    @mousedown="onMouseEvent"
    @click="rowClick($event)"
  >
    <div
      v-if="!isBlank(label) && !labelColumnTitle"
      class="g-gantt-row-label"
      :style="{ background: colors.primary, color: colors.text }"
    >
      <slot name="label">
        {{ label }}
      </slot>
    </div>
    <div ref="barContainer" class="g-gantt-row-bars-container" v-bind="$attrs">
      <div name="bar-transition" tag="div">
        <g-gantt-bar v-for="bar in bars" :key="bar.ganttBarConfig.id" :bar="bar">
          <slot name="bar-label" :bar="bar" />
        </g-gantt-bar>
        <GGanttVirtualBar :id="`virtaul-bar-${labelId}`" v-if="Object.keys(virtualBarData).length && virtualBarData.labelId === labelId && labelId" :bar="virtualBarData" @close-virtual-bar="rmVirtualBar" :barContainer="barContainer" @update-bar-time="updateVittaulbarTime">
          <slot />
        </GGanttVirtualBar>
        
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, PropType, type Ref, toRefs, computed, type StyleValue, provide, onMounted, inject } from "vue"

import useTimePositionMapping from "../composables/useTimePositionMapping.js"
import provideConfig from "../provider/provideConfig.js"
import type { GanttBarObject } from "../types"
import GGanttBar from "./GGanttBar.vue"
import GGanttVirtualBar from "./GGanttVirtualBar.vue"
import { BAR_CONTAINER_KEY } from "../provider/symbols"
import dayjs from "dayjs"
import eventBus from '@/utils/eventBus'
import { format } from "path-browserify"
import { cloneDeep } from 'lodash-es'
import useDayjsHelper from "../composables/useDayjsHelper.js"

const { toDayjs } = useDayjsHelper()

const props = defineProps({
  label: {
    type: String as PropType<string>,
    required: true // 假设 label 是必需的
  },
  labelId: {
    type: [String, Number] as PropType<string | number>,
    required: true // 假设 labelId 也是必需的
  },
  bars: {
    type: Array as PropType<GanttBarObject[]>,
    required: true // 假设 bars 是必需的
  },
  canCreateEvent: {
    type: Boolean as PropType<boolean>,
    default: false // 提供默认值，因为这是一个可选的 prop
  },
  highlightOnHover: {
    type: Boolean as PropType<boolean>,
    required: false
  },
});
const virtualBarData = inject('virtualBarData')
const emit = defineEmits<{
  (e: "drop", value: { e: MouseEvent; datetime: string | Date }): void
  (
    e: 'updateVirtualData',
    value: any
  )
}>()

const { rowHeight, colors, labelColumnTitle } = provideConfig()
const { highlightOnHover } = toRefs(props)
const isHovering = ref(false)
// const virtualBar = ref({})
const virtualBarIsDragging = ref(false)

const rowStyle = computed(() => {
  return {
    height: `${rowHeight.value}px`,
    background: highlightOnHover?.value && isHovering.value ? colors.value.hoverHighlight : null
  } as StyleValue
})

const rmVirtualBar = () => {
  // virtualBar.value = {}
  updateVirtualData({})
}

const { mapPositionToTime } = useTimePositionMapping()
const barContainer: Ref<HTMLElement | null> = ref(null)

provide(BAR_CONTAINER_KEY, barContainer)

const onDrop = (e: MouseEvent) => {
  const container = barContainer.value?.getBoundingClientRect()
  if (!container) {
    console.error("Vue-Ganttastic: failed to find bar container element for row.")
    return
  }
  const xPos = e.clientX - container.left
  const datetime = mapPositionToTime(xPos)
  emit("drop", { e, datetime })
}

const mouseStartX = ref(0)
const onMouseEvent = (e) => {
  mouseStartX.value = e.clientX
}
const rowClick = (e) => {
  if (Math.abs(e.clientX - mouseStartX.value) > 5 || !props.canCreateEvent) {
    return
  }
  const container = barContainer.value?.getBoundingClientRect()
  if (!container) {
    console.error("Vue-Ganttastic: failed to find bar container element for row.")
    return
  }
  const xPos = e.clientX - container.left
  const datetime = mapPositionToTime(xPos)
  const eventDate = getRoundedTimes(datetime)
  let data = 
    {
      beginDate: eventDate[0],
      endDate: eventDate[1],
      labelId: props.labelId,
      ganttBarConfig: {
        virtual: true,
        immobile: true
      }
    }
  updateVirtualData(data)
}
const updateVittaulbarTime = (data) => {
  let datetime = dayjs(data.datetime).unix()
  
  let { beginDate, endDate } = virtualBarData.value
  let beginTime = dayjs(beginDate).unix()
  let endTime = dayjs(endDate).unix()
  let virtualBarClone = {
    beginTime,
    endTime,
  }
  if (data.prop === 'beginDate') {
    virtualBarClone.beginTime = datetime
  } else {
    virtualBarClone.endTime = datetime
  }

  if((virtualBarClone.endTime - virtualBarClone.beginTime) <= 10 * 60) return
  
  let newData = {
    ...virtualBarData.value,
    [data.prop]: data.datetime
  }

  updateVirtualData(newData)
}


const updateVirtualData = (data) => {
  data.isPassTime = false
  data.isExistsChedule = false
  let nowTime = dayjs().unix()
  let { beginDate, endDate } = data
  let beginTime = dayjs(beginDate).unix()
  let endTime = dayjs(endDate).unix()
  
  if (beginTime < nowTime) {
    // data.isPassTime = true
  }

  for (let i = 0; i < props.bars.length; i++) {
    const bar = props.bars[i]
    let { myBeginDate, myEndDate } = bar 
    let barBeginTime = dayjs(myBeginDate).unix()
    let barEndTime = dayjs(myEndDate).unix()
    if ((barBeginTime < beginTime && beginTime < barEndTime) || (beginTime < barBeginTime && endTime >= barEndTime)) {
      data.isExistsChedule = true
      break
    }

    if ((barBeginTime <= beginTime && beginTime < barEndTime) || (barBeginTime < endTime && endTime < barEndTime)) {
      data.isExistsChedule = true
      break
    }
  }

  eventBus.emit("updateVirtualData", data);
}
const getRoundedTimes = (timeString) => {  
    const date = dayjs(timeString);  
    const dateTime = date.unix()
    let startTime, endTime;  
    const timeRange = splitTimeRange(date.format('YYYY-MM-DD'), 0, 0, 23, 59, 40)
    let finalTime
    for (let i = 0; i < timeRange.length; i++) {
      const range = timeRange[i];
      let [begin, end] = range
      let beginTime = dayjs(range[0]).unix()
      let endTime = dayjs(range[1]).unix()
      if (beginTime <= dateTime && dateTime <= endTime) {
        finalTime = range
        break
      }
    }
    console.log(finalTime)
    let bars = props.bars
    bars.sort((a, b) => dayjs(a.myEndDate).unix() - dayjs(b.myEndDate).unix())
    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i]
      let { myBeginDate, myEndDate } = bar 
      let barBeginTime = dayjs(myBeginDate).unix()
      let barEndTime = dayjs(myEndDate).unix()

      let [beginDate, endDate] = finalTime
      let beginTime = dayjs(beginDate).unix()
      let endTime = dayjs(endDate).unix()

      if (beginTime < barEndTime && endTime > barEndTime ) {
        finalTime = [myEndDate, finalTime[1] ]
        break
      }

      if (endTime > barBeginTime && beginTime < barBeginTime) {
        finalTime = [finalTime[0], myBeginDate ]
        break
      }
    }
    console.log(finalTime)
    return finalTime
    
    // console.log(splitTimeRange(time.format('YYYY-MM-DD'), 14, 0, 19, 30, 40))
    // return [startTime.format('YYYY-MM-DD HH:mm:ss'), endTime.format('YYYY-MM-DD HH:mm:ss')];  
} 
const isBlank = (str: string) => {
  return (!str || /^\s*$/.test(str))
}

/**
 * 将每天的指定时间段按照给定的分钟间隔进行分割
 * @param {string} date 指定的日期，格式为'YYYY-MM-DD'
 * @param {number} startHour 开始小时
 * @param {number} startMinute 开始分钟
 * @param {number} endHour 结束小时
 * @param {number} endMinute 结束分钟
 * @param {number} interval 分割的分钟间隔
 * @returns {string[][]} 二维数组，其中每个内部数组包含一天的时间分割结果
 */
const splitTimeRange = (date, startHour, startMinute, endHour, endMinute, interval) => {
  const result = [];
  
  // 初始化开始时间和结束时间
  const startTime = dayjs(date).hour(startHour).minute(startMinute);
  const endTime = dayjs(date).hour(endHour).minute(endMinute);
  
  // 循环迭代时间，直到达到结束时间
  let currentTime = startTime;
  while (currentTime.isBefore(endTime) || currentTime.isSame(endTime)) {
    // 计算下一个时间点
    const nextTime = currentTime.add(interval, 'minute');
    
    // 将当前时间和下一个时间作为一对添加到数组中
    result.push([currentTime.format('YYYY-MM-DD HH:mm:ss'), nextTime.format('YYYY-MM-DD HH:mm:ss')]);
    
    // 移动到下一个时间点
    currentTime = nextTime;
  }
  
  // 返回二维数组
  return result;
}


onMounted(() => {
  eventBus.on("add-virtual-event", (labelId) => {
    if (labelId !== props.labelId) {
      virtualBar.value = {}
    }
  });
  eventBus.on('virtual-bar-drag-start', () => {
    virtualBarIsDragging.value = true
  })
  eventBus.on('virtual-bar-drag-end', () => {
    virtualBarIsDragging.value = false
  })

  eventBus.on("check-is-exist-bar", (data) => {
    if (data.labelId === props.labelId) {
      updateVirtualData(data)
    }
  });
})


</script>

<style lang="scss" scope>
.g-gantt-row {
  width: 100%;
  transition: background 0.4s;
  position: relative;
}

.g-gantt-row > .g-gantt-row-bars-container {
  position: relative;
  border-top: 1px solid #eaeaea;
  width: 100%;
  border-bottom: 1px solid #eaeaea;
}

.g-gantt-row-label {
  position: absolute;
  top: 0;
  left: 0px;
  padding: 0px 8px;
  display: flex;
  align-items: center;
  height: 60%;
  min-height: 20px;
  font-size: 0.8em;
  font-weight: bold;
  border-bottom-right-radius: 6px;
  background: #f2f2f2;
  z-index: 3;
  box-shadow: 0px 1px 4px 0px rgba(0, 0, 0, 0.6);
}

.bar-transition-leave-active,
.bar-transition-enter-active {
  transition: all 0.2s;
}

.bar-transition-enter-from,
.bar-transition-leave-to {
  transform: scale(0.8);
  opacity: 0;
}
</style>
