import { randomBytes } from "crypto";
export const makeToken = () => randomBytes(32).toString("hex");
export const inHours = (h: number) => new Date(Date.now() + h * 3600 * 1000);
