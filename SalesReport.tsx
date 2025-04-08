import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BillWithCustomer } from "@shared/schema";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateRange {
  from: Date;
  to: Date;
}

const SalesReport = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
  });
  const [chartType, setChartType] = useState<"daily" | "monthly">("daily");

  const { data: bills, isLoading } = useQuery<BillWithCustomer[]>({
    queryKey: ['/api/bills'],
  });

  const prepareChartData = () => {
    if (!bills) return [];

    // Filter bills by date range
    const filteredBills = bills.filter(bill => {
      const billDate = new Date(bill.createdAt);
      return (
        billDate >= dateRange.from && 
        billDate <= new Date(dateRange.to.setHours(23, 59, 59))
      );
    });

    if (chartType === "daily") {
      // Group by day
      const salesByDay = filteredBills.reduce((acc, bill) => {
        const date = format(new Date(bill.createdAt), "yyyy-MM-dd");
        if (!acc[date]) {
          acc[date] = {
            date,
            displayDate: format(new Date(bill.createdAt), "dd MMM"),
            sales: 0,
            count: 0,
          };
        }
        
        if (bill.status === "paid") {
          acc[date].sales += Number(bill.total);
          acc[date].count += 1;
        }
        
        return acc;
      }, {} as Record<string, { date: string; displayDate: string; sales: number; count: number }>);

      // Convert to array and sort by date
      return Object.values(salesByDay).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    } else {
      // Group by month
      const salesByMonth = filteredBills.reduce((acc, bill) => {
        const month = format(new Date(bill.createdAt), "yyyy-MM");
        if (!acc[month]) {
          acc[month] = {
            month,
            displayMonth: format(new Date(bill.createdAt), "MMM yyyy"),
            sales: 0,
            count: 0,
          };
        }
        
        if (bill.status === "paid") {
          acc[month].sales += Number(bill.total);
          acc[month].count += 1;
        }
        
        return acc;
      }, {} as Record<string, { month: string; displayMonth: string; sales: number; count: number }>);

      // Convert to array and sort by month
      return Object.values(salesByMonth).sort((a, b) => 
        new Date(a.month).getTime() - new Date(b.month).getTime()
      );
    }
  };

  const chartData = prepareChartData();

  const totalSales = chartData.reduce((sum, item) => sum + item.sales, 0);
  const totalOrders = chartData.reduce((sum, item) => sum + item.count, 0);
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Sales Report</CardTitle>
        <div className="flex space-x-2">
          <Select
            value={chartType}
            onValueChange={(value) => setChartType(value as "daily" | "monthly")}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="View by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal w-[240px]",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateRange.from, "dd MMM yyyy")} - {format(dateRange.to, "dd MMM yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{
                  from: dateRange.from,
                  to: dateRange.to,
                }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">₹{totalSales.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total Sales</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{totalOrders}</div>
              <p className="text-xs text-muted-foreground">Total Orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">₹{averageOrderValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground">Average Order Value</p>
            </CardContent>
          </Card>
        </div>

        <div className="h-[400px]">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              No sales data available for the selected period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey={chartType === "daily" ? "displayDate" : "displayMonth"} 
                  label={{ value: chartType === "daily" ? "Date" : "Month", position: "insideBottom", offset: -5 }} 
                />
                <YAxis 
                  label={{ value: "Amount (₹)", angle: -90, position: "insideLeft" }} 
                  tickFormatter={(value) => `₹${value.toLocaleString()}`}
                />
                <Tooltip 
                  formatter={(value) => [`₹${Number(value).toLocaleString()}`, "Sales"]}
                  labelFormatter={(label) => `${label}`}
                />
                <Legend />
                <Bar 
                  name="Sales" 
                  dataKey="sales" 
                  fill="var(--chart-1)" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesReport;
