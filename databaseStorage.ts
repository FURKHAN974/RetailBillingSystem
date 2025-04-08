import { db } from './db';
import { 
  users, products, customers, bills, billItems, 
  inventoryTransactions, activityLogs, stores, invoiceTemplates,
  type User, type InsertUser, 
  type Product, type InsertProduct,
  type Customer, type InsertCustomer,
  type Bill, type InsertBill,
  type BillItem, type InsertBillItem,
  type InventoryTransaction, type InsertInventoryTransaction,
  type ActivityLog, type InsertActivityLog,
  type BillWithCustomer, type BillWithItems,
  type Store, type InsertStore,
  type InvoiceTemplate, type InsertInvoiceTemplate
} from "@shared/schema";
import { eq, desc, and, gte, sql, count } from 'drizzle-orm';
import { IStorage } from './storage';

export class DatabaseStorage implements IStorage {
  // Store operations
  async getStore(id: number): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.id, id));
    return store || undefined;
  }

  async getStoreByCode(code: string): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.code, code));
    return store || undefined;
  }

  async createStore(insertStore: InsertStore): Promise<Store> {
    const [store] = await db
      .insert(stores)
      .values(insertStore)
      .returning();
    return store;
  }

  async updateStore(id: number, store: Partial<InsertStore>): Promise<Store | undefined> {
    const [updatedStore] = await db
      .update(stores)
      .set({ ...store, updatedAt: new Date() })
      .where(eq(stores.id, id))
      .returning();
    return updatedStore || undefined;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByUsernameAndStoreId(username: string, storeId: number): Promise<User | undefined> {
    const [user] = await db.select()
      .from(users)
      .where(
        and(
          eq(users.username, username),
          eq(users.storeId, storeId)
        )
      );
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getProducts(): Promise<Product[]> {
    return db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProductBySku(sku: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.sku, sku));
    return product || undefined;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(insertProduct)
      .returning();
    return product;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct || undefined;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db
      .delete(products)
      .where(eq(products.id, id));
    return true;
  }

  async getLowStockProducts(limit: number = 10): Promise<Product[]> {
    return db
      .select()
      .from(products)
      .where(sql`${products.stock} < ${products.minStockLevel}`)
      .limit(limit);
  }

  async getTopSellingProducts(limit: number = 10): Promise<{ product: Product, unitsSold: number }[]> {
    const result = await db.execute(sql`
      SELECT p.*, COALESCE(SUM(bi.quantity), 0) as units_sold
      FROM products p
      LEFT JOIN bill_items bi ON p.id = bi.product_id
      LEFT JOIN bills b ON bi.bill_id = b.id AND b.status = 'paid'
      GROUP BY p.id
      ORDER BY units_sold DESC
      LIMIT ${limit}
    `);
    
    const rows = result as unknown as any[];
    
    if (!rows || rows.length === 0) {
      return [];
    }
    
    return rows.map((row: any) => ({
      product: {
        id: row.id,
        name: row.name,
        description: row.description,
        price: row.price,
        cost: row.cost,
        category: row.category,
        sku: row.sku,
        barcode: row.barcode,
        stock: row.stock,
        minStockLevel: row.min_stock_level,
        storeId: row.store_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      },
      unitsSold: Number(row.units_sold || 0)
    }));
  }

  async getCustomers(): Promise<Customer[]> {
    return db.select().from(customers);
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db
      .insert(customers)
      .values(insertCustomer)
      .returning();
    return customer;
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updatedCustomer] = await db
      .update(customers)
      .set({ ...customer, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer || undefined;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    await db
      .delete(customers)
      .where(eq(customers.id, id));
    return true;
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    const searchQuery = `%${query}%`;
    return db
      .select()
      .from(customers)
      .where(sql`${customers.name} ILIKE ${searchQuery} OR ${customers.email} ILIKE ${searchQuery} OR ${customers.phone} ILIKE ${searchQuery}`);
  }

  async getBills(): Promise<BillWithCustomer[]> {
    const result = await db
      .select({
        bill: bills,
        customer: customers
      })
      .from(bills)
      .leftJoin(customers, eq(bills.customerId, customers.id))
      .orderBy(desc(bills.createdAt));

    return result.map(row => ({
      ...row.bill,
      customer: row.customer || null
    }));
  }

  async getBill(id: number): Promise<BillWithItems | undefined> {
    const [billRow] = await db
      .select({
        bill: bills,
        customer: customers,
        store: stores,
        user: users
      })
      .from(bills)
      .leftJoin(customers, eq(bills.customerId, customers.id))
      .leftJoin(stores, eq(bills.storeId, stores.id))
      .leftJoin(users, eq(bills.userId, users.id))
      .where(eq(bills.id, id));

    if (!billRow) return undefined;

    const bill = billRow.bill;
    const customer = billRow.customer;
    const store = billRow.store;
    const user = billRow.user;

    const billItemsWithProducts = await db
      .select({
        billItem: billItems,
        product: products
      })
      .from(billItems)
      .innerJoin(products, eq(billItems.productId, products.id))
      .where(eq(billItems.billId, id));

    const items = billItemsWithProducts.map(row => ({
      ...row.billItem,
      product: row.product
    }));

    return {
      ...bill,
      items,
      customer: customer || null,
      store: store || null,
      user: user || null
    };
  }

  async getBillByNumber(billNumber: string): Promise<BillWithItems | undefined> {
    const [billRow] = await db
      .select({
        bill: bills,
        customer: customers,
        store: stores,
        user: users
      })
      .from(bills)
      .leftJoin(customers, eq(bills.customerId, customers.id))
      .leftJoin(stores, eq(bills.storeId, stores.id))
      .leftJoin(users, eq(bills.userId, users.id))
      .where(eq(bills.billNumber, billNumber));

    if (!billRow) return undefined;

    const bill = billRow.bill;
    const customer = billRow.customer;
    const store = billRow.store;
    const user = billRow.user;

    const billItemsWithProducts = await db
      .select({
        billItem: billItems,
        product: products
      })
      .from(billItems)
      .innerJoin(products, eq(billItems.productId, products.id))
      .where(eq(billItems.billId, bill.id));

    const items = billItemsWithProducts.map(row => ({
      ...row.billItem,
      product: row.product
    }));

    return {
      ...bill,
      items,
      customer: customer || null,
      store: store || null,
      user: user || null
    };
  }

  async createBill(insertBill: InsertBill, insertItems: InsertBillItem[]): Promise<Bill> {
    // Using a transaction to ensure all operations are completed or none
    return db.transaction(async (tx) => {
      // Create the bill
      const [bill] = await tx
        .insert(bills)
        .values(insertBill)
        .returning();

      // Create all bill items
      if (insertItems.length > 0) {
        const billItemsWithBillId = insertItems.map(item => ({
          ...item,
          billId: bill.id
        }));

        await tx
          .insert(billItems)
          .values(billItemsWithBillId);

        // Update product stock for each item
        for (const item of insertItems) {
          await tx
            .update(products)
            .set({ 
              stock: sql`${products.stock} - ${item.quantity}`,
              updatedAt: new Date()
            })
            .where(eq(products.id, item.productId));

          // Create inventory transaction for each item
          await tx
            .insert(inventoryTransactions)
            .values({
              productId: item.productId,
              quantity: -item.quantity,
              type: 'sale',
              reference: bill.billNumber,
              notes: `Sold in bill #${bill.billNumber}`
            });
        }
      }

      // Create activity log for the bill
      await tx
        .insert(activityLogs)
        .values({
          action: 'Bill created',
          entityType: 'bill',
          entityId: bill.id,
          details: `Bill #${bill.billNumber} created with ${insertItems.length} items`
        });

      return bill;
    });
  }

  async updateBillStatus(id: number, status: string): Promise<Bill | undefined> {
    const [updatedBill] = await db
      .update(bills)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(bills.id, id))
      .returning();

    // Create activity log for status update
    if (updatedBill) {
      await db
        .insert(activityLogs)
        .values({
          action: 'Bill status updated',
          entityType: 'bill',
          entityId: id,
          details: `Bill #${updatedBill.billNumber} status changed to ${status}`
        });
    }

    return updatedBill || undefined;
  }

  async getRecentBills(limit: number = 5): Promise<BillWithCustomer[]> {
    const result = await db
      .select({
        bill: bills,
        customer: customers
      })
      .from(bills)
      .leftJoin(customers, eq(bills.customerId, customers.id))
      .orderBy(desc(bills.createdAt))
      .limit(limit);

    return result.map(row => ({
      ...row.bill,
      customer: row.customer || null
    }));
  }

  async getDailySalesTotal(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // We're handling text-based total values, so we need to cast to numeric before summing
    const [result] = await db
      .select({
        total: sql<string>`COALESCE(SUM(CAST(${bills.total} AS numeric)), 0)`.as('total_sales')
      })
      .from(bills)
      .where(
        and(
          eq(bills.status, 'paid'),
          gte(bills.createdAt, today)
        )
      );

    return Number(result.total) || 0;
  }

  async getNewOrdersCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [result] = await db
      .select({
        count: count()
      })
      .from(bills)
      .where(gte(bills.createdAt, today));

    return Number(result.count) || 0;
  }

  async createInventoryTransaction(insertTransaction: InsertInventoryTransaction): Promise<InventoryTransaction> {
    const [transaction] = await db
      .insert(inventoryTransactions)
      .values(insertTransaction)
      .returning();
    
    // Create activity log for inventory transaction
    await db
      .insert(activityLogs)
      .values({
        action: 'Inventory transaction',
        entityType: 'inventory',
        entityId: transaction.productId,
        details: `${transaction.type} of ${transaction.quantity} units, ref: ${transaction.reference || 'N/A'}`
      });

    return transaction;
  }

  async getInventoryTransactions(productId?: number): Promise<InventoryTransaction[]> {
    if (productId) {
      return db
        .select()
        .from(inventoryTransactions)
        .where(eq(inventoryTransactions.productId, productId))
        .orderBy(desc(inventoryTransactions.createdAt));
    }
    
    return db
      .select()
      .from(inventoryTransactions)
      .orderBy(desc(inventoryTransactions.createdAt));
  }

  async updateProductStock(productId: number, quantity: number): Promise<Product | undefined> {
    return db.transaction(async (tx) => {
      // Update product stock
      const [updatedProduct] = await tx
        .update(products)
        .set({ 
          stock: sql`${products.stock} + ${quantity}`,
          updatedAt: new Date()
        })
        .where(eq(products.id, productId))
        .returning();

      if (updatedProduct) {
        // Create inventory transaction
        const type = quantity > 0 ? 'purchase' : 'adjustment';
        
        await tx
          .insert(inventoryTransactions)
          .values({
            productId,
            quantity,
            type,
            notes: `Manual ${type} of ${Math.abs(quantity)} units`
          });

        // Create activity log
        await tx
          .insert(activityLogs)
          .values({
            action: 'Product stock updated',
            entityType: 'product',
            entityId: productId,
            details: `Stock ${quantity > 0 ? 'increased' : 'decreased'} by ${Math.abs(quantity)} units`
          });
      }

      return updatedProduct;
    });
  }

  async getActivityLogs(limit: number = 10): Promise<ActivityLog[]> {
    return db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const [log] = await db
      .insert(activityLogs)
      .values(insertLog)
      .returning();
    return log;
  }

  // Invoice Template operations
  async getInvoiceTemplates(storeId: number): Promise<InvoiceTemplate[]> {
    return db
      .select()
      .from(invoiceTemplates)
      .where(eq(invoiceTemplates.storeId, storeId))
      .orderBy(desc(invoiceTemplates.updatedAt));
  }

  async getInvoiceTemplate(id: number): Promise<InvoiceTemplate | undefined> {
    const [template] = await db
      .select()
      .from(invoiceTemplates)
      .where(eq(invoiceTemplates.id, id));
    return template || undefined;
  }

  async getDefaultInvoiceTemplate(storeId: number): Promise<InvoiceTemplate | undefined> {
    const [template] = await db
      .select()
      .from(invoiceTemplates)
      .where(
        and(
          eq(invoiceTemplates.storeId, storeId),
          eq(invoiceTemplates.isDefault, true)
        )
      );
    return template || undefined;
  }

  async createInvoiceTemplate(insertTemplate: InsertInvoiceTemplate): Promise<InvoiceTemplate> {
    return db.transaction(async (tx) => {
      // If this is the default template, unset any existing default for this store
      if (insertTemplate.isDefault) {
        await tx
          .update(invoiceTemplates)
          .set({ isDefault: false })
          .where(
            and(
              eq(invoiceTemplates.storeId, insertTemplate.storeId),
              eq(invoiceTemplates.isDefault, true)
            )
          );
      }

      // Create the new template
      const [template] = await tx
        .insert(invoiceTemplates)
        .values(insertTemplate)
        .returning();

      // Create activity log
      await tx
        .insert(activityLogs)
        .values({
          action: 'Invoice template created',
          entityType: 'invoice_template',
          entityId: template.id,
          details: `Template "${template.name}" created`,
          storeId: template.storeId
        });

      return template;
    });
  }

  async updateInvoiceTemplate(id: number, template: Partial<InsertInvoiceTemplate>): Promise<InvoiceTemplate | undefined> {
    return db.transaction(async (tx) => {
      // Get the current template to check store ID
      const [currentTemplate] = await tx
        .select()
        .from(invoiceTemplates)
        .where(eq(invoiceTemplates.id, id));

      if (!currentTemplate) return undefined;

      // If setting this as default, unset any existing default for this store
      if (template.isDefault) {
        await tx
          .update(invoiceTemplates)
          .set({ isDefault: false })
          .where(
            and(
              eq(invoiceTemplates.storeId, currentTemplate.storeId),
              eq(invoiceTemplates.isDefault, true),
              sql`${invoiceTemplates.id} != ${id}`
            )
          );
      }

      // Update the template
      const [updatedTemplate] = await tx
        .update(invoiceTemplates)
        .set({ 
          ...template, 
          updatedAt: new Date() 
        })
        .where(eq(invoiceTemplates.id, id))
        .returning();

      // Create activity log
      if (updatedTemplate) {
        await tx
          .insert(activityLogs)
          .values({
            action: 'Invoice template updated',
            entityType: 'invoice_template',
            entityId: id,
            details: `Template "${updatedTemplate.name}" updated`,
            storeId: updatedTemplate.storeId
          });
      }

      return updatedTemplate || undefined;
    });
  }

  async deleteInvoiceTemplate(id: number): Promise<boolean> {
    return db.transaction(async (tx) => {
      // Get the template to check if it's the default one
      const [template] = await tx
        .select()
        .from(invoiceTemplates)
        .where(eq(invoiceTemplates.id, id));

      if (!template) return false;

      // Delete the template
      await tx
        .delete(invoiceTemplates)
        .where(eq(invoiceTemplates.id, id));

      // Create activity log
      await tx
        .insert(activityLogs)
        .values({
          action: 'Invoice template deleted',
          entityType: 'invoice_template',
          entityId: id,
          details: `Template "${template.name}" deleted`,
          storeId: template.storeId
        });

      return true;
    });
  }

  async setDefaultInvoiceTemplate(id: number, storeId: number): Promise<InvoiceTemplate | undefined> {
    return db.transaction(async (tx) => {
      // Unset any existing default for this store
      await tx
        .update(invoiceTemplates)
        .set({ isDefault: false })
        .where(
          and(
            eq(invoiceTemplates.storeId, storeId),
            eq(invoiceTemplates.isDefault, true)
          )
        );

      // Set the new default
      const [template] = await tx
        .update(invoiceTemplates)
        .set({ 
          isDefault: true,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(invoiceTemplates.id, id),
            eq(invoiceTemplates.storeId, storeId)
          )
        )
        .returning();

      // Create activity log
      if (template) {
        await tx
          .insert(activityLogs)
          .values({
            action: 'Invoice template set as default',
            entityType: 'invoice_template',
            entityId: id,
            details: `Template "${template.name}" set as default`,
            storeId
          });
      }

      return template || undefined;
    });
  }
}