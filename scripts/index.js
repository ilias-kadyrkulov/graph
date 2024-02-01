import axios from 'axios'
import Chart from 'chart.js/auto'

const getHousesData = async () => {
  return axios.get('https://etalon.billing.mycloud.kg/graph/houses').then((res) => res.data)
}

const { data } = await getHousesData()

Number.prototype.sumToLocaleStringWithSom = function () {
  return this.toLocaleString() + 'c̲'
}

// Houses' Cards' functions

const getOverallDebt = () => {
  return data
    .reduce((acc, item) => {
      if (item.cf_1289 < 0) {
        acc -= item.cf_1289
      }

      return Math.abs(acc)
    }, 0)
    .sumToLocaleStringWithSom()
}

const getDebtHousesQuantity = () => {
  return data.filter((item) => item.cf_1289 > 0).length
}

const getMaxDebtSum = () => {
  const debtsArr = data.filter((item) => item.cf_1289 > 0).map((item) => item.cf_1289)

  return Math.max(...debtsArr).sumToLocaleStringWithSom()
}

const getMinDebtSum = () => {
  const sortedData = data.filter((item) => item.cf_1289 < 0).sort((a, b) => b.cf_1289 - a.cf_1289)

  return Math.abs(sortedData[0].cf_1289).sumToLocaleStringWithSom()
}

const getAverageDebt = () => {
  const debtsArr = data.reduce((acc, item) => {
    if (item.cf_1289 > 0) {
      acc += item.cf_1289
    }
    return acc
  }, 0)
  return (debtsArr / getDebtHousesQuantity()).sumToLocaleStringWithSom()
}

// -------------------------

// Houses' Charts' functions

// 1. Bar Chart

const getNeededFormatDate = (isoDate) => {
  const neededFormatDate = new Date(isoDate)
  const month = new Date(neededFormatDate).getMonth() + 1
  const year = new Date(neededFormatDate).getFullYear()

  return `${year}-${month < 10 ? '0' : ''}${month}`
}

const getContactGrowthByMonth = () => {
  const currentYear = new Date(data[0].createdContact).getFullYear()
  let obj = {}
  for (let i = 1; i <= 12; i++) {
    const formattedDateString = `${currentYear}-${i < 10 ? '0' : ''}${i}`
    obj[formattedDateString] = obj[formattedDateString]
  }
  return data.reduce((acc, item) => {
    const date = getNeededFormatDate(item.createdContact)

    acc[date] = (acc[date] || 0) + 1

    return acc
  }, obj)
}
const houseBarLabels = Object.keys(getContactGrowthByMonth())
const houseBarData = Object.values(getContactGrowthByMonth())

// 2. Pie Chart
const streets = Array.from(new Set(data.map((item) => item.cf_1448)))

const setDebtStreets = () => {
  return streets.reduce((acc, street) => {
    acc[street] = null

    return acc
  }, {})
}

const obj = setDebtStreets()

const getStreetsDebtSum = () => {
  return data.reduce((acc, street) => {
    acc[street.cf_1448] += street.cf_1289
    return acc
  }, obj)
}

const streetsDebt = Object.values(getStreetsDebtSum())

// -------------------------

// Houses' DOM manipulation

const housesQuantity = data.length
document.querySelector('.housesQuantity').innerHTML = housesQuantity

const overallDebt = getOverallDebt()
document.querySelector('.overallDebt').innerHTML = overallDebt

const housesDebt = getDebtHousesQuantity()
document.querySelector('.housesDebt').innerHTML = housesDebt

const maxDebt = getMaxDebtSum()
document.querySelector('.maxDebt').innerHTML = maxDebt

const minDebt = getMinDebtSum()
document.querySelector('.minDebt').innerHTML = minDebt

const averageDebt = getAverageDebt()
document.querySelector('.averageDebt').innerHTML = averageDebt

// -------------------------

// Houses' Charts

let houseBarCtx = document.getElementById('houseBarChart').getContext('2d')
let housePieCtx = document.getElementById('housePieChart').getContext('2d')

const alwaysShowTooltip = {
  id: 'alwaysShowTooltip',
  afterDatasetsDraw(chart) {
    const { ctx } = chart
    ctx.save()

    chart.data.datasets.forEach((dataset, idx) => {
      chart.getDatasetMeta(idx).data.forEach((datapoint, index) => {
        let { x, y } = datapoint.tooltipPosition()
        let text = chart.data.datasets[idx].data[index]
        const textWidth = ctx.measureText(text).width
        ctx.save()
        if (text > 5) {
          ctx.fillStyle = 'rgb(0,0,0)'
          ctx.fillRect(x - 9, y + 3, 18, 15)

          ctx.font = '10px Arial'
          ctx.fillStyle = 'white'
          ctx.fillText(text, x - textWidth / 2, y + 12)
        }

        if (text > 0 && text <= 5) {
          ctx.fillStyle = 'rgb(0,0,0)'
          ctx.fillRect(x - 9, y - 22, 18, 15)

          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(x - 5, y - 5)
          ctx.lineTo(x + 5, y - 5)
          ctx.fill()

          ctx.font = '10px Arial'
          ctx.fillStyle = 'white'
          ctx.fillText(text, x - textWidth / 2, y - 13)
        }
        ctx.restore()
      })
    })
  },
}

new Chart(houseBarCtx, {
  type: 'bar',
  data: {
    labels: houseBarLabels,
    datasets: [
      {
        label: 'Динамика роста абонентов',
        data: houseBarData,
        backgroundColor: 'rgba(230, 120, 180, 1)',
        borderWidth: 1,
      },
    ],
  },
  options: {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    plugins: {
      tooltip: {
        enabled: true,
      },
    },
  },
  plugins: [alwaysShowTooltip],
})

new Chart(housePieCtx, {
  type: 'pie',
  data: {
    labels: streets,
    datasets: [
      {
        label: 'Сумма задолженности',
        data: streetsDebt,
        backgroundColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 205, 86)',
          'rgb(75, 192, 192)',
        ],
        hoverOffset: 4,
      },
    ],
  },
})

// -------------------------
