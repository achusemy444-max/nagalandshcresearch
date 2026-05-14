import { mutation, query } from "./_generated/server";

export const list = query(async ({ db }, { district }) => {
  const cards = db.query("soil_cards");
  if (district) {
    return await cards.filter((q) => q.eq(q.field("district"), district)).collect();
  }
  return await cards.collect();
});

export const save = mutation(async ({ db }, card) => {
  return await db.insert("soil_cards", card);
});

export const deleteCard = mutation(async ({ db }, { id }) => {
  const existing = await db
    .query("soil_cards")
    .filter((q) => q.eq(q.field("id"), id))
    .collect();
  if (existing.length === 0) {
    return null;
  }
  await db.delete("soil_cards", existing[0]._id);
  return { success: true, deletedId: id };
});
