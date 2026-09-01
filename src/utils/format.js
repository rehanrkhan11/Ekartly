const FX_RATE = 83; // cosmetic USD -> INR conversion for the storefront

export const inr = (usd) => `\u20B9${Math.round(usd * FX_RATE).toLocaleString("en-IN")}`;
