import { useState } from "react";
import { Check, TestTube, CreditCard, Smartphone, Bitcoin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

export function SystemSettingsTab() {
  const [settings, setSettings] = useState({
    // Payment Methods
    upiId: "payments@vaultpro.com",
    bankAccount: "1234567890",
    bankName: "Chase Bank",
    bankRoutingNumber: "123456789",
    cryptoWalletBTC: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    cryptoWalletETH: "0x742d35cc6bf8f5c5c7b8c7c5c7b8c7c5c7b8c7c5",
    
    // Withdrawal Rules
    minimumWithdrawal: "100",
    processingTime: "24",
    allowedMethods: ["bank", "upi", "crypto"],
    
    // Email/SMS Integration
    emailApiKey: "",
    emailSenderName: "VaultPro",
    emailSenderEmail: "noreply@vaultpro.com",
    smsApiKey: "",
    smsSenderName: "VaultPro",
    
    // Trading Platform API
    mt4ServerUrl: "trade.vaultpro.com:443",
    mt4ApiKey: "",
    mt5ServerUrl: "trade.vaultpro.com:443",
    mt5ApiKey: "",
  });

  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const testConnection = async (service: string) => {
    setTestingConnection(service);
    
    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Connection Test",
      description: `${service} connection test completed successfully.`,
    });
    
    setTestingConnection(null);
  };

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "System settings have been updated successfully.",
    });
  };

  return (
    <Card className="p-6">
      <div className="space-y-8">
        {/* Payment Methods */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Payment Methods</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="upiId">UPI ID</Label>
                <Input
                  id="upiId"
                  value={settings.upiId}
                  onChange={(e) => handleInputChange("upiId", e.target.value)}
                  placeholder="payments@vaultpro.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bankAccount">Bank Account Number</Label>
                <Input
                  id="bankAccount"
                  value={settings.bankAccount}
                  onChange={(e) => handleInputChange("bankAccount", e.target.value)}
                  placeholder="Enter account number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={settings.bankName}
                  onChange={(e) => handleInputChange("bankName", e.target.value)}
                  placeholder="Enter bank name"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bankRoutingNumber">Routing Number</Label>
                <Input
                  id="bankRoutingNumber"
                  value={settings.bankRoutingNumber}
                  onChange={(e) => handleInputChange("bankRoutingNumber", e.target.value)}
                  placeholder="Enter routing number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cryptoWalletBTC">Bitcoin Wallet Address</Label>
                <Input
                  id="cryptoWalletBTC"
                  value={settings.cryptoWalletBTC}
                  onChange={(e) => handleInputChange("cryptoWalletBTC", e.target.value)}
                  placeholder="Enter BTC wallet address"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cryptoWalletETH">Ethereum Wallet Address</Label>
                <Input
                  id="cryptoWalletETH"
                  value={settings.cryptoWalletETH}
                  onChange={(e) => handleInputChange("cryptoWalletETH", e.target.value)}
                  placeholder="Enter ETH wallet address"
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Withdrawal Rules */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Withdrawal Rules</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="minimumWithdrawal">Minimum Withdrawal ($)</Label>
              <Input
                id="minimumWithdrawal"
                type="number"
                value={settings.minimumWithdrawal}
                onChange={(e) => handleInputChange("minimumWithdrawal", e.target.value)}
                placeholder="100"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="processingTime">Processing Time (hours)</Label>
              <Input
                id="processingTime"
                type="number"
                value={settings.processingTime}
                onChange={(e) => handleInputChange("processingTime", e.target.value)}
                placeholder="24"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="allowedMethods">Allowed Methods</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="upi">UPI Payment</SelectItem>
                  <SelectItem value="crypto">Cryptocurrency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Email/SMS Integration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Email/SMS Integration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emailApiKey">Email API Key</Label>
                <Input
                  id="emailApiKey"
                  type="password"
                  value={settings.emailApiKey}
                  onChange={(e) => handleInputChange("emailApiKey", e.target.value)}
                  placeholder="Enter SendGrid or similar API key"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emailSenderName">Sender Name</Label>
                <Input
                  id="emailSenderName"
                  value={settings.emailSenderName}
                  onChange={(e) => handleInputChange("emailSenderName", e.target.value)}
                  placeholder="VaultPro"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emailSenderEmail">Sender Email</Label>
                <Input
                  id="emailSenderEmail"
                  type="email"
                  value={settings.emailSenderEmail}
                  onChange={(e) => handleInputChange("emailSenderEmail", e.target.value)}
                  placeholder="noreply@vaultpro.com"
                />
              </div>
              
              <Button
                variant="outline"
                onClick={() => testConnection("Email")}
                disabled={testingConnection === "Email"}
                className="w-full"
              >
                <TestTube className="h-4 w-4 mr-2" />
                {testingConnection === "Email" ? "Testing..." : "Test Email Connection"}
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="smsApiKey">SMS API Key</Label>
                <Input
                  id="smsApiKey"
                  type="password"
                  value={settings.smsApiKey}
                  onChange={(e) => handleInputChange("smsApiKey", e.target.value)}
                  placeholder="Enter Twilio or similar API key"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="smsSenderName">SMS Sender Name</Label>
                <Input
                  id="smsSenderName"
                  value={settings.smsSenderName}
                  onChange={(e) => handleInputChange("smsSenderName", e.target.value)}
                  placeholder="VaultPro"
                />
              </div>
              
              <Button
                variant="outline"
                onClick={() => testConnection("SMS")}
                disabled={testingConnection === "SMS"}
                className="w-full mt-[52px]"
              >
                <TestTube className="h-4 w-4 mr-2" />
                {testingConnection === "SMS" ? "Testing..." : "Test SMS Connection"}
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Trading Platform API */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Trading Platform API</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">MT4 Configuration</h4>
              
              <div className="space-y-2">
                <Label htmlFor="mt4ServerUrl">MT4 Server URL</Label>
                <Input
                  id="mt4ServerUrl"
                  value={settings.mt4ServerUrl}
                  onChange={(e) => handleInputChange("mt4ServerUrl", e.target.value)}
                  placeholder="trade.vaultpro.com:443"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mt4ApiKey">MT4 API Key</Label>
                <Input
                  id="mt4ApiKey"
                  type="password"
                  value={settings.mt4ApiKey}
                  onChange={(e) => handleInputChange("mt4ApiKey", e.target.value)}
                  placeholder="Enter MT4 bridge API key"
                />
              </div>
              
              <Button
                variant="outline"
                onClick={() => testConnection("MT4")}
                disabled={testingConnection === "MT4"}
                className="w-full"
              >
                <TestTube className="h-4 w-4 mr-2" />
                {testingConnection === "MT4" ? "Testing..." : "Test MT4 Connection"}
              </Button>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">MT5 Configuration</h4>
              
              <div className="space-y-2">
                <Label htmlFor="mt5ServerUrl">MT5 Server URL</Label>
                <Input
                  id="mt5ServerUrl"
                  value={settings.mt5ServerUrl}
                  onChange={(e) => handleInputChange("mt5ServerUrl", e.target.value)}
                  placeholder="trade.vaultpro.com:443"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mt5ApiKey">MT5 API Key</Label>
                <Input
                  id="mt5ApiKey"
                  type="password"
                  value={settings.mt5ApiKey}
                  onChange={(e) => handleInputChange("mt5ApiKey", e.target.value)}
                  placeholder="Enter MT5 bridge API key"
                />
              </div>
              
              <Button
                variant="outline"
                onClick={() => testConnection("MT5")}
                disabled={testingConnection === "MT5"}
                className="w-full"
              >
                <TestTube className="h-4 w-4 mr-2" />
                {testingConnection === "MT5" ? "Testing..." : "Test MT5 Connection"}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <Button onClick={handleSave} size="lg">
            <Check className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </Card>
  );
}