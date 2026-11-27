/**
 * The address schools register with Safaricom. Daraja refuses callback URLs containing
 * "mpesa" or "safaricom", so real schools use /api/webhooks/c2b/…; same handler.
 */
export const dynamic = "force-dynamic";
export { POST } from "../../../../mpesa/[campus]/[secret]/[kind]/route";
