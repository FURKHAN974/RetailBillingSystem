import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { InvoiceTemplate } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export function useInvoiceTemplates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const storeId = user?.storeId;

  const { data: templates = [], isLoading } = useQuery<InvoiceTemplate[]>({
    queryKey: ["/api/invoice-templates"],
    enabled: !!storeId,
  });

  const { mutate: createTemplate, isPending: isCreating } = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/invoice-templates", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/invoice-templates"],
      });
      toast({
        title: "Template created",
        description: "Your new invoice template has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { mutate: updateTemplate, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/invoice-templates/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/invoice-templates"],
      });
      toast({
        title: "Template updated",
        description: "Your invoice template has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { mutate: deleteTemplate, isPending: isDeleting } = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/invoice-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/invoice-templates"],
      });
      toast({
        title: "Template deleted",
        description: "Your invoice template has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { mutate: setDefaultTemplate, isPending: isSettingDefault } = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/invoice-templates/${id}/set-default`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/invoice-templates"],
      });
      toast({
        title: "Default template set",
        description: "Your default invoice template has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to set default template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    setDefaultTemplate,
    isCreating,
    isUpdating,
    isDeleting,
    isSettingDefault,
  };
}

export function useInvoiceTemplate(id?: number) {
  const { data: templates = [] } = useQuery<InvoiceTemplate[]>({
    queryKey: ["/api/invoice-templates"],
    enabled: !!id,
  });

  const template = id ? templates.find((t) => t.id === id) : undefined;

  return { template, isLoading: false };
}

export function useDefaultInvoiceTemplate(storeId?: number) {
  const { data: templates = [], isLoading } = useQuery<InvoiceTemplate[]>({
    queryKey: ["/api/invoice-templates"],
    enabled: !!storeId,
  });

  const defaultTemplate = templates.find((t) => t.isDefault && t.storeId === storeId);

  return {
    defaultTemplate,
    isLoading,
  };
}