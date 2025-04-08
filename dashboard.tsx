import DashboardStats from "@/components/dashboard/DashboardStats";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import LowStockInventory from "@/components/dashboard/LowStockInventory";
import TopSellingProducts from "@/components/dashboard/TopSellingProducts";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentActivity from "@/components/dashboard/RecentActivity";

const Dashboard = () => {
  return (
    <div>
      <DashboardStats />
      
      <RecentTransactions />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <LowStockInventory />
        <TopSellingProducts />
      </div>
      
      <QuickActions />
      
      <RecentActivity />
    </div>
  );
};

export default Dashboard;
