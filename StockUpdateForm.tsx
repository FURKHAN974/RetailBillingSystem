import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the stock update form schema
const formSchema = z.object({
  productId: z.number(),
  quantity: z.coerce.number().int().refine(val => val !== 0, {
    message: "Quantity cannot be zero"
  }),
  type: z.enum(["purchase", "sale", "adjustment"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

interface StockUpdateFormProps {
  product: Product;
  onSuccess?: () => void;
}

const StockUpdateForm = ({ product, onSuccess }: StockUpdateFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: product.id,
      quantity: 1,
      type: "purchase",
      reference: "",
      notes: "",
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      return apiRequest("POST", "/api/inventory/transactions", data);
    },
    onSuccess: () => {
      toast({
        title: "Stock updated",
        description: `Stock has been updated for ${product.name}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/low-stock'] });
      form.reset({
        productId: product.id,
        quantity: 1,
        type: "purchase",
        reference: "",
        notes: "",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update stock: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    // If type is sale, make the quantity negative
    if (data.type === "sale") {
      data.quantity = -Math.abs(data.quantity);
    } else if (data.type === "adjustment" && form.getValues("quantity") < 0) {
      // For adjustment, the quantity can be negative or positive based on user input
      data.quantity = form.getValues("quantity");
    } else {
      // For purchase, ensure quantity is positive
      data.quantity = Math.abs(data.quantity);
    }

    setIsSubmitting(true);
    
    try {
      await updateStockMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="mb-4">
          <h3 className="text-md font-medium">Product: {product.name}</h3>
          <p className="text-sm text-gray-500">Current Stock: {product.stock}</p>
        </div>

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transaction Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select transaction type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="purchase">Purchase (Add)</SelectItem>
                  <SelectItem value="sale">Sale (Remove)</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field} 
                  placeholder="Enter quantity" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="reference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reference (Optional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter reference number or name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Add notes for this transaction" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              if (onSuccess) onSuccess();
            }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update Stock'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default StockUpdateForm;
