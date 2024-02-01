import axios from 'axios'
import Chart from 'chart.js/auto'

const getInvoiceData = async () => {
  return axios.get('https://etalon.billing.mycloud.kg/graph/amounts').then((res) => res.data.data)
}

const { PaymentsOnYear, AccountsOnYear, Controllers } = await getInvoiceData()

Number.prototype.sumToLocaleStringWithSom = function () {
  return this.toLocaleString() + 'c̲'
}

// Invoice's Cards' functions

const getOverallInvoiceCount = () => {
  return AccountsOnYear.reduce((acc, item) => {
    if (item.count_invoices > 0) {
      acc += item.count_invoices
    }

    return acc
  }, 0)
}

const getOverallSumOfInvoices = () => {
  return AccountsOnYear.reduce((acc, item) => {
    acc += item.total_invoices

    return acc
  }, 0).sumToLocaleStringWithSom()
}

const getPaidInvoicesSum = () => {
  return PaymentsOnYear.reduce((acc, item) => {
    acc += item.total_payments

    return acc
  }, 0).sumToLocaleStringWithSom()
}

// -------------------------

// Invoice's Charts' functions

const getInvoiceCountByMonth = () => {
  return AccountsOnYear.reduce((acc, item) => {
    acc[item.month_year] = item.count_invoices

    return acc
  }, {})
}

const getInvoiceSumByMonth = () => {
  return AccountsOnYear.reduce((acc, item) => {
    acc[item.month_year] = item.total_invoices

    return acc
  }, {})
}

const getUnpaidInvoiceSumByPerson = () => {
  return Controllers.reduce((acc, item) => {
    if (item.balance > 0) acc[item.last_name] = item.balance

    return acc
  }, {})
}

const getPaidInvoiceSumByPerson = () => {
  return Controllers.reduce((acc, item) => {
    if (item.balance <= 0) acc[item.last_name] = item.balance

    return acc
  }, {})
}

const invoiceBarLabels = Object.keys(getInvoiceCountByMonth())
const invoiceBarData = Object.values(getInvoiceCountByMonth())

const invoiceLineLabels = Object.keys(getInvoiceSumByMonth())
const invoiceLineData = Object.values(getInvoiceSumByMonth())

const unpaidInvoiceHorizBarLabels = Object.keys(getUnpaidInvoiceSumByPerson())
const paidInvoiceHorizBarLabels = Object.keys(getPaidInvoiceSumByPerson())

const invoiceHorizBarLabels = [...unpaidInvoiceHorizBarLabels, ...paidInvoiceHorizBarLabels]
const unpaidInvoiceSumHorizBarData = Object.values(getUnpaidInvoiceSumByPerson())
const paidInvoiceSumHorizBarData = Object.values(getPaidInvoiceSumByPerson())

// ------------------------

// Invoice's DOM manipulation

const invoicesQuantity = getOverallInvoiceCount()
document.querySelector('.invoicesQuantity').innerHTML = invoicesQuantity

const overallSumOfInvoices = getOverallSumOfInvoices()
document.querySelector('.overallSumOfInvoices').innerHTML = overallSumOfInvoices

const paidInvoicesSum = getPaidInvoicesSum()
document.querySelector('.paidInvoicesSum').innerHTML = paidInvoicesSum

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

        if (text > 100) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
          ctx.fillRect(x - 9, y + 5, 18, 15)

          ctx.font = '10px Arial'
          ctx.fillStyle = 'white'
          ctx.fillText(text, x - textWidth / 2, y + 14)
        }

        if (text > 0 && text <= 100) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
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
      })
    })
  },
}

const alwaysShowTooltipForHorizBar = {
  id: 'alwaysShowTooltipForHorizBar',
  afterDatasetsDraw(chart) {
    const { ctx } = chart
    ctx.save()

    chart.data.datasets.forEach((_, idx) => {
      chart.getDatasetMeta(idx).data.forEach((datapoint, index) => {

        let { x, y } = datapoint.tooltipPosition()

        let text = chart.data.datasets[idx].data[index]
        const textWidth = ctx.measureText(text).width

        if (text !== 0 && text > 0 && text > 10000000) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
          ctx.fillRect(x - textWidth, y -5.5, textWidth, 12)

          ctx.font = '9px Arial'
          ctx.fillStyle = 'white'
          ctx.fillText(text, x - textWidth, y + 1)
        }

        if (text > 0 && text < 10000000) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
          ctx.fillRect(x, y- 6, textWidth, 12)

          ctx.font = '9px Arial'
          ctx.fillStyle = 'white'
          ctx.fillText(text, x, y + 1)
        }

        if (text < 0) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
          ctx.fillRect(x - textWidth, y - 6, textWidth, 12)

          ctx.font = '9px Arial'
          ctx.fillStyle = 'white'
          ctx.fillText(text, x - textWidth, y + 1)
        }
      })
    })
  },
}

// Invoice's Charts
let invoiceBarCtx = document.getElementById('invoiceBarChart').getContext('2d')
let invoiceLineCtx = document.getElementById('invoiceLineChart').getContext('2d')
let invoiceHorizBarCtx = document.getElementById('invoiceHorizBarChart').getContext('2d')

new Chart(invoiceBarCtx, {
  type: 'bar',
  data: {
    labels: invoiceBarLabels,
    datasets: [
      {
        label: 'Количество счетов по месяцам',
        data: invoiceBarData,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
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
  },
  plugins: [alwaysShowTooltip],
})

new Chart(invoiceLineCtx, {
  type: 'line',
  data: {
    labels: invoiceLineLabels,
    datasets: [
      {
        label: 'Сумма счетов по месяцам',
        data: invoiceLineData,
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  },
})

new Chart(invoiceHorizBarCtx, {
  type: 'bar',
  data: {
    labels: invoiceHorizBarLabels,
    datasets: [
      {
        label: 'Сумма оплаченных счетов',
        data: paidInvoiceSumHorizBarData,
        backgroundColor: '#86c7f3',
      },
      {
        label: 'Сумма неоплаченных счетов',
        data: unpaidInvoiceSumHorizBarData,
        backgroundColor: 'rgb(255, 205, 86)',
      },
    ],
  },
  options: {
    indexAxis: 'y',
    scales: {
      y: {
        beginAtZero: true,
      },
    }
  },
  plugins: [alwaysShowTooltipForHorizBar],
})

// -------------------------
