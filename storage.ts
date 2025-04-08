import { 
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

// Interface for storage operations
export interface IStorage {
  // Store operations
  getStore(id: number): Promise<Store | undefined>;
  getStoreByCode(code: string): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(id: number, store: Partial<InsertStore>): Promise<Store | undefined>;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByUsernameAndStoreId(username: string, storeId: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Product operations
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductBySku(sku: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  getLowStockProducts(limit?: number): Promise<Product[]>;
  getTopSellingProducts(limit?: number): Promise<{ product: Product, unitsSold: number }[]>;

  // Customer operations
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;
  searchCustomers(query: string): Promise<Customer[]>;

  // Bill operations
  getBills(): Promise<BillWithCustomer[]>;
  getBill(id: number): Promise<BillWithItems | undefined>;
  getBillByNumber(billNumber: string): Promise<BillWithItems | undefined>;
  createBill(bill: InsertBill, items: InsertBillItem[]): Promise<Bill>;
  updateBillStatus(id: number, status: string): Promise<Bill | undefined>;
  getRecentBills(limit?: number): Promise<BillWithCustomer[]>;
  getDailySalesTotal(): Promise<number>;
  getNewOrdersCount(): Promise<number>;

  // Inventory operations
  createInventoryTransaction(transaction: InsertInventoryTransaction): Promise<InventoryTransaction>;
  getInventoryTransactions(productId?: number): Promise<InventoryTransaction[]>;
  updateProductStock(productId: number, quantity: number): Promise<Product | undefined>;

  // Activity logs
  getActivityLogs(limit?: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  
  // Invoice Templates
  getInvoiceTemplates(storeId: number): Promise<InvoiceTemplate[]>;
  getInvoiceTemplate(id: number): Promise<InvoiceTemplate | undefined>;
  getDefaultInvoiceTemplate(storeId: number): Promise<InvoiceTemplate | undefined>;
  createInvoiceTemplate(template: InsertInvoiceTemplate): Promise<InvoiceTemplate>;
  updateInvoiceTemplate(id: number, template: Partial<InsertInvoiceTemplate>): Promise<InvoiceTemplate | undefined>;
  deleteInvoiceTemplate(id: number): Promise<boolean>;
  setDefaultInvoiceTemplate(id: number, storeId: number): Promise<InvoiceTemplate | undefined>;
}

// MemStorage implementation can be used for development without a database
// Excluded for brevity, since we are using DatabaseStorage

// Use DatabaseStorage for production with PostgreSQL
import { DatabaseStorage } from './databaseStorage';
export const storage = new DatabaseStorage();
