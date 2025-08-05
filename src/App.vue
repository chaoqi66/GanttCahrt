<template>
  <div class="gantt-container">
    <div class="flex gantt-car">
      <g-gantt-chart
        date-format="YYYY-MM-DD HH:mm:ss"
        :chart-start="queryDay + ' 00:00:00'"
        :chart-end="queryDay + ' 23:59:00'"
        precision="hour"
        :grid="true"
        color-scheme="sky"
        :row-height="48"
        bar-start="myBeginDate"
        bar-end="myEndDate"
        @click-bar="barClick"
        @virtual-event-change="virtualEventChange"
        style="flex: 1"
        ref="ganttChart"
      >
        <template #upper-timeunit>
          <div>日历</div>
        </template>
        <g-gantt-row v-for="(item, index) in barList" :labelId="item.labelId" :bars="item.list" :key="index" canCreateEvent >
          <div class="operate-box">
            <div class="operate-item">
              <div class="label">预约人</div>
              <div class="operate-item-right">
                <el-select style="width: 300px" v-model="operateState.reserveUserId" filterable placeholder="请选择预约人，不填默认自己">
                  <el-option
                    v-for="item in userList"
                    :key="item.userId"
                    :label="item.userName"
                    :value="item.userId"
                  />
                </el-select>
              </div>
            </div>
            <div class="operate-item">
              <div class="label">时间</div>
              <div class="date-time">
                <el-time-select
                  v-model="operateState.startTime"
                  style="width: 140px"
                  :clearable="false"
                  start="14:00"
                  step="00:15"
                  end="18:00"
                  placeholder="起始时间"
                  @change="updateVirtualData"
                />
                <el-time-select
                  v-model="operateState.endTime"
                  style="width: 140px"
                  :start="operateState.startTime || '14:00'"
                  step="00:15"
                  end="18:00"
                  :clearable="false"
                  placeholder="结束时间"
                  @change="updateVirtualData"
                />
              </div>
            </div>
            <div class="bottom-btn">
              <el-button style="marginLeft: auto"
                type="primary"
                size="small"
                @click="createRsTaxi"
                :disabled="virtualEvent.isExistsChedule"
              >创建预约</el-button>
            </div>
          </div>
        </g-gantt-row>
      </g-gantt-chart>
    </div>
    <el-dialog v-model="viewEventDialog" title="日程详情" width="30%">
      <div>
        显示详情
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, shallowRef, watch, computed, toRaw } from 'vue'
import moment from 'moment-timezone'
import {ElMessage, ElMessageBox, ElButton} from 'element-plus'
let queryDay = ref(moment().format('YYYY-MM-DD'))
let schedule = ref([])
let barList = ref([
    {
        "labelId": "shanghai-urban",
        "list": [
            {
                "myBeginDate": "2025-07-17 14:10:00",
                "myEndDate": "2025-07-17 15:10:00",
                "ganttBarConfig": {
                    "hasHandles": false,
                    "immobile": true,
                    "style": {
                        "borderRadius": "2px",
                        "border": "1px solid #fff",
                        "color": "black",
                        "backgroundColor": "#e1e1e1"
                    },
                    "blockName": "shanghai-urban",
                    "blockStartTime": "2025-07-17 14:10:00",
                    "blockEndTime": "2025-07-17 15:10:00",
                    "blockIsAvail": true,
                    "blockHasOrder": false,
                    "isReservedByCurrentUser": false
                }
            },
            {
                "myBeginDate": "2025-07-17 15:10:00",
                "myEndDate": "2025-07-17 16:10:00",
                "ganttBarConfig": {
                    "hasHandles": false,
                    "immobile": true,
                    "style": {
                        "borderRadius": "2px",
                        "border": "1px solid #fff",
                        "color": "black",
                        "backgroundColor": "#e1e1e1"
                    },
                    "blockName": "shanghai-urban",
                    "blockStartTime": "2025-07-17 15:10:00",
                    "blockEndTime": "2025-07-17 16:10:00",
                    "blockIsAvail": true,
                    "blockHasOrder": false,
                    "isReservedByCurrentUser": false
                }
            },
            {
                "myBeginDate": "2025-07-17 16:10:00",
                "myEndDate": "2025-07-17 17:10:00",
                "ganttBarConfig": {
                    "hasHandles": false,
                    "immobile": true,
                    "style": {
                        "borderRadius": "2px",
                        "border": "1px solid #fff",
                        "color": "black",
                        "backgroundColor": "#e1e1e1"
                    },
                    "blockName": "shanghai-urban",
                    "blockStartTime": "2025-07-17 16:10:00",
                    "blockEndTime": "2025-07-17 17:10:00",
                    "blockIsAvail": true,
                    "blockHasOrder": false,
                    "isReservedByCurrentUser": false
                }
            }
        ]
    },
    {
        "labelId": "shenzhen-urban",
        "list": [
            {
                "myBeginDate": "2025-07-17 14:10:00",
                "myEndDate": "2025-07-17 15:10:00",
                "ganttBarConfig": {
                    "hasHandles": false,
                    "immobile": true,
                    "style": {
                        "borderRadius": "2px",
                        "border": "1px solid #fff",
                        "color": "black",
                        "backgroundColor": "#e1e1e1"
                    },
                    "blockName": "shenzhen-urban",
                    "blockStartTime": "2025-07-17 14:10:00",
                    "blockEndTime": "2025-07-17 15:10:00",
                    "blockIsAvail": true,
                    "blockHasOrder": false,
                    "isReservedByCurrentUser": false
                }
            },
            {
                "myBeginDate": "2025-07-17 15:10:00",
                "myEndDate": "2025-07-17 16:10:00",
                "ganttBarConfig": {
                    "hasHandles": false,
                    "immobile": true,
                    "style": {
                        "borderRadius": "2px",
                        "border": "1px solid #fff",
                        "color": "black",
                        "backgroundColor": "#e1e1e1"
                    },
                    "blockName": "shenzhen-urban",
                    "blockStartTime": "2025-07-17 15:10:00",
                    "blockEndTime": "2025-07-17 16:10:00",
                    "blockIsAvail": true,
                    "blockHasOrder": false,
                    "isReservedByCurrentUser": false
                }
            },
            {
                "myBeginDate": "2025-07-17 16:10:00",
                "myEndDate": "2025-07-17 17:10:00",
                "ganttBarConfig": {
                    "hasHandles": false,
                    "immobile": true,
                    "style": {
                        "borderRadius": "2px",
                        "border": "1px solid #fff",
                        "color": "black",
                        "backgroundColor": "#e1e1e1"
                    },
                    "blockName": "shenzhen-urban",
                    "blockStartTime": "2025-07-17 16:10:00",
                    "blockEndTime": "2025-07-17 17:10:00",
                    "blockIsAvail": true,
                    "blockHasOrder": false,
                    "isReservedByCurrentUser": false
                }
            }
        ]
    },
    {
        "labelId": "shenzhen-airport",
        "list": [
            {
                "myBeginDate": "2025-07-17 14:00:00",
                "myEndDate": "2025-07-17 16:00:00",
                "ganttBarConfig": {
                    "hasHandles": false,
                    "immobile": true,
                    "style": {
                        "borderRadius": "2px",
                        "border": "1px solid #fff",
                        "color": "black",
                        "backgroundColor": "#e1e1e1"
                    },
                    "blockName": "shenzhen-airport",
                    "blockStartTime": "2025-07-17 14:00:00",
                    "blockEndTime": "2025-07-17 16:00:00",
                    "blockIsAvail": true,
                    "blockHasOrder": null,
                    "isReservedByCurrentUser": false
                }
            }
        ]
    }
])
let viewEventDialog = ref(false)
let submitLoading = ref(false)
let viewEventData = ref({})
let editDataId = ref(null)
let viewEventInfo = {}
const operateState = reactive({
  startAddress: '',
  endAddress: '',
  selectDate: moment().format('YYYY-MM-DD'),
  selectTime: '',
  id: '',
  reserveUserId: '',
  startTime: '',
  endTime: '',
})
const userList = ref([{
  userId: '1',
  userName: '张三'
}, {
  userId: '2',
  userName: '李四'
}])
const routeList = ref([])
let AMap: any = null
let map: any = null
let routeCity = 'shenzhen'
let drawRouteName: any = null
const persistent = ref(true)
const ganttChart = ref(null)
const virtualEvent = ref({})

