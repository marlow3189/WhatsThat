/** Kwoty trzymamy w groszach (int), żeby nie gubić groszy na floatach. */
export const zl = (value: number) => Math.round(value * 100)

const fmt = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' })
const fmtShort = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 })

export const formatPLN = (grosze: number) => fmt.format(grosze / 100)
export const formatShort = (grosze: number) => `${fmtShort.format(grosze / 100)} zł`
