import { useState } from "react";
import { useInvoiceTemplates } from "@/hooks/use-invoice-templates";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InvoiceTemplateForm } from "./InvoiceTemplateForm";
import { Loader2, Edit, MoreVertical, Star, Trash, Plus } from "lucide-react";
import { InvoiceTemplate } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

export function InvoiceTemplateList() {
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const {
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
  } = useInvoiceTemplates();

  const handleEdit = (template: InvoiceTemplate) => {
    setSelectedTemplate(template);
    setIsEditOpen(true);
  };

  const handleDelete = (template: InvoiceTemplate) => {
    setSelectedTemplate(template);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTemplate) {
      deleteTemplate(selectedTemplate.id);
      setIsDeleteConfirmOpen(false);
      setSelectedTemplate(null);
    }
  };

  const handleSetDefault = (template: InvoiceTemplate) => {
    if (!template.isDefault) {
      setDefaultTemplate(template.id);
    }
  };

  const handleCreate = (data: any) => {
    createTemplate(data);
    setIsCreateOpen(false);
  };

  const handleUpdate = (data: any) => {
    if (selectedTemplate) {
      updateTemplate({ id: selectedTemplate.id, data });
      setIsEditOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Invoice Templates</h2>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground mb-4">No invoice templates found</p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create your first template
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="relative">
              {template.isDefault && (
                <Badge className="absolute right-2 top-2 bg-primary">Default</Badge>
              )}
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="flex items-center">
                    {template.name}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleEdit(template)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      {!template.isDefault && (
                        <DropdownMenuItem onClick={() => handleSetDefault(template)}>
                          <Star className="mr-2 h-4 w-4" />
                          Set as Default
                        </DropdownMenuItem>
                      )}
                      {!template.isDefault && (
                        <DropdownMenuItem 
                          onClick={() => handleDelete(template)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription>
                  {template.updatedAt
                    ? `Updated ${new Date(template.updatedAt).toLocaleDateString()}`
                    : `Created ${new Date(template.createdAt).toLocaleDateString()}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-40 overflow-hidden border rounded-md p-3">
                  {template.logoUrl && (
                    <img
                      src={template.logoUrl}
                      alt="Template logo"
                      className="max-h-10 mb-2"
                    />
                  )}
                  <div
                    style={{
                      color: template.styles ? (template.styles as any).headerTextColor : "inherit",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: template.headerHtml || "<h3>Sample Invoice</h3>",
                    }}
                  />
                  {/* Sample content preview */}
                  <div
                    className="mt-2 text-xs"
                    style={{
                      color: template.styles ? (template.styles as any).bodyTextColor : "inherit",
                    }}
                  >
                    <p>Sample invoice content...</p>
                  </div>
                  <div
                    className="mt-2 text-xs"
                    style={{
                      color: template.styles ? (template.styles as any).footerTextColor : "inherit",
                      borderTop: template.styles ? `1px solid ${(template.styles as any).borderColor || "#e5e7eb"}` : "1px solid #e5e7eb",
                      paddingTop: "0.5rem",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: template.footerHtml || "<p>Thank you for your business!</p>",
                    }}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                  Edit
                </Button>
                {!template.isDefault && (
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => handleSetDefault(template)}
                    disabled={isSettingDefault}
                  >
                    {isSettingDefault && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                    Set as Default
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create Template Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Invoice Template</DialogTitle>
            <DialogDescription>
              Create a new invoice template with your branding and styling.
            </DialogDescription>
          </DialogHeader>
          <InvoiceTemplateForm 
            onSubmit={handleCreate} 
            isSubmitting={isCreating} 
          />
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Invoice Template</DialogTitle>
            <DialogDescription>
              Update your invoice template with your branding and styling.
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <InvoiceTemplateForm 
              template={selectedTemplate}
              onSubmit={handleUpdate} 
              isSubmitting={isUpdating} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the template "{selectedTemplate?.name}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}