import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Upload, Trash2, CreditCard, Wallet, Building2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";

interface PaymentMethod {
  id: string;
  type: "UPI" | "USDT" | "Bank Transfer";
  status: "Active" | "Inactive";
  details: {
    address?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    holderName?: string;
    branchName?: string;
  };
}

const PaymentSetup = () => {
  const [paymentType, setPaymentType] = useState<string>("");
  const [formData, setFormData] = useState({
    upiId: "",
    walletAddress: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    holderName: "",
    branchName: "",
    qrCode: null as File | null
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: "1",
      type: "UPI",
      status: "Active",
      details: { address: "admin@paytm" }
    },
    {
      id: "2",
      type: "UPI",
      status: "Inactive",
      details: { address: "admin@googlepay" }
    },
    {
      id: "3",
      type: "USDT",
      status: "Active",
      details: { address: "TKHuVq7xABcdEfGhijKLMnOpQrStUvWxYz" }
    },
    {
      id: "4",
      type: "Bank Transfer",
      status: "Active",
      details: {
        bankName: "HDFC Bank",
        accountNumber: "****3456",
        ifscCode: "HDFC0001234",
        holderName: "Admin Account"
      }
    }
  ]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, qrCode: file }));
    }
  };

  const togglePaymentMethodStatus = (methodId: string) => {
    setPaymentMethods(prev => 
      prev.map(method => 
        method.id === methodId 
          ? { ...method, status: method.status === "Active" ? "Inactive" : "Active" as "Active" | "Inactive" }
          : method
      )
    );
  };

  const deletePaymentMethod = (methodId: string) => {
    setPaymentMethods(prev => prev.filter(method => method.id !== methodId));
  };

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case "UPI":
        return <CreditCard className="h-5 w-5" />;
      case "USDT":
        return <Wallet className="h-5 w-5" />;
      case "Bank Transfer":
        return <Building2 className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const renderAddPaymentForm = () => {
    switch (paymentType) {
      case "UPI Payment":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="upiId">UPI ID</Label>
              <Input
                id="upiId"
                placeholder="yourname@paytm"
                value={formData.upiId}
                onChange={(e) => handleInputChange("upiId", e.target.value)}
              />
            </div>
            <div>
              <Label>QR Code (Optional)</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="qr-upload"
                />
                <label htmlFor="qr-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload QR code<br />
                    PNG, JPG up to 5MB
                  </p>
                </label>
              </div>
            </div>
            <Button className="w-full">Add UPI Method</Button>
          </div>
        );

      case "USDT Wallet":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="walletAddress">Wallet Address</Label>
              <Input
                id="walletAddress"
                placeholder="TKHuVq7xABcd..."
                value={formData.walletAddress}
                onChange={(e) => handleInputChange("walletAddress", e.target.value)}
              />
            </div>
            <Button className="w-full">Add USDT Method</Button>
          </div>
        );

      case "Bank Transfer":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  placeholder="1234567890"
                  value={formData.accountNumber}
                  onChange={(e) => handleInputChange("accountNumber", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ifscCode">IFSC Code</Label>
                <Input
                  id="ifscCode"
                  placeholder="HDFC0001234"
                  value={formData.ifscCode}
                  onChange={(e) => handleInputChange("ifscCode", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  placeholder="HDFC Bank"
                  value={formData.bankName}
                  onChange={(e) => handleInputChange("bankName", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="holderName">Account Holder Name</Label>
                <Input
                  id="holderName"
                  placeholder="John Doe"
                  value={formData.holderName}
                  onChange={(e) => handleInputChange("holderName", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="branchName">Branch Name (Optional)</Label>
              <Input
                id="branchName"
                placeholder="Mumbai Main Branch"
                value={formData.branchName}
                onChange={(e) => handleInputChange("branchName", e.target.value)}
              />
            </div>
            <Button className="w-full">Add Bank Transfer Method</Button>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            Please select a payment type to continue
          </div>
        );
    }
  };

  return (
    <DashboardLayout title="Payment Setup">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Payment Setup</h1>
          <p className="text-muted-foreground">
            Manage your payment methods and configurations
          </p>
        </div>

        <Tabs defaultValue="add" className="space-y-6">
          <TabsList>
            <TabsTrigger value="add">Add Payment Method</TabsTrigger>
            <TabsTrigger value="manage">Manage Methods</TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Payment Type</Label>
                  <Select value={paymentType} onValueChange={setPaymentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPI Payment">UPI Payment</SelectItem>
                      <SelectItem value="USDT Wallet">USDT Wallet</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {renderAddPaymentForm()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {paymentMethods.map((method) => (
                <Card key={method.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Header Section */}
                    <div className="flex items-center justify-between p-4 pb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted/50">
                          {getPaymentIcon(method.type)}
                        </div>
                        <h3 className="font-semibold text-base">{method.type}</h3>
                      </div>
                      <Badge variant={method.status === "Active" ? "default" : "secondary"}>
                        {method.status}
                      </Badge>
                    </div>

                    {/* Details Section */}
                    <div className="p-4 py-2">
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">
                            Address/ID
                          </div>
                          <div className="text-sm font-mono bg-muted/50 p-2 rounded border text-wrap break-all">
                            {method.details.address || 
                             `${method.details.bankName} — ${method.details.accountNumber}`}
                          </div>
                        </div>
                        
                        {method.type === "Bank Transfer" && method.details.ifscCode && (
                          <div className="grid grid-cols-1 gap-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">IFSC:</span>
                              <span className="font-medium">{method.details.ifscCode}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Holder:</span>
                              <span className="font-medium">{method.details.holderName}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Section */}
                    <div className="flex items-center justify-between p-4 pt-2 bg-muted/20 border-t">
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={method.status === "Active"} 
                          onCheckedChange={() => togglePaymentMethodStatus(method.id)}
                        />
                        <span className="text-sm font-medium">Active</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => deletePaymentMethod(method.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default PaymentSetup;