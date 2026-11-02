export function verifiedTestPayment(
  payment: { status?: string; domain?: string; reference?: string; amount?: number; currency?: string },
  expected: { reference: string; amount_minor: number; currency: string },
) {
  return payment.status === "success" && payment.domain === "test" &&
    payment.reference === expected.reference && payment.amount === expected.amount_minor &&
    payment.currency === expected.currency;
}

export function checkoutOrigin(origin: string) {
  return origin === "http://localhost:8080" ||
    origin === "https://id-preview--9b8a21c0-ae89-49dd-9c7e-067f57eea87a.lovable.app";
}