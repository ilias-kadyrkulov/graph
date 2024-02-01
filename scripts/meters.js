import axios from 'axios'
import Chart from 'chart.js/auto'

const getMetersData = async () => {
  return axios.get('https://etalon.billing.mycloud.kg/graph/counters').then((res) => res.data.data)
}

const { counters, readings } = await getMetersData()

Number.prototype.consumptionToLocaleStringWithMeterCube = function () {
  return this.toLocaleString() + 'м³'
}

// Meters's Cards' functions

const getOverallMetersCount = () => {
  return counters.length
}

const getConsumptionSumOfMeters = () => {
  return counters.reduce((acc, item) => {
    if (item.Result > 0) {
      acc += item.Result
    }

    return acc
  }, 0).consumptionToLocaleStringWithMeterCube()
}

const getСonsumptionForLastMonth = () => {
  return readings[readings.length - 1].total
}

// -------------------------

// Invoice's Charts' functions

const getConsumptionByMonth = () => {
  return readings.reduce((acc, item) => {
    const date = `${item.year}-${item.month}`

    acc[date] = item.total

    return acc
  }, {})
}

const metersBarLabels = Object.keys(getConsumptionByMonth())
const metersBarData = Object.values(getConsumptionByMonth())

// ------------------------

// Meters's DOM manipulation

const metersQuantity = getOverallMetersCount()
document.querySelector('.metersQuantity').innerHTML = metersQuantity

const consumptionSumOfMeters = getConsumptionSumOfMeters()
document.querySelector('.consumptionSumOfMeters').innerHTML = consumptionSumOfMeters

const consumptionForLastMonth = getСonsumptionForLastMonth()
document.querySelector('.consumptionForLastMonth').innerHTML = consumptionForLastMonth

// -------------------------

// Tooltips setup
const alwaysShowTooltip = {
  id: 'alwaysShowTooltip',
  afterDatasetsDraw(chart) {
    const { ctx } = chart
    ctx.save()

    chart.data.datasets.forEach((_, idx) => {
      chart.getDatasetMeta(idx).data.forEach((datapoint, index) => {
        let { x, y } = datapoint.tooltipPosition()
        let text = chart.data.datasets[idx].data[index]
        const textWidth = ctx.measureText(text).width

        if (text > 80) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
          ctx.fillRect(x - 14, y + 5, 30, 15)
        
          ctx.font = '10px Arial'
          ctx.fillStyle = 'white'
          ctx.fillText(text, x - textWidth / 2, y + 14)
        }
        
        if (text <= 80) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
          ctx.fillRect(x - 12, y - 22, 25, 15)
        
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(x - 5, y - 5)
          ctx.lineTo(x + 5, y - 5)
          ctx.fill()
        
          ctx.font = '10px Arial'
          ctx.fillStyle = 'white'
          ctx.fillText(text, x - textWidth / 2, y - 13)
        }
      })
    })
  },
}

// Meters' Charts

let metersBarCtx = document.getElementById('metersBarChart').getContext('2d')

new Chart(metersBarCtx, {
  type: 'bar',
  data: {
    labels: metersBarLabels,
    datasets: [
      {
        label: 'Потребление по месяцам',
        data: metersBarData,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderWidth: 1,
      }
    ],
  },
  options: {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  },
  plugins: [alwaysShowTooltip],
})

// -------------------------
