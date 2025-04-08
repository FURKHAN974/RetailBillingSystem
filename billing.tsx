import { useState } from "react";
import BillList from "@/components/billing/BillList";
import BillForm from "@/components/billing/BillForm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Plus, ArrowLeft } from "lucide-react";

const Billing = () => {
  const [location] = useLocation();
  const isNewBill = location === "/billing/new";
  const [, navigate] = useLocation();

  return (
    <div>
      {isNewBill ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
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
              <CardTitle>Create New Bill</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <BillForm onSuccess={() => navigate("/billing")} />
          </CardContent>
        </Card>
      ) : (
        <BillList />
      )}
    </div>
  );
};

export default Billing;
