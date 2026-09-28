export function calculateTransactionFee(price: number, area_sqm: number): number {
    let feeRate = 0;
    if (price <= 600000000) {
        feeRate = area_sqm <= 85 ? 0.011 : 0.013;
    } else if (price <= 900000000) {
        feeRate = 0.022 + ((price - 600000000) / 300000000) * 0.002;
    } else {
        feeRate = area_sqm <= 85 ? 0.033 : 0.035;
    }
    return Math.floor(price * feeRate);
}
