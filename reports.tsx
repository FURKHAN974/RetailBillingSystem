import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SalesReport from "@/components/reports/SalesReport";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, LineChart, PieChart } from "lucide-react";

const Reports = () => {
  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Reports</CardTitle>
          <CardDescription>View sales and inventory analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sales">
            <TabsList className="mb-4">
              <TabsTrigger value="sales">
                <BarChart3 className="h-4 w-4 mr-2" />
                Sales
              </TabsTrigger>
              <TabsTrigger value="inventory" disabled>
                <PieChart className="h-4 w-4 mr-2" />
                Inventory
              </TabsTrigger>
              <TabsTrigger value="customers" disabled>
                <LineChart className="h-4 w-4 mr-2" />
                Customers
              </TabsTrigger>
            </TabsList>
            <TabsContent value="sales">
              <SalesReport />
            </TabsContent>
            <TabsContent value="inventory">
              <div className="py-12 text-center text-gray-500">
                <p>Inventory reports coming soon</p>
              </div>
            </TabsContent>
            <TabsContent value="customers">
              <div className="py-12 text-center text-gray-500">
                <p>Customer reports coming soon</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
