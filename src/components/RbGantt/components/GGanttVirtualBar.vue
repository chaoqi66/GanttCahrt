<template>
  <div
    :class="['g-vitrual-gantt-bar', bar.isExistsChedule || bar.isPassTime ? 'g-warnning-gantt-bar' : '']"
    :style="{
      position: 'absolute',
      top: `${0}px`,
      left: `${xStart}px`,
      width: `${xEnd - xStart}px`,
      height: `${rowHeight - 2}px`,
      zIndex: isDragging ? 3 : 2
    }"
    @click="onMouseEvent"
  >
    <div class="bar-close" @click="closeEvent">
      <div class="bar-close_icon"><el-icon><Close /></el-icon></div>
    </div>
    <div class="drag-border" id="drag-border-left"></div>
    <div class="drag-border" id="drag-border-right"></div>
    <Teleport to="body">
      <div 
        class="virtual-bar_dialog" 
        v-show="!virtualBarIsDragging"
        :style="dialogStyle">
        <div class="close-icon" @click="closeEvent"><el-icon><Close /></el-icon></div>
        <div>
          <slot />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toRefs, watch, onMounted, inject } from "vue"

import useBarDragManagement from "../composables/useBarDragManagement.js"
import useTimePositionMapping from "../composables/useTimePositionMapping.js"
import useBarDragLimit from "../composables/useBarDragLimit.js"
import type { GanttBarObject } from "../types"
import provideEmitBarEvent from "../provider/provideEmitBarEvent.js"
import provideConfig from "../provider/provideConfig.js"
import { BAR_CONTAINER_KEY } from "../provider/symbols"
import eventBus from "../composables/eventBus";


const props = defineProps<{
  bar: GanttBarObject,
  barContainer: any
}>()
const emitBarEvent = provideEmitBarEvent()
const config = provideConfig()
const { rowHeight } = config

const { bar } = toRefs(props)
const { mapTimeToPosition, mapPositionToTime } = useTimePositionMapping()
const { initDragOfBar, initDragOfBundle } = useBarDragManagement()
const { setDragLimitsOfGanttBar } = useBarDragLimit()

const emit = defineEmits(['close-virtual-bar', 'update-bar-time'])

const isDragging = ref(false)
const virtualBarIsDragging = ref(false)


function firstMousemoveCallback(e: MouseEvent) {
  barConfig.value.bundle != null ? initDragOfBundle(bar.value, e) : initDragOfBar(bar.value, e)
  isDragging.value = true
}

const prepareForDrag = () => {
  setDragLimitsOfGanttBar(bar.value)
  if (barConfig.value.immobile) {
    return
  }

  window.addEventListener("mousemove", firstMousemoveCallback, {
    once: true
  }) // on first mousemove event
  window.addEventListener(
    "mouseup",
    () => {
      // in case user does not move the mouse after mousedown at all
      window.removeEventListener("mousemove", firstMousemoveCallback)
      isDragging.value = false
    },
    { once: true }
  )
}

const barContainerEl = inject(BAR_CONTAINER_KEY)

const onMouseEvent = (e: MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
}
const closeEvent = () => {
  emit('close-virtual-bar')
  emitBarEvent({ type: 'mouseleave' } as MouseEvent, bar.value, undefined)
}
const resizeClick = (e) => {
  e.preventDefault()
  e.stopPropagation()
}

const { barStart, barEnd, width, chartStart, chartEnd, chartSize } = config

const xStart = ref(0)
const xEnd = ref(0)

const bindBorderDragHandle = (el, prop) => {
  el.addEventListener('mousedown', (e) => {
    eventBus.emit('virtual-bar-drag-start')
    virtualBarIsDragging.value = true
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
  })
  function onMouseMove(e) {
      // 计算鼠标移动的距离  
      const xPos = e.clientX - props.barContainer.getBoundingClientRect().left
      const datetime = mapPositionToTime(xPos)
      emit('update-bar-time', { prop, datetime })
  }

  function onMouseUp() {
      // 停止拖动时移除事件监听器  
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      eventBus.emit('virtual-bar-drag-end')
      virtualBarIsDragging.value = false
  }
}

const dialogStyle = computed(() => {
  let position = {}
  let barRowRect = props.barContainer.getBoundingClientRect()
  let { innerWidth, innerHeight } = window
  let { left, right, top, bottom } = barRowRect
  position.top = top + 'px'
  console.log(right - left - xEnd.value)
  console.log(xEnd.value)
  if ((right - left - xEnd.value) > 480) {
    position.left = left + xEnd.value + 'px'
  } else {
    position.right = innerWidth - left - xStart.value + 'px'
  }
  return position
})
onMounted(() => {
  watch(
    [bar, width, chartStart, chartEnd, chartSize.width],
    () => {
      xStart.value = mapTimeToPosition(bar.value['beginDate'])
      xEnd.value = mapTimeToPosition(bar.value['endDate'])
    },
    { deep: true, immediate: true }
  )
  bindBorderDragHandle(document.getElementById('drag-border-left'), 'beginDate')
  bindBorderDragHandle(document.getElementById('drag-border-right'), 'endDate')
})
</script>

<style scoped lang="scss">
.g-vitrual-gantt-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(64, 158, 255, 0.2);
  border: 1px solid rgba(64, 158, 255, 1);
  box-sizing: border-box;
  position: relative;
}
.g-warnning-gantt-bar {
  background: rgba(221, 30, 39, 0.2);
  border: 1px solid rgba(221, 30, 39, 1);
}
.bar-close {
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  width: 50%;
  height: 30px;
}
.bar-close_icon {
  font-size: 20px;
  color: rgba(64, 158, 255, 0.7);
  display: none;
}
.bar-close:hover .bar-close_icon  {
  display: block;
}
.drag-border {
  /* background: red; */
  width: 15px;
  height: 100%;
  z-index: 100;
  position: absolute;
  cursor: ew-resize;
  top: 0;
  
}
#drag-border-left {
  left: -5px;
}
#drag-border-right {
  right: -5px;
}
.virtual-bar_dialog {
  position: absolute;
  background: #fff;
  border-radius: 8px;
  box-shadow: var(--el-box-shadow);
  padding: 30px 15px 20px;
  width: 450px;
  top: 0px;
  z-index: 99;
  .close-icon {
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
  }
}
.g-gantt-bar-label {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 0 14px 0 14px; /* 14px is the width of the handle */
  display: flex;
  justify-content: center;
  align-items: center;
}
.g-gantt-bar-label > * {
}
.g-gantt-bar-handle-left,
.g-gantt-bar-handle-right {
  position: absolute;
  width: 10px;
  height: 100%;
  background: white;
  opacity: 0.7;
  border-radius: 0px;
  cursor: ew-resize;
  top: 0;
}
.g-gantt-bar-handle-left {
  left: 0;
}
.g-gantt-bar-handle-right {
  right: 0;
}

.g-gantt-bar-label img {
  pointer-events: none;
}

</style>
