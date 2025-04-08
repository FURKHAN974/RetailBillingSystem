import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProductSchema, 
  insertCustomerSchema, 
  insertBillSchema, 
  insertBillItemSchema,
  insertInventoryTransactionSchema,
  insertActivityLogSchema,
  insertInvoiceTemplateSchema
} from "@shared/schema";
import { z } from "zod";
import { setupAuth } from "./auth";
import { sendBillSMS } from "./services/sms";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication and route protection
  setupAuth(app);
  
  // All routes are prefixed with /api
  
  // Products routes
  app.get("/api/products", async (req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });
  
  // Important: specialized routes must come before parameterized routes
  app.get("/api/products/low-stock", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const products = await storage.getLowStockProducts(limit);
      res.json(products);
    } catch (error) {
      console.error("Error getting low stock products:", error);
      res.status(500).json({ message: "Failed to get low stock products" });
    }
  });
  
  app.get("/api/products/top-selling", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const products = await storage.getTopSellingProducts(limit);
      res.json(products);
    } catch (error) {
      console.error("Error getting top selling products:", error);
      res.status(500).json({ message: "Failed to get top selling products" });
    }
  });
  
  app.get("/api/products/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    
    const product = await storage.getProduct(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    res.json(product);
  });
  
  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });
  
  app.put("/api/products/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    
    try {
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, productData);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update product" });
    }
  });
  
  app.delete("/api/products/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    
    const deleted = await storage.deleteProduct(id);
    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    res.status(204).end();
  });
  
  
  // Customer routes
  app.get("/api/customers", async (req, res) => {
    if (req.query.search) {
      const customers = await storage.searchCustomers(req.query.search as string);
      return res.json(customers);
    }
    
    const customers = await storage.getCustomers();
    res.json(customers);
  });
  
  app.get("/api/customers/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }
    
    const customer = await storage.getCustomer(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    
    res.json(customer);
  });
  
  app.post("/api/customers", async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create customer" });
    }
  });
  
  app.put("/api/customers/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }
    
    try {
      const customerData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(id, customerData);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update customer" });
    }
  });
  
  app.delete("/api/customers/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }
    
    const deleted = await storage.deleteCustomer(id);
    if (!deleted) {
      return res.status(404).json({ message: "Customer not found" });
    }
    
    res.status(204).end();
  });
  
  // Bill routes
  app.get("/api/bills", async (req, res) => {
    const bills = await storage.getBills();
    res.json(bills);
  });
  
  app.get("/api/bills/recent", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
    const bills = await storage.getRecentBills(limit);
    res.json(bills);
  });
  
  app.get("/api/bills/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid bill ID" });
    }
    
    const bill = await storage.getBill(id);
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }
    
    res.json(bill);
  });
  
  app.get("/api/bills/number/:billNumber", async (req, res) => {
    const billNumber = req.params.billNumber;
    
    const bill = await storage.getBillByNumber(billNumber);
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }
    
    res.json(bill);
  });
  
  app.post("/api/bills", async (req: Request & { user?: any }, res: Response) => {
    try {
      const { bill, items } = req.body;
      
      if (!bill) {
        return res.status(400).json({ message: "Bill data is required" });
      }
      
      console.log("Bill submission request body:", JSON.stringify(req.body));
      
      // Validate bill data
      let billData: any;
      try {
        console.log("Attempting to validate bill data:", JSON.stringify(bill));
        
        // Workaround for the validation: Ensure all required fields are strings
        const billWithValidTypes = {
          ...bill,
          customerId: bill.customerId || null,
          subtotal: String(bill.subtotal || 0),
          tax: String(bill.tax || 0),
          discount: String(bill.discount || 0),
          total: String(bill.total || 0)
        };
        
        console.log("Validation with fixed types:", JSON.stringify(billWithValidTypes));
        billData = insertBillSchema.parse(billWithValidTypes);
        console.log("Validation success:", JSON.stringify(billData));
      } catch (e) {
        if (e instanceof z.ZodError) {
          console.error("Bill validation error details:", JSON.stringify({
            errors: e.errors,
            formShape: e.format(),
            formShapeDetailed: e.format(_s => _s.message)
          }, null, 2));
          return res.status(400).json({ message: "Invalid bill data", errors: e.errors });
        } else {
          console.error("Bill validation error:", e);
          return res.status(400).json({ message: "Invalid bill data" });
        }
      }
      
      // Add user ID and store ID
      if (req.user) {
        console.log("Adding user data to bill:", req.user.id, req.user.storeId);
        billData = {
          ...billData,
          userId: req.user.id,
          storeId: req.user.storeId
        };
      }
      
      // Validate bill items data
      console.log("Processing bill items:", JSON.stringify(items));
      
      // Need to manually create empty items array if items is undefined
      const itemsToProcess = items || [];
      
      let billItemsData;
      try {
        // Ensure that item prices and totals are strings
        const processedItems = itemsToProcess.map((item: any) => ({
          ...item,
          price: String(item.price || 0),
          total: String(item.total || 0),
        }));
        
        console.log("Items with fixed types:", JSON.stringify(processedItems));
        
        // Temporarily remove the billId requirement for validation 
        // (it will be added by storage.createBill)
        const billItemWithoutBillIdSchema = insertBillItemSchema.omit({ billId: true });
        billItemsData = z.array(billItemWithoutBillIdSchema).parse(processedItems);
        console.log("Bill items validation success");
      } catch (e) {
        if (e instanceof z.ZodError) {
          console.error("Bill items validation error:", JSON.stringify(e.errors, null, 2));
          return res.status(400).json({ message: "Invalid bill items data", errors: e.errors });
        } else {
          console.error("Bill items validation error:", e);
          return res.status(400).json({ message: "Invalid bill items data" });
        }
      }
      
      // Create bill and items
      let newBill;
      try {
        console.log("Creating bill with data:", { billData, itemsCount: billItemsData.length });
        newBill = await storage.createBill(billData, billItemsData);
        console.log("Bill created successfully:", newBill.id);
      } catch (e) {
        console.error("Error creating bill:", e);
        return res.status(500).json({ message: "Failed to create bill in database" });
      }
      
      // If a customer is associated with the bill, get full bill with items and send SMS
      if (billData.customerId) {
        try {
          const customer = await storage.getCustomer(billData.customerId);
          const fullBill = await storage.getBill(newBill.id);
          
          if (customer && fullBill && customer.phone) {
            // Send SMS asynchronously - don't wait for it to complete
            sendBillSMS(fullBill, customer)
              .then(result => {
                if (result.success) {
                  console.log(`SMS notification sent to customer ${customer.id} for bill ${newBill.id}`);
                  
                  // Log the activity
                  storage.createActivityLog({
                    action: "SMS_SENT",
                    entityType: "bill",
                    entityId: newBill.id,
                    details: `Bill #${newBill.billNumber} SMS notification sent to ${customer.name} (${customer.phone})`,
                    userId: req.user?.id || null,
                    storeId: newBill.storeId
                  }).catch(err => console.error('Error logging SMS activity:', err));
                } else {
                  console.error(`Failed to send SMS to customer ${customer.id} for bill ${newBill.id}: ${result.errorMessage}`);
                  
                  // Log the SMS failure
                  storage.createActivityLog({
                    action: "SMS_FAILED",
                    entityType: "bill",
                    entityId: newBill.id,
                    details: `Failed to send SMS for bill #${newBill.billNumber} to ${customer.name}: ${result.errorMessage}`,
                    userId: req.user?.id || null,
                    storeId: newBill.storeId
                  }).catch(err => console.error('Error logging SMS failure:', err));
                }
              })
              .catch(err => {
                console.error('Error sending bill SMS:', err);
              });
          }
        } catch (smsError) {
          // Log error but don't fail the bill creation
          console.error('Error preparing SMS notification:', smsError);
        }
      }
      
      res.status(201).json(newBill);
    } catch (error) {
      console.error("Unexpected error in bill creation:", error);
      res.status(500).json({ message: "Failed to create bill" });
    }
  });
  
  app.put("/api/bills/:id/status", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid bill ID" });
    }
    
    const { status } = req.body;
    if (!status || typeof status !== 'string') {
      return res.status(400).json({ message: "Status is required" });
    }
    
    try {
      const bill = await storage.updateBillStatus(id, status);
      
      if (!bill) {
        return res.status(404).json({ message: "Bill not found" });
      }
      
      res.json(bill);
    } catch (error) {
      res.status(500).json({ message: "Failed to update bill status" });
    }
  });
  
  // Dashboard statistics
  app.get("/api/dashboard/stats", async (req, res) => {
    const todaySales = await storage.getDailySalesTotal();
    const newOrders = await storage.getNewOrdersCount();
    const lowStockItems = await storage.getLowStockProducts();
    const totalCustomers = (await storage.getCustomers()).length;
    
    res.json({
      todaySales,
      newOrders,
      inventoryItems: (await storage.getProducts()).length,
      lowStockItemsCount: lowStockItems.length,
      totalCustomers
    });
  });
  
  // Inventory routes
  app.post("/api/inventory/transactions", async (req, res) => {
    try {
      const transactionData = insertInventoryTransactionSchema.parse(req.body);
      
      // Update product stock
      const product = await storage.updateProductStock(
        transactionData.productId,
        transactionData.quantity
      );
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Create inventory transaction record
      const transaction = await storage.createInventoryTransaction(transactionData);
      
      res.status(201).json({ transaction, product });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to process inventory transaction" });
    }
  });
  
  app.get("/api/inventory/transactions", async (req, res) => {
    const productId = req.query.productId 
      ? parseInt(req.query.productId as string, 10) 
      : undefined;
    
    const transactions = await storage.getInventoryTransactions(productId);
    res.json(transactions);
  });
  
  // Activity logs
  app.get("/api/activity-logs", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const logs = await storage.getActivityLogs(limit);
    res.json(logs);
  });

  // Send SMS bill notification
  app.post("/api/bills/:id/send-sms", async (req: Request & { user?: any }, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid bill ID" });
    }
    
    try {
      // Get the full bill with items
      const bill = await storage.getBill(id);
      
      if (!bill) {
        return res.status(404).json({ message: "Bill not found" });
      }
      
      if (!bill.customerId) {
        return res.status(400).json({ message: "Bill has no associated customer" });
      }
      
      // Get the customer
      const customer = await storage.getCustomer(bill.customerId);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      if (!customer.phone) {
        return res.status(400).json({ message: "Customer has no phone number" });
      }
      
      // Send the SMS
      const result = await sendBillSMS(bill, customer);
      
      if (result.success) {
        // Log the activity
        await storage.createActivityLog({
          action: "SMS_SENT",
          entityType: "bill",
          entityId: bill.id,
          details: `Bill #${bill.billNumber} SMS notification sent to ${customer.name} (${customer.phone})`,
          userId: req.user?.id || null,
          storeId: bill.storeId
        });
        
        return res.status(200).json({ message: "SMS notification sent successfully" });
      } else {
        return res.status(500).json({ 
          message: "Failed to send SMS notification", 
          error: result.errorMessage || "Unknown error"
        });
      }
    } catch (error) {
      console.error("Error sending bill SMS:", error);
      return res.status(500).json({ message: "Failed to send SMS notification" });
    }
  });

  // Invoice Template routes
  app.get("/api/invoice-templates", async (req: Request & { user?: any }, res: Response) => {
    try {
      if (!req.user || !req.user.storeId) {
        return res.status(403).json({ message: "Store ID required" });
      }
      
      const templates = await storage.getInvoiceTemplates(req.user.storeId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching invoice templates:", error);
      res.status(500).json({ message: "Failed to fetch invoice templates" });
    }
  });
  
  app.get("/api/invoice-templates/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid template ID" });
    }
    
    try {
      const template = await storage.getInvoiceTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Invoice template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error fetching invoice template:", error);
      res.status(500).json({ message: "Failed to fetch invoice template" });
    }
  });
  
  app.get("/api/invoice-templates/default/:storeId", async (req, res) => {
    const storeId = parseInt(req.params.storeId, 10);
    if (isNaN(storeId)) {
      return res.status(400).json({ message: "Invalid store ID" });
    }
    
    try {
      const template = await storage.getDefaultInvoiceTemplate(storeId);
      if (!template) {
        return res.status(404).json({ message: "Default invoice template not found for this store" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error fetching default invoice template:", error);
      res.status(500).json({ message: "Failed to fetch default invoice template" });
    }
  });
  
  app.post("/api/invoice-templates", async (req: Request & { user?: any }, res: Response) => {
    try {
      if (!req.user || !req.user.storeId) {
        return res.status(403).json({ message: "Authentication required" });
      }
      
      // Ensure the template is associated with the user's store
      const templateData = {
        ...insertInvoiceTemplateSchema.parse(req.body),
        storeId: req.user.storeId
      };
      
      const template = await storage.createInvoiceTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      console.error("Error creating invoice template:", error);
      res.status(500).json({ message: "Failed to create invoice template" });
    }
  });
  
  app.put("/api/invoice-templates/:id", async (req: Request & { user?: any }, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid template ID" });
    }
    
    try {
      // Verify the template belongs to the user's store
      const existingTemplate = await storage.getInvoiceTemplate(id);
      if (!existingTemplate) {
        return res.status(404).json({ message: "Invoice template not found" });
      }
      
      if (existingTemplate.storeId !== req.user?.storeId) {
        return res.status(403).json({ message: "You don't have permission to modify this template" });
      }
      
      const templateData = insertInvoiceTemplateSchema.partial().parse(req.body);
      
      // Don't allow changing the store ID
      delete templateData.storeId;
      
      const template = await storage.updateInvoiceTemplate(id, templateData);
      if (!template) {
        return res.status(404).json({ message: "Invoice template not found" });
      }
      
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      console.error("Error updating invoice template:", error);
      res.status(500).json({ message: "Failed to update invoice template" });
    }
  });
  
  app.delete("/api/invoice-templates/:id", async (req: Request & { user?: any }, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid template ID" });
    }
    
    try {
      // Verify the template belongs to the user's store
      const existingTemplate = await storage.getInvoiceTemplate(id);
      if (!existingTemplate) {
        return res.status(404).json({ message: "Invoice template not found" });
      }
      
      if (existingTemplate.storeId !== req.user?.storeId) {
        return res.status(403).json({ message: "You don't have permission to delete this template" });
      }
      
      // Check if template is the default one
      if (existingTemplate.isDefault) {
        return res.status(400).json({ 
          message: "Cannot delete the default template. Set another template as default first." 
        });
      }
      
      const deleted = await storage.deleteInvoiceTemplate(id);
      if (!deleted) {
        return res.status(404).json({ message: "Invoice template not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting invoice template:", error);
      res.status(500).json({ message: "Failed to delete invoice template" });
    }
  });
  
  app.post("/api/invoice-templates/:id/set-default", async (req: Request & { user?: any }, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid template ID" });
    }
    
    if (!req.user || !req.user.storeId) {
      return res.status(403).json({ message: "Authentication required" });
    }
    
    try {
      // Verify the template belongs to the user's store
      const existingTemplate = await storage.getInvoiceTemplate(id);
      if (!existingTemplate) {
        return res.status(404).json({ message: "Invoice template not found" });
      }
      
      if (existingTemplate.storeId !== req.user.storeId) {
        return res.status(403).json({ message: "You don't have permission to modify this template" });
      }
      
      const template = await storage.setDefaultInvoiceTemplate(id, req.user.storeId);
      if (!template) {
        return res.status(404).json({ message: "Failed to set default template" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error setting default invoice template:", error);
      res.status(500).json({ message: "Failed to set default template" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
