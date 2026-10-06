/** Kwoty trzymamy w groszach (int), żeby nie gubić groszy na floatach. */
export const zl = (value: number) => Math.round(value * 100)

const whole = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 })
const cents = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** 32 900 zł, 4,50 zł: grosze tylko wtedy, gdy są. */
export const formatPLN = (grosze: number) =>
  `${(grosze % 100 === 0 ? whole : cents).format(grosze / 100)} zł`
