import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Receipt, 
  Package, 
  Users, 
  BarChart2, 
  FileSpreadsheet, 
  Settings 
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const [location] = useLocation();

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard /> },
    { name: "Billing", path: "/billing", icon: <Receipt /> },
    { name: "Products", path: "/products", icon: <Package /> },
    { name: "Customers", path: "/customers", icon: <Users /> },
    { name: "Inventory", path: "/inventory", icon: <FileSpreadsheet /> },
    { name: "Reports", path: "/reports", icon: <BarChart2 /> },
    { name: "Settings", path: "/settings", icon: <Settings /> },
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard" && location === "/") return true;
    return location === path;
  };

  return (
    <>
      {/* Overlay for mobile view */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={onClose}
        />
      )}
      
      <div className={`
        bg-white w-64 shadow-md z-30 
        fixed inset-y-0 left-0 transform transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:h-screen
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-primary">RetailPro</h1>
          <p className="text-sm text-gray-500">Billing System</p>
        </div>
        <nav className="p-2">
          <ul>
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link href={item.path}>
                  <div 
                    className={`
                      flex items-center p-3 rounded-lg text-gray-800 hover:bg-gray-100 mb-1 cursor-pointer
                      ${isActive(item.path) ? 'border-l-4 border-primary bg-primary/5' : ''}
                    `}
                    onClick={() => onClose()}
                  >
                    <span className="h-5 w-5 mr-3">{item.icon}</span>
                    {item.name}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
