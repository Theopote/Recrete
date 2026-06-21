/**
 * Thin compatibility layer — delegates to dual-mode store in lib/db/bim-models.
 */
export {
  listBimModels,
  getBimModel,
  addBimModel,
  updateBimModel,
  deleteBimModel,
  buildMetadata,
} from "@/lib/db/bim-models";
