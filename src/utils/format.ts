export function formatCurrency(amount: number, showDecimals = true): string {
  const abs = Math.abs(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(abs);
}

export function formatSignedCurrency(amount: number): string {
  const formatted = formatCurrency(amount, true);
  return amount < 0 ? `– ${formatted}` : `+ ${formatted}`;
}

export function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) return accountNumber;
  return `•••• •••• ${accountNumber.slice(-4)}`;
}
