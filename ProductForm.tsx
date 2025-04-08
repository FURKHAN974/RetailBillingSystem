import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { insertProductSchema } from "@shared/schema";
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
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCw, Barcode } from "lucide-react";
import { generateBarcodeDataURL, generateBarcodeValue } from "@/lib/barcodeUtils";

// Extend the insert schema with additional validation
const formSchema = insertProductSchema.extend({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  sku: z.string().min(3, "SKU must be at least 3 characters"),
  barcode: z.string().optional(),
  price: z.coerce.number().positive("Price must be positive"),
  cost: z.coerce.number().positive("Cost must be positive"),
  stock: z.coerce.number().nonnegative("Stock cannot be negative"),
  minStockLevel: z.coerce.number().nonnegative("Minimum stock level cannot be negative"),
});

interface ProductFormProps {
  productId?: number;
  defaultValues?: z.infer<typeof formSchema>;
  onSuccess?: () => void;
}

const ProductForm = ({ productId, defaultValues, onSuccess }: ProductFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [barcodeImage, setBarcodeImage] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditing = !!productId;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      name: "",
      sku: "",
      barcode: "",
      description: "",
      price: 0,
      cost: 0,
      stock: 0,
      minStockLevel: 5,
      category: "",
    },
  });

  // Watch for changes to the SKU field to update barcode preview
  const sku = form.watch("sku");
  const existingBarcode = form.watch("barcode");

  // Generate or update barcode when SKU changes
  useEffect(() => {
    if (sku && !isEditing) {
      generateBarcode();
    }
  }, [sku]);

  // Display barcode on load if editing a product with an existing barcode
  useEffect(() => {
    if (isEditing && existingBarcode) {
      try {
        const image = generateBarcodeDataURL(existingBarcode);
        setBarcodeImage(image);
      } catch (error) {
        console.error("Failed to display existing barcode:", error);
      }
    }
  }, [isEditing, existingBarcode]);

  const generateBarcode = () => {
    if (!sku) {
      toast({
        title: "SKU Required",
        description: "Please enter a SKU to generate a barcode",
        variant: "destructive",
      });
      return;
    }

    try {
      // Generate a barcode value based on SKU and store ID
      const barcodeValue = generateBarcodeValue(sku, user?.storeId);
      
      // Update the form field
      form.setValue("barcode", barcodeValue);
      
      // Generate barcode image
      const image = generateBarcodeDataURL(barcodeValue);
      setBarcodeImage(image);
      
      toast({
        title: "Barcode Generated",
        description: "A new barcode has been generated for this product",
      });
    } catch (error) {
      console.error("Failed to generate barcode:", error);
      toast({
        title: "Error",
        description: "Failed to generate barcode",
        variant: "destructive",
      });
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      return apiRequest("POST", "/api/products", data);
    },
    onSuccess: () => {
      toast({
        title: "Product created",
        description: "The product has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      form.reset();
      setBarcodeImage(null);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create product: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      return apiRequest("PUT", `/api/products/${productId}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Product updated",
        description: "The product has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update product: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      // Ensure barcode is set if it wasn't generated
      if (!data.barcode && sku) {
        data.barcode = generateBarcodeValue(sku, user?.storeId);
      }
      
      if (isEditing) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name*</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter product name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU*</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter SKU" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Barcode section */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <FormLabel>Product Barcode</FormLabel>
            <Button 
              variant="outline" 
              size="sm" 
              type="button"
              onClick={generateBarcode}
              className="flex items-center"
            >
              <RotateCw className="w-4 h-4 mr-1" />
              {isEditing ? "Regenerate Barcode" : "Generate Barcode"}
            </Button>
          </div>
          
          <FormField
            control={form.control}
            name="barcode"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="Barcode will be generated automatically" readOnly />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Barcode display */}
          {barcodeImage && (
            <Card className="mt-2">
              <CardHeader className="py-2">
                <CardTitle className="text-sm flex items-center">
                  <Barcode className="w-4 h-4 mr-1" />
                  Barcode Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 flex justify-center">
                <img 
                  src={barcodeImage} 
                  alt="Product Barcode" 
                  className="max-w-full h-auto"
                />
              </CardContent>
            </Card>
          )}
        </div>
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Enter product description" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price*</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    {...field} 
                    placeholder="0.00" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost*</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    {...field} 
                    placeholder="0.00" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter category" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Quantity*</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0"
                    {...field} 
                    placeholder="0" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="minStockLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min Stock Level</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0"
                    {...field} 
                    placeholder="5" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              form.reset();
              setBarcodeImage(null);
              if (onSuccess) onSuccess();
            }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProductForm;
