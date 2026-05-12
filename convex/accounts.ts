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
  await db.delete("accounts", account.id);
  return await db.insert("accounts", account);
});

export const deleteAccount = mutation(async ({ db }, { id }) => {
  return await db.delete("accounts", id);
});
