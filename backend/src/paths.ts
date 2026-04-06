import { join } from "node:path";

/** Repository `backend/` directory (parent of `src/`). */
export const BACKEND_ROOT = join(import.meta.dir, "..");
export const UPLOAD_DIR = join(BACKEND_ROOT, "uploads");
