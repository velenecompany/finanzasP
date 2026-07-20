import {
  pgTable, uuid, text, varchar, timestamp, numeric,
  integer, boolean, pgEnum, index, jsonb,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["user", "admin"]);
export const txType = pgEnum("tx_type", ["income", "expense"]);
export const saleType = pgEnum("sale_type", ["menudeo", "mayoreo"]);
export const moveType = pgEnum("move_type", ["in", "out", "adjust"]);
export const business = pgEnum("business", ["vapes", "velene"]);
export const capitalType = pgEnum("capital_type", ["injection", "withdrawal"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  role: userRole("role").default("user").notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  verifyToken: text("verify_token"),
  verifyExpires: timestamp("verify_expires"),
  onboarded: boolean("onboarded").default(false).notNull(),
  resetToken: text("reset_token"),
  resetExpires: timestamp("reset_expires"),
  splitExpenses: integer("split_expenses").default(50).notNull(),
  splitGoals: integer("split_goals").default(30).notNull(),
  splitDebts: integer("split_debts").default(20).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 80 }).notNull(),
  type: txType("type").notNull(),
  color: varchar("color", { length: 9 }).default("#5A616B"),
  isDefault: boolean("is_default").default(false),
}, (t) => ({ userIdx: index("cat_user_idx").on(t.userId) }));

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  type: txType("type").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  userDateIdx: index("tx_user_date_idx").on(t.userId, t.date),
  typeIdx: index("tx_type_idx").on(t.type),
}));

export const budgets = pgTable("budgets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "cascade" }).notNull(),
  limit: numeric("limit", { precision: 12, scale: 2 }).notNull(),
  period: varchar("period", { length: 10 }).default("monthly").notNull(),
}, (t) => ({ userIdx: index("budget_user_idx").on(t.userId) }));

export const financialGoals = pgTable("financial_goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  targetAmount: numeric("target_amount", { precision: 12, scale: 2 }).notNull(),
  currentAmount: numeric("current_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  targetDate: timestamp("target_date"),
  priority: integer("priority").default(2).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({ userIdx: index("goal_user_idx").on(t.userId) }));

export const debts = pgTable("debts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  creditor: varchar("creditor", { length: 120 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  remaining: numeric("remaining", { precision: 12, scale: 2 }).notNull(),
  interestRate: numeric("interest_rate", { precision: 5, scale: 2 }).default("0"),
  dueDate: timestamp("due_date"),
}, (t) => ({ userIdx: index("debt_user_idx").on(t.userId) }));

export const creditCards = pgTable("credit_cards", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 80 }).notNull(),
  creditLimit: numeric("credit_limit", { precision: 12, scale: 2 }).notNull(),
  currentBalance: numeric("current_balance", { precision: 12, scale: 2 }).default("0").notNull(),
  cutoffDay: integer("cutoff_day"),
  paymentDay: integer("payment_day"),
}, (t) => ({ userIdx: index("cc_user_idx").on(t.userId) }));

export const creditCardTransactions = pgTable("credit_card_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  cardId: uuid("card_id").references(() => creditCards.id, { onDelete: "cascade" }).notNull(),
  type: varchar("type", { length: 10 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  date: timestamp("date").defaultNow().notNull(),
}, (t) => ({ cardIdx: index("cctx_card_idx").on(t.cardId) }));

export const businesses = pgTable("businesses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 80 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({ userIdx: index("biz_user_idx").on(t.userId) }));

export const vapeProducts = pgTable("vape_products", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  business: business("business").default("vapes").notNull(),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  brand: varchar("brand", { length: 80 }),
  flavor: varchar("flavor", { length: 80 }),
  stock: integer("stock").default(0).notNull(),
  unitCost: numeric("unit_cost", { precision: 10, scale: 2 }).notNull(),
  priceRetail: numeric("price_retail", { precision: 10, scale: 2 }).notNull(),
  priceWholesale: numeric("price_wholesale", { precision: 10, scale: 2 }).notNull(),
  lowStockAlert: integer("low_stock_alert").default(5).notNull(),
}, (t) => ({ userIdx: index("vp_user_idx").on(t.userId) }));

export const vapeInventoryMovements = pgTable("vape_inventory_movements", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").references(() => vapeProducts.id, { onDelete: "cascade" }).notNull(),
  type: moveType("type").notNull(),
  quantity: integer("quantity").notNull(),
  note: text("note"),
  date: timestamp("date").defaultNow().notNull(),
}, (t) => ({ prodIdx: index("vim_prod_idx").on(t.productId) }));

export const vapeSales = pgTable("vape_sales", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  business: business("business").default("vapes").notNull(),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => vapeProducts.id, { onDelete: "set null" }),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  profit: numeric("profit", { precision: 10, scale: 2 }).notNull(),
  saleType: saleType("sale_type").notNull(),
  date: timestamp("date").defaultNow().notNull(),
}, (t) => ({ userDateIdx: index("vs_user_date_idx").on(t.userId, t.date) }));

export const vapeExpenses = pgTable("vape_expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  business: business("business").default("vapes").notNull(),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }),
  concept: varchar("concept", { length: 120 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  date: timestamp("date").defaultNow().notNull(),
}, (t) => ({ userIdx: index("ve_user_idx").on(t.userId) }));

export const capitalMovements = pgTable("capital_movements", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  business: business("business").default("vapes").notNull(),
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }),
  type: capitalType("type").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  note: text("note"),
  date: timestamp("date").defaultNow().notNull(),
}, (t) => ({ userIdx: index("cap_user_idx").on(t.userId, t.business) }));

export const aiChatSessions = pgTable("ai_chat_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 160 }).default("Nueva conversación").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({ userIdx: index("acs_user_idx").on(t.userId) }));

export const aiChatMessages = pgTable("ai_chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").references(() => aiChatSessions.id, { onDelete: "cascade" }).notNull(),
  role: varchar("role", { length: 12 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({ sessIdx: index("acm_sess_idx").on(t.sessionId) }));

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: varchar("type", { length: 40 }).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  body: text("body"),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({ userReadIdx: index("notif_user_read_idx").on(t.userId, t.read) }));

export const settings = pgTable("settings", {
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).primaryKey(),
  currency: varchar("currency", { length: 3 }).default("MXN").notNull(),
  theme: varchar("theme", { length: 10 }).default("dark").notNull(),
  emailAlerts: boolean("email_alerts").default(true).notNull(),
  prefs: jsonb("prefs"),
});
