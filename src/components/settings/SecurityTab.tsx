import { useState } from "react";
import { Shield, Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

interface IPWhitelistEntry {
  id: string;
  ipAddress: string;
  description: string;
  createdAt: Date;
}

export function SecurityTab() {
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: true,
    passwordMinLength: "8",
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: true,
    sessionTimeout: "30",
  });

  const [ipWhitelist, setIpWhitelist] = useState<IPWhitelistEntry[]>([
    {
      id: "1",
      ipAddress: "192.168.1.100",
      description: "Office Main Network",
      createdAt: new Date("2024-01-15"),
    },
    {
      id: "2", 
      ipAddress: "203.0.113.45",
      description: "Remote Admin Access",
      createdAt: new Date("2024-01-18"),
    },
  ]);

  const [newIpAddress, setNewIpAddress] = useState("");
  const [newIpDescription, setNewIpDescription] = useState("");

  const handleSettingChange = (field: string, value: string | boolean) => {
    setSecuritySettings(prev => ({ ...prev, [field]: value }));
  };

  const addIpAddress = () => {
    if (!newIpAddress || !newIpDescription) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    const newEntry: IPWhitelistEntry = {
      id: Date.now().toString(),
      ipAddress: newIpAddress,
      description: newIpDescription,
      createdAt: new Date(),
    };

    setIpWhitelist([...ipWhitelist, newEntry]);
    setNewIpAddress("");
    setNewIpDescription("");
    
    toast({
      title: "IP Address Added",
      description: "The IP address has been added to the whitelist.",
    });
  };

  const removeIpAddress = (id: string) => {
    setIpWhitelist(ipWhitelist.filter(entry => entry.id !== id));
    toast({
      title: "IP Address Removed",
      description: "The IP address has been removed from the whitelist.",
    });
  };

  const handleSave = () => {
    toast({
      title: "Security Settings Saved",
      description: "Security settings have been updated successfully.",
    });
  };

  return (
    <Card className="p-6">
      <div className="space-y-8">
        {/* Two-Factor Authentication */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Two-Factor Authentication</h3>
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium text-foreground">Enable 2FA for all admin accounts</p>
              <p className="text-sm text-muted-foreground">
                Require all administrators to use two-factor authentication
              </p>
            </div>
            <Switch
              checked={securitySettings.twoFactorAuth}
              onCheckedChange={(checked) => handleSettingChange("twoFactorAuth", checked)}
            />
          </div>
        </div>

        <Separator />

        {/* Password Policy */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Password Policy</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                <Select
                  value={securitySettings.passwordMinLength}
                  onValueChange={(value) => handleSettingChange("passwordMinLength", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 characters</SelectItem>
                    <SelectItem value="8">8 characters</SelectItem>
                    <SelectItem value="10">10 characters</SelectItem>
                    <SelectItem value="12">12 characters</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Require uppercase letters</Label>
                  <Switch
                    checked={securitySettings.passwordRequireUppercase}
                    onCheckedChange={(checked) => handleSettingChange("passwordRequireUppercase", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Require numbers</Label>
                  <Switch
                    checked={securitySettings.passwordRequireNumbers}
                    onCheckedChange={(checked) => handleSettingChange("passwordRequireNumbers", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Require special characters</Label>
                  <Switch
                    checked={securitySettings.passwordRequireSpecialChars}
                    onCheckedChange={(checked) => handleSettingChange("passwordRequireSpecialChars", checked)}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Select
                  value={securitySettings.sessionTimeout}
                  onValueChange={(value) => handleSettingChange("sessionTimeout", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="240">4 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* IP Whitelisting */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">IP Whitelisting</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="newIpAddress">IP Address</Label>
              <Input
                id="newIpAddress"
                value={newIpAddress}
                onChange={(e) => setNewIpAddress(e.target.value)}
                placeholder="192.168.1.100"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newIpDescription">Description</Label>
              <Input
                id="newIpDescription"
                value={newIpDescription}
                onChange={(e) => setNewIpDescription(e.target.value)}
                placeholder="Office network"
              />
            </div>
            
            <div className="flex items-end">
              <Button onClick={addIpAddress} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add IP
              </Button>
            </div>
          </div>

          {/* IP Whitelist Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ipWhitelist.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono text-sm">
                      {entry.ipAddress}
                    </TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell>
                      {entry.createdAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeIpAddress(entry.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {ipWhitelist.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No IP addresses in whitelist
            </div>
          )}
        </div>

        <div className="flex justify-end pt-6">
          <Button onClick={handleSave} size="lg">
            <Check className="h-4 w-4 mr-2" />
            Save Security Settings
          </Button>
        </div>
      </div>
    </Card>
  );
}