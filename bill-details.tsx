import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { BillWithItems } from "@shared/schema";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import BillPrint from "@/components/billing/BillPrint";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const BillDetails = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const { toast } = useToast();

  const billId = parseInt(id);

  const { data: bill, isLoading } = useQuery<BillWithItems>({
    queryKey: [`/api/bills/${billId}`],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      return apiRequest("PUT", `/api/bills/${id}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "The bill status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/bills/${billId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/bills'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bills/recent'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutateAsync({ id: billId, status });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center mb-2">
            <Skeleton className="h-9 w-24 mr-2" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!bill) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-bold mb-2">Bill Not Found</h2>
          <p className="text-gray-500 mb-4">The bill you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/billing")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bills
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                className="mr-2"
                onClick={() => navigate("/billing")}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <CardTitle>Bill Details</CardTitle>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline"
                onClick={() => setIsPrintDialogOpen(true)}
              >
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <CardDescription>Invoice #{bill.billNumber}</CardDescription>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Status:</span>
              {getStatusBadge(bill.status)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Bill Information</h3>
              <div className="border rounded-md p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{formatDate(bill.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="font-medium">₹{Number(bill.total).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <div>
                      <select 
                        className="text-sm border rounded px-2 py-1 w-full"
                        value={bill.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        disabled={updateStatusMutation.isPending}
                      >
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Customer Information</h3>
              <div className="border rounded-md p-4">
                {bill.customer ? (
                  <>
                    <p className="font-medium">{bill.customer.name}</p>
                    {bill.customer.email && <p className="text-gray-600">{bill.customer.email}</p>}
                    {bill.customer.phone && <p className="text-gray-600">{bill.customer.phone}</p>}
                    {bill.customer.address && <p className="text-gray-600">{bill.customer.address}</p>}
                  </>
                ) : (
                  <p className="text-gray-500">Walk-in Customer</p>
                )}
              </div>
            </div>
          </div>

          <h3 className="text-sm font-medium text-gray-500 mb-1">Items</h3>
          <div className="border rounded-md overflow-hidden mb-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bill.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      ₹{Number(item.price).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-right">
                      ₹{Number(item.total).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between text-sm py-2">
                <span className="text-gray-500">Subtotal:</span>
                <span className="font-medium">₹{Number(bill.subtotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm py-2">
                <span className="text-gray-500">Tax (18%):</span>
                <span className="font-medium">₹{Number(bill.tax).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm py-2">
                <span className="text-gray-500">Discount:</span>
                <span className="font-medium">₹{Number(bill.discount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-t text-lg font-bold">
                <span>Total:</span>
                <span>₹{Number(bill.total).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {bill.notes && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Notes</h3>
              <div className="border rounded-md p-4">
                <p className="text-gray-700">{bill.notes}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent className="max-w-3xl">
          <BillPrint billId={billId} onClose={() => setIsPrintDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BillDetails;
