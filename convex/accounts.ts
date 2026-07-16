import { mutation, query } from "./_generated/server";

export const list = query(async ({ db }) => {
  return await db.query("accounts").collect();
});

export const login = query(async ({ db }, { username, password }) => {
  const accounts = await db
    .query("accounts")
    .filter((q) => q.eq(q.field("username"), username))
    .collect();
  if (accounts.length !== 1) return null;
  const account = accounts[0];
  return account.password === password ? account : null;
});

export const create = mutation(async ({ db }, account) => {
  const existing = await db
    .query("accounts")
    .filter((q) => q.eq(q.field("username"), account.username))
    .collect();
  if (existing.length > 0) {
    throw new Error("Username already exists.");
  }
  return await db.insert("accounts", account);
});

export const update = mutation(async ({ db }, account) => {
  const existing = await db
    .query("accounts")
    .filter((q) => q.eq(q.field("id"), account.id))
    .collect();
  if (existing.length === 0) {
    throw new Error("Account not found.");
  }
  const { _id, _creationTime, ...updateData } = existing[0];
  const { _id: incomingId, _creationTime: incomingCreationTime, ...incomingData } = account as any;
  const mergedData = { ...updateData, ...incomingData };
  await db.patch("accounts", existing[0]._id, mergedData);
  return await db.query("accounts")
    .filter((q) => q.eq(q.field("id"), account.id))
    .collect()
    .then(results => results[0] || null);
});

export const updateConditionNote = mutation(async ({ db }, { id, conditionNote }) => {
  const existing = await db
    .query("accounts")
    .filter((q) => q.eq(q.field("id"), id))
    .collect();
  if (existing.length === 0) {
    throw new Error("Account not found.");
  }
  await db.patch("accounts", existing[0]._id, { conditionNote });
  return await db.query("accounts")
    .filter((q) => q.eq(q.field("id"), id))
    .collect()
    .then(results => results[0] || null);
});

export const deleteAccount = mutation(async ({ db }, { id }) => {
  const existing = await db
    .query("accounts")
    .filter((q) => q.eq(q.field("id"), id))
    .collect();
  if (existing.length === 0) {
    return null;
  }
  return await db.delete("accounts", existing[0]._id);
});
