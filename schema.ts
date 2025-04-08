import { pgTable, text, serial, integer, numeric, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Store schema
export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  code: text("code").notNull().unique(), // Unique code for the store
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertStoreSchema = createInsertSchema(stores).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// User schema (for auth with store association)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  role: text("role").notNull().default("staff"), // admin, manager, staff
  storeId: integer("store_id").references(() => stores.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Product schema
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").notNull(),
  barcode: text("barcode"),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  cost: numeric("cost", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").default(0).notNull(),
  minStockLevel: integer("min_stock_level").default(5),
  category: text("category"),
  storeId: integer("store_id").references(() => stores.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(products)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    price: z.coerce.string(),  // Convert number to string
    cost: z.coerce.string(),   // Convert number to string
  });

// Customer schema
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  storeId: integer("store_id").references(() => stores.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Bill schema
export const bills = pgTable("bills", {
  id: serial("id").primaryKey(),
  billNumber: text("bill_number").notNull(),
  customerId: integer("customer_id").references(() => customers.id),
  subtotal: text("subtotal").notNull(),
  tax: text("tax").notNull(),
  discount: text("discount").default("0"),
  total: text("total").notNull(),
  status: text("status").notNull().default("paid"),
  notes: text("notes"),
  upiId: text("upi_id"),
  storeId: integer("store_id").references(() => stores.id),
  userId: integer("user_id").references(() => users.id), // User who created the bill
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBillSchema = createInsertSchema(bills)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    subtotal: z.coerce.string(), // Convert number to string
    tax: z.coerce.string(),      // Convert number to string
    discount: z.coerce.string(), // Convert number to string
    total: z.coerce.string(),    // Convert number to string
  });

// Bill items schema
export const billItems = pgTable("bill_items", {
  id: serial("id").primaryKey(),
  billId: integer("bill_id").references(() => bills.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: text("price").notNull(),
  total: text("total").notNull(),
});

export const insertBillItemSchema = createInsertSchema(billItems)
  .omit({
    id: true,
  })
  .extend({
    price: z.coerce.string(), // Convert number to string
    total: z.coerce.string(), // Convert number to string
  });

// Inventory transactions schema
export const inventoryTransactions = pgTable("inventory_transactions", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  type: text("type").notNull(), // 'purchase', 'sale', 'adjustment'
  reference: text("reference"), // bill number or other reference
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInventoryTransactionSchema = createInsertSchema(inventoryTransactions).omit({
  id: true,
  createdAt: true,
});

// Activity logs schema
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(), // 'product', 'customer', 'bill', 'inventory'
  entityId: integer("entity_id"),
  details: text("details"),
  storeId: integer("store_id").references(() => stores.id),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

// Invoice template schema
export const invoiceTemplates = pgTable("invoice_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  isDefault: boolean("is_default").default(false),
  headerHtml: text("header_html"),
  footerHtml: text("footer_html"),
  styles: jsonb("styles"), // Stores JSON with customizable styles
  logoUrl: text("logo_url"),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertInvoiceTemplateSchema = createInsertSchema(invoiceTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for schemas
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Store = typeof stores.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertBill = z.infer<typeof insertBillSchema>;
export type Bill = typeof bills.$inferSelect;

export type InsertBillItem = z.infer<typeof insertBillItemSchema>;
export type BillItem = typeof billItems.$inferSelect;

export type InsertInventoryTransaction = z.infer<typeof insertInventoryTransactionSchema>;
export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

export type InsertInvoiceTemplate = z.infer<typeof insertInvoiceTemplateSchema>;
export type InvoiceTemplate = typeof invoiceTemplates.$inferSelect;

// We would add relation definitions here
// For now, let's remove the relations to fix the build errors
// and implement them later if needed

// Extended types
export type BillWithCustomer = Bill & {
  customer: Customer | null;
};

export type BillWithItems = Bill & {
  items: (BillItem & { product: Product })[];
  customer: Customer | null;
  store: Store | null;
  user: User | null;
};
