import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle2, File, Save } from "lucide-react";
import { InvoiceTemplateList } from "@/components/settings/InvoiceTemplateList";

const Settings = () => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    
    // Simulate saving
    setTimeout(() => {
      setSaving(false);
      toast({
        title: "Settings saved",
        description: "Your settings have been saved successfully.",
      });
    }, 1000);
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Manage your account settings and application preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general">
            <TabsList className="mb-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="invoiceTemplates">Invoice Templates</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general">
              <div className="space-y-6">
                <div className="space-y-1">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input id="storeName" defaultValue="RetailPro Store" />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" defaultValue="admin@retailpro.com" />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" defaultValue="+91 9876543210" />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="address">Store Address</Label>
                  <Input id="address" defaultValue="123 Main Street, Mumbai, Maharashtra" />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                  <Input id="taxRate" type="number" defaultValue="18" />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="twentyFourHourTime">Use 24-hour time</Label>
                  <Switch id="twentyFourHourTime" defaultChecked />
                </div>
                
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="invoiceTemplates">
              <div className="space-y-4">
                <div className="rounded-md bg-green-50 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <File className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Customize Your Invoices</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>
                          Create and manage custom invoice templates for your store. Set colors, styles, and branding to match your business identity.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <InvoiceTemplateList />
              </div>
            </TabsContent>
            
            <TabsContent value="billing">
              <div className="space-y-4">
                <div className="rounded-md bg-yellow-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Coming Soon</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          Billing settings will be available in a future update. This will include payment processing options and invoice customization.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="notifications">
              <div className="space-y-4">
                <div className="rounded-md bg-green-50 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Notifications are enabled</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>
                          You're receiving all notifications for low stock alerts, sales reports, and system updates.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="lowStockAlerts">Low stock alerts</Label>
                    <Switch id="lowStockAlerts" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="newSaleNotifications">New sale notifications</Label>
                    <Switch id="newSaleNotifications" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dailySummary">Daily sales summary</Label>
                    <Switch id="dailySummary" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="systemUpdates">System updates</Label>
                    <Switch id="systemUpdates" defaultChecked />
                  </div>
                </div>
                
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="advanced">
              <div className="space-y-4">
                <div className="rounded-md bg-yellow-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Advanced Settings</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          These settings are for advanced users. Changing these settings may affect the functionality of your application.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dataBackup">Automatic data backup</Label>
                    <Switch id="dataBackup" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="debugMode">Debug mode</Label>
                    <Switch id="debugMode" />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="apiKey">Firebase API Key</Label>
                    <Input id="apiKey" type="password" value="●●●●●●●●●●●●●●●●●●●●" readOnly />
                    <p className="text-xs text-gray-500 mt-1">
                      API keys are managed through environment variables for security.
                    </p>
                  </div>
                </div>
                
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
