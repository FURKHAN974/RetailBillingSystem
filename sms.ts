import twilio from 'twilio';
import { Bill, BillWithItems, Customer } from '@shared/schema';

// Initialize Twilio client - safely handle missing env variables
let twilioClient: ReturnType<typeof twilio> | null = null;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.log('Twilio client initialized successfully');
  } else {
    console.warn('Twilio client not initialized: Missing account SID or auth token');
  }
} catch (error) {
  console.error('Failed to initialize Twilio client:', error);
}

const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Flag to enable development mode with SMS simulation
const DEV_MODE = true; // Set to false in production

/**
 * Formats a bill into a short message suitable for SMS
 */
function formatBillForSMS(bill: BillWithItems, customer: Customer): string {
  // Format the message
  let message = `Dear ${customer.name},\n\n`;
  message += `Thank you for your purchase at ${bill.store?.name || 'our store'}.\n`;
  message += `Bill #${bill.billNumber} - ${new Date(bill.createdAt).toLocaleDateString()}\n\n`;
  
  // Add items summary (limit to 3 items to keep SMS short)
  const itemsToShow = bill.items.slice(0, 3);
  const remainingItems = bill.items.length - itemsToShow.length;
  
  itemsToShow.forEach(item => {
    // Convert string numbers to actual numbers for calculations
    const totalNumber = parseFloat(item.total.toString());
    message += `${item.product.name} x${item.quantity}: ₹${totalNumber.toFixed(2)}\n`;
  });
  
  if (remainingItems > 0) {
    message += `...and ${remainingItems} more item(s)\n`;
  }
  
  // Add total and payment information - convert string to number for formatting
  const totalAmount = parseFloat(bill.total.toString());
  message += `\nTotal Amount: ₹${totalAmount.toFixed(2)}\n`;
  
  message += `Status: ${bill.status}\n`;
  
  // Add UPI info if available
  if (bill.upiId) {
    message += `\nFor digital payment, use UPI ID: ${bill.upiId}\n`;
  }
  
  // Add footer
  message += `\nThank you for shopping with us!`;
  
  return message;
}

/**
 * Sends a bill notification via SMS to a customer
 * @returns An object with success status and error message if applicable
 */
export async function sendBillSMS(bill: BillWithItems, customer: Customer): Promise<{success: boolean, errorMessage?: string}> {
  try {
    // Check if customer has a phone number
    if (!customer.phone) {
      const errorMessage = `Cannot send SMS: Customer ${customer.id} has no phone number`;
      console.error(errorMessage);
      return {success: false, errorMessage};
    }
    
    // In development mode, simulate successful SMS sending
    if (DEV_MODE) {
      console.log(`[DEV MODE] Simulating SMS to ${customer.phone} for bill #${bill.billNumber}`);
      const message = formatBillForSMS(bill, customer);
      console.log(`Message content: ${message.substring(0, 100)}...`);
      return {success: true};
    }
    
    // Check if Twilio credentials are configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !twilioPhoneNumber) {
      const errorMessage = 'Twilio credentials not properly configured';
      console.error(errorMessage);
      return {success: false, errorMessage};
    }
    
    // Check if Twilio client was initialized successfully
    if (!twilioClient) {
      const errorMessage = 'Twilio client not initialized';
      console.error(errorMessage);
      return {success: false, errorMessage};
    }
    
    // Format the message
    const message = formatBillForSMS(bill, customer);
    
    // Send the SMS
    await twilioClient!.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: customer.phone
    });
    
    console.log(`SMS sent successfully to ${customer.phone} for bill #${bill.billNumber}`);
    return {success: true};
    
  } catch (error: any) {
    const baseError = 'Error sending SMS';
    console.error(baseError, error);
    
    // Parse Twilio specific errors to provide more user-friendly messages
    let userFriendlyMessage = baseError;
    
    if (error.code) {
      switch (error.code) {
        case 21408:
          userFriendlyMessage = `SMS could not be sent: The number ${customer.phone} is in a region not enabled for this Twilio account. Please upgrade your Twilio account or use a number from a supported region.`;
          break;
        case 21211:
          userFriendlyMessage = `SMS could not be sent: ${customer.phone} is not a valid phone number.`;
          break;
        case 21614:
          userFriendlyMessage = 'SMS could not be sent: The phone number is unverified. In trial mode, verify the number first.';
          break;
        default:
          userFriendlyMessage = `SMS could not be sent: ${error.message || 'Unknown error'}`;
      }
    }
    
    return {success: false, errorMessage: userFriendlyMessage};
  }
}

/**
 * Sends a payment confirmation SMS to a customer
 * @returns An object with success status and error message if applicable
 */
export async function sendPaymentConfirmationSMS(bill: Bill, customer: Customer, amount: number): Promise<{success: boolean, errorMessage?: string}> {
  try {
    // Check if customer has a phone number
    if (!customer.phone) {
      const errorMessage = `Cannot send SMS: Customer ${customer.id} has no phone number`;
      console.error(errorMessage);
      return {success: false, errorMessage};
    }
    
    // In development mode, simulate successful SMS sending
    if (DEV_MODE) {
      console.log(`[DEV MODE] Simulating payment confirmation SMS to ${customer.phone} for bill #${bill.billNumber}`);
      return {success: true};
    }
    
    // Check if Twilio credentials are configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !twilioPhoneNumber) {
      const errorMessage = 'Twilio credentials not properly configured';
      console.error(errorMessage);
      return {success: false, errorMessage};
    }
    
    // Check if Twilio client was initialized successfully
    if (!twilioClient) {
      const errorMessage = 'Twilio client not initialized';
      console.error(errorMessage);
      return {success: false, errorMessage};
    }
    
    // Format the message
    const message = `Dear ${customer.name},\n\n` +
      `Thank you for your payment of ₹${amount.toFixed(2)} for bill #${bill.billNumber}.\n\n` +
      `Date: ${new Date().toLocaleDateString()}\n` +
      `Time: ${new Date().toLocaleTimeString()}\n\n` +
      `Thank you for your business!`;
    
    // Send the SMS
    await twilioClient!.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: customer.phone
    });
    
    console.log(`Payment confirmation SMS sent to ${customer.phone} for bill #${bill.billNumber}`);
    return {success: true};
    
  } catch (error: any) {
    const baseError = 'Error sending payment confirmation SMS';
    console.error(baseError, error);
    
    // Parse Twilio specific errors to provide more user-friendly messages
    let userFriendlyMessage = baseError;
    
    if (error.code) {
      switch (error.code) {
        case 21408:
          userFriendlyMessage = `SMS could not be sent: The number ${customer.phone} is in a region not enabled for this Twilio account. Please upgrade your Twilio account or use a number from a supported region.`;
          break;
        case 21211:
          userFriendlyMessage = `SMS could not be sent: ${customer.phone} is not a valid phone number.`;
          break;
        case 21614:
          userFriendlyMessage = 'SMS could not be sent: The phone number is unverified. In trial mode, verify the number first.';
          break;
        default:
          userFriendlyMessage = `SMS could not be sent: ${error.message || 'Unknown error'}`;
      }
    }
    
    return {success: false, errorMessage: userFriendlyMessage};
  }
}