watch(
  () => viewEventDialog.value,
  (newVal) => {
    if (newVal === false) {
      viewEventData.value = viewEventInfo
    }
  }
)

const updateVirtualData = () => {
  if (moment(operateState.startTime, 'HH:mm').isAfter(moment(operateState.endTime, 'HH:mm'))) {
    operateState.endTime = moment(operateState.startTime, 'HH:mm').add(40, 'minutes').format('HH:mm');
  }
  if (moment(operateState.endTime, 'HH:mm').isBefore(moment(operateState.startTime, 'HH:mm'))) {
    operateState.startTime = moment(operateState.endTime, 'HH:mm').subtract(40, 'minutes').format('HH:mm');
  }
  const startTime = `${queryDay.value} ${operateState.startTime}:00`
  const endTime = `${queryDay.value} ${operateState.endTime}:00`
  ganttChart.value.updateVirtualData({ beginDate: startTime, endDate: endTime });
}


const barClick = (e) => {
  console.log(e)
  viewEventDialog.value = true
}

const form = ref()


const fetchCaledar = async () => {

}

defineExpose({ fetchCaledar })

const statusColor = {
  0: '#cccccc',    // 取消
  1: '#409eff',   // 已预约
  2: '#409eff', //已接单
  3: '#409eff'  // 已确认
}
const getStatusColor = (obj) => {
  return statusColor[obj.orderStatus] || '#57d9a3'
}
const virtualEventChange = (data) => {
  operateState.id = data.labelId
  operateState.startTime = moment(data.beginDate).format('HH:mm')
  operateState.endTime = moment(data.endDate).format('HH:mm')
  virtualEvent.value = data
}
const createRsTaxi = async () => {
  
}
onMounted(async () => {

})
</script>
<style lang="scss" scoped>
.gantt-container {
  width: 100%;
  height: 100%;
  border: 20px solid #f2f2f2;
  //border-radius: 20px;
  font-size: 14px;
  box-sizing: border-box;
  padding: 20px;
  .cancel-form {
    .el-select {
      width: 100%;
    }
  }
  .el-select {
    width: 180px;
    margin-left: 20px;
  }

  .gantt-body {
    position: relative;
    width: 100%;
    .body-header {
      .time-line {
        width: 2468px;
        .title {
          width: 260px;
          display: inline-block;
        }
        .time-item {
          display: inline-block;
          width: 90px;
          height: 40px;
          line-height: 40px;
          border: 1px solid #909090;
          text-align: center;
        }
      }
    }
    .body-table {
      display: flex;
      position: relative;
      .table-vehicle {
        width: 260px;
        font-weight: normal;
        position: absolute;
        left: 0;
        top: 0;
        .vehicle {
          box-sizing: border-box;
          width: 100%;
          padding: 0 10px;
          height: 60px;
          line-height: 60px;
          border: 1px solid #909090;
        }
      }
    }
  }
}
.gantt-car {
  height: calc(100vh - 240px);
  overflow-y: auto;
}
.operate-box {
  top: 10px;
  left: 10px;
  background-color: rgba(255,255,255,.8);
  border-radius: 4px;
  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .el-link {
      margin-top: -5px;
    }
  }
  .operate-item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    .label {
      font-size: 14px;
      width: 110px;
      color: #606266;
      margin-right: 10px;
    }
    .operate-item-right {
      flex: 1;
      .exists {
        color: #ff0000;
      }
    }
    .date-time {
      display: flex;
    }
  }
  .el-input {
    width: 100%;
    height: 30px;
    line-height: 30px;
  }
  .bottom-btn {
    margin-left: auto;
    margin-top: 20px;
    display: flex;
  }
}
:deep(.g-gantt-bar-label) {
  padding: 0;
}
#map-container {
  width: 500px;
  height: 500px;
}
</style>
