import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { InvoiceTemplate } from "@shared/schema";
import { Loader2, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Form schema for invoice template
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  isDefault: z.boolean().optional(),
  logoUrl: z.string().nullable().optional(),
  headerHtml: z.string().nullable().optional(),
  footerHtml: z.string().nullable().optional(),
  styles: z.object({
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    headerTextColor: z.string().optional(),
    bodyTextColor: z.string().optional(),
    footerTextColor: z.string().optional(),
    borderColor: z.string().optional(),
    fontFamily: z.string().optional(),
    fontSize: z.string().optional(),
    borderStyle: z.string().optional(),
    borderWidth: z.string().optional(),
    borderRadius: z.string().optional(),
  }).optional(),
});

type StyleOptions = {
  primaryColor?: string;
  secondaryColor?: string;
  headerTextColor?: string;
  bodyTextColor?: string;
  footerTextColor?: string;
  borderColor?: string;
  fontFamily?: string;
  fontSize?: string;
  borderStyle?: string;
  borderWidth?: string;
  borderRadius?: string;
};

type FormValues = z.infer<typeof formSchema>;

interface InvoiceTemplateFormProps {
  template?: InvoiceTemplate;
  onSuccess?: () => void;
  isSubmitting?: boolean;
  onSubmit: (data: FormValues) => void;
}

export function InvoiceTemplateForm({
  template,
  onSubmit,
  isSubmitting = false,
}: InvoiceTemplateFormProps) {
  // Default values for the form
  const existingStyles: StyleOptions = template?.styles 
    ? template.styles as StyleOptions 
    : {};

  const defaultValues: FormValues = {
    name: template?.name || "",
    isDefault: template?.isDefault || false,
    logoUrl: template?.logoUrl || "",
    headerHtml: template?.headerHtml || "<h1>Invoice</h1><p>Receipt</p>",
    footerHtml: template?.footerHtml || "<p>Thank you for your business!</p>",
    styles: {
      primaryColor: existingStyles.primaryColor || "#f3f4f6",
      secondaryColor: existingStyles.secondaryColor || "#ffffff",
      headerTextColor: existingStyles.headerTextColor || "#000000",
      bodyTextColor: existingStyles.bodyTextColor || "#374151",
      footerTextColor: existingStyles.footerTextColor || "#6b7280",
      borderColor: existingStyles.borderColor || "#e5e7eb",
      fontFamily: existingStyles.fontFamily || "system-ui, sans-serif",
      fontSize: existingStyles.fontSize || "16px",
      borderStyle: existingStyles.borderStyle || "solid",
      borderWidth: existingStyles.borderWidth || "1px",
      borderRadius: existingStyles.borderRadius || "0.375rem",
    },
  };

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Submit handler
  const handleSubmit = (values: FormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs defaultValue="general">
          <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter template name" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for this invoice template.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/logo.png"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    URL to your company logo. Recommended size is 200x60px.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Default Template</FormLabel>
                    <FormDescription>
                      Make this the default template for all new invoices.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="styles.primaryColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Color</FormLabel>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        className="w-12 h-8 p-1"
                        {...field}
                      />
                      <Input {...field} />
                    </div>
                    <FormDescription>
                      Used for headings and table headers.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="styles.secondaryColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secondary Color</FormLabel>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        className="w-12 h-8 p-1"
                        {...field}
                      />
                      <Input {...field} />
                    </div>
                    <FormDescription>
                      Used for backgrounds and accents.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="styles.headerTextColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Header Text Color</FormLabel>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        className="w-12 h-8 p-1"
                        {...field}
                      />
                      <Input {...field} />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="styles.bodyTextColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Body Text Color</FormLabel>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        className="w-12 h-8 p-1"
                        {...field}
                      />
                      <Input {...field} />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="styles.footerTextColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Footer Text Color</FormLabel>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        className="w-12 h-8 p-1"
                        {...field}
                      />
                      <Input {...field} />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="styles.borderColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Border Color</FormLabel>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        className="w-12 h-8 p-1"
                        {...field}
                      />
                      <Input {...field} />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="styles.fontFamily"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Font Family</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="system-ui, sans-serif"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="styles.fontSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Font Size</FormLabel>
                    <FormControl>
                      <Input placeholder="16px" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="styles.borderStyle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Border Style</FormLabel>
                    <FormControl>
                      <Input placeholder="solid" {...field} />
                    </FormControl>
                    <FormDescription>
                      solid, dashed, dotted, etc.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="styles.borderWidth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Border Width</FormLabel>
                    <FormControl>
                      <Input placeholder="1px" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="styles.borderRadius"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Border Radius</FormLabel>
                    <FormControl>
                      <Input placeholder="0.375rem" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4">
            <FormField
              control={form.control}
              name="headerHtml"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Header HTML</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="<h1>Your Company</h1><p>Invoice</p>"
                      className="min-h-32 font-mono"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    HTML for the invoice header. You can include your company
                    name and tagline.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="footerHtml"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Footer HTML</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="<p>Thank you for your business!</p>"
                      className="min-h-32 font-mono"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    HTML for the invoice footer. You can include your company
                    contact details and terms.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Template
          </Button>
        </div>
      </form>
    </Form>
  );
}