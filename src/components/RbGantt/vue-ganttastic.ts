import type { Plugin } from "vue"
import dayjs from "dayjs"
import isoWeek from "./dayjsplugin/isoWeek"
import isSameOrBefore from "./dayjsplugin/isSameOrBefore"
import isSameOrAfter from "./dayjsplugin/isSameOrAfter"
import isBetween from "./dayjsplugin/isBetween"
import weekOfYear from "./dayjsplugin/weekOfYear"
import advancedFormat from "./dayjsplugin/advancedFormat"
import customParseFormat from "./dayjsplugin/customParseFormat"

import type { GanttBarObject } from "./types.js"
import type { ColorScheme } from "./color-schemes"

import GGanttChart from "./components/GGanttChart.vue"
import GGanttRow from "./components/GGanttRow.vue"

export function extendDayjs() {
  dayjs.extend(isSameOrBefore)
  dayjs.extend(isSameOrAfter)
  dayjs.extend(isBetween)
  dayjs.extend(customParseFormat)
  dayjs.extend(weekOfYear)
  dayjs.extend(isoWeek)
  dayjs.extend(advancedFormat)
}

export type { ColorScheme, GanttBarObject }
export { GGanttChart, GGanttRow }

export const ganttastic: Plugin = {
  install(app, options?) {
    extendDayjs()
    app.component("GGanttChart", GGanttChart)
    app.component("GGanttRow", GGanttRow)
  }
}

export default ganttastic
