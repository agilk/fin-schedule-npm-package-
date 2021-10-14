"use strict";

function scheduleMaker({
  amount,
  periods,
  startDate,
  unifiedDate,
  payFirst = false,
  rounded = 5,
  initialPayment = 0,
  multipliers = [],
}) {
  function startFromDate() {
    const contractDate = new Date(startDate);
    if (unifiedDate) {
      const month = contractDate.getMonth() - (contractDate.getDate() < unifiedDate ? 1 : 0);
      const date = new Date(contractDate);
      date.setFullYear(contractDate.getFullYear(), month, unifiedDate);
      return date;
    }
    return contractDate;
  }

  function round(amount, rounded) {
    return rounded * Math.ceil(amount / rounded);
  }

  const contractDate = startFromDate();

  const initialArray = initialPayment
    ? [
        {
          id: 1,
          pay: initialPayment,
          debt: amount,
          date: new Date(),
          doNotCount: true,
        },
      ]
    : [];

  const indexIncrementer = initialPayment ? 2 : 1;

  return Array.from(new Array(periods)).reduce((acc, item, index) => {
    const date = new Date(contractDate);
    date.setMonth(date.getMonth() + index + (payFirst ? 0 : 1));
    if (date.getDate() !== contractDate.getDate()) {
      date.setDate(0);
    }

    const daysPast = Math.max(0, (new Date(startDate) - new Date(date)) / 86400000);

    const [multiplier = 1] = multipliers.find(f => f[1] <= daysPast && daysPast <= f[2]) || [1];

    const prevPays = acc.reduce((c, i) => c + i.pay, 0);
    const payMaxDiff = acc.reduce((c, i) => c + i.payMaxDiff, 0);
    const prevMaxPay = acc.filter(f => !f.doNotCount).reduce((c, i) => (c > i.pay ? c : i.pay), 0);
    const mustPay = amount + (initialPayment ? initialPayment : 0) - prevPays - payMaxDiff;

    const monthly = Math.max(prevMaxPay, mustPay / (periods - index));
    const annuity = round(monthly, rounded);

    const payMax = round(mustPay > annuity ? annuity : mustPay, rounded);
    const pay = round(payMax * multiplier, rounded);
    const debt = mustPay - Math.min(pay, mustPay) - payMax + pay;
    if (pay > 0) {
      acc.push({
        id: index + indexIncrementer,
        pay: Math.min(pay, mustPay),
        payMaxDiff: pay !== payMax ? payMax - pay : 0,
        debt,
        date: new Date(Math.max(Number(new Date(startDate)), Number(new Date(date)))),
      });
    }
    return acc;
  }, initialArray);
}

module.exports = {
  scheduleMaker,
};
