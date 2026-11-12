# Payment function rules

- Payment status changes ring a data-free broadcast doorbell on `pay-<reference>` (polling is the fallback) — clients learn instantly without reading payment tables.
- Identical pending M-Pesa checkouts are reused instead of re-prompting, and Daraja callback failures may only cancel a pending session — prevents duplicate prompts and forged success.
