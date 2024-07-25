export type SaveStatus = "Saved" | "Saving..." | "Failed to Save!";
export const Saved: SaveStatus = "Saved";
export const Saving: SaveStatus = "Saving...";
export const Failed: SaveStatus = "Failed to Save!";
export const saveStatusToColor = {
  Saved: "text-green-700",
  "Saving...": "text-yellow-600",
  "Failed to save!": "font-bold text-red-500",
};
