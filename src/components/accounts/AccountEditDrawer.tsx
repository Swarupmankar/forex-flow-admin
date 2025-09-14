import { useState, useEffect } from "react";
import { X, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Account } from "@/pages/AccountsSpreads";

interface SpreadPair {
  pair: string;
  spread: number;
}

const defaultSpreads: SpreadPair[] = [
  { pair: "EUR/USD", spread: 1.2 },
  { pair: "GBP/USD", spread: 1.5 },
  { pair: "USD/JPY", spread: 1.1 },
  { pair: "USD/CHF", spread: 1.8 },
  { pair: "AUD/USD", spread: 1.6 },
  { pair: "USD/CAD", spread: 1.9 },
  { pair: "NZD/USD", spread: 2.1 },
  { pair: "EUR/GBP", spread: 2.2 },
];

interface AccountEditDrawerProps {
  account: Account | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: Account) => void;
}

export function AccountEditDrawer({ account, isOpen, onClose, onSave }: AccountEditDrawerProps) {
  const [editedAccount, setEditedAccount] = useState<Account | null>(null);
  const [spreads, setSpreads] = useState<SpreadPair[]>(defaultSpreads);

  useEffect(() => {
    if (account) {
      setEditedAccount({ ...account });
      setSpreads([...defaultSpreads]);
    }
  }, [account]);

  if (!editedAccount) return null;

  const handleSave = () => {
    onSave(editedAccount);
  };

  const updateSpread = (pair: string, newSpread: number) => {
    setSpreads(spreads.map(s => 
      s.pair === pair ? { ...s, spread: Math.max(0.1, newSpread) } : s
    ));
  };

  const adjustBalance = (amount: number) => {
    setEditedAccount({
      ...editedAccount,
      balance: Math.max(0, editedAccount.balance + amount)
    });
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-w-md ml-auto h-full">
        <DrawerHeader className="border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg font-semibold">
              Edit Account {editedAccount.id}
            </DrawerTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Account Info */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Account Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="accountId">Account ID</Label>
                <Input 
                  id="accountId" 
                  value={editedAccount.id} 
                  disabled 
                  className="bg-muted"
                />
              </div>
              
              <div>
                <Label htmlFor="clientName">Client Name</Label>
                <Input 
                  id="clientName" 
                  value={editedAccount.clientName}
                  onChange={(e) => setEditedAccount({...editedAccount, clientName: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="accountType">Account Type</Label>
                <Select 
                  value={editedAccount.accountType} 
                  onValueChange={(value: "Standard" | "Pro" | "Raw Spread") => 
                    setEditedAccount({...editedAccount, accountType: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Pro">Pro</SelectItem>
                    <SelectItem value="Raw Spread">Raw Spread</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="leverage">Leverage</Label>
                <Select 
                  value={editedAccount.leverage.toString()} 
                  onValueChange={(value) => 
                    setEditedAccount({...editedAccount, leverage: parseInt(value)})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">1:30</SelectItem>
                    <SelectItem value="50">1:50</SelectItem>
                    <SelectItem value="100">1:100</SelectItem>
                    <SelectItem value="200">1:200</SelectItem>
                    <SelectItem value="500">1:500</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Balance Management */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Balance Management</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="balance">Current Balance</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="balance"
                    type="number"
                    step="0.01"
                    value={editedAccount.balance}
                    onChange={(e) => setEditedAccount({
                      ...editedAccount, 
                      balance: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => adjustBalance(100)}
                  className="flex-1 gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Deposit $100
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => adjustBalance(-100)}
                  className="flex-1 gap-1"
                >
                  <Minus className="h-3 w-3" />
                  Withdraw $100
                </Button>
              </div>
            </div>
          </Card>

          {/* Spread Settings */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Spread Settings</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Pair</TableHead>
                    <TableHead className="text-xs text-right">Spread (pips)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {spreads.map((spread) => (
                    <TableRow key={spread.pair}>
                      <TableCell className="text-sm py-2">{spread.pair}</TableCell>
                      <TableCell className="py-2">
                        <Input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={spread.spread}
                          onChange={(e) => updateSpread(spread.pair, parseFloat(e.target.value))}
                          className="w-20 h-8 text-right text-sm"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Status Toggle */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Account Status</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Account Status</p>
                <p className="text-xs text-muted-foreground">
                  {editedAccount.status === "Active" ? "Account is active and can trade" : "Account is disabled"}
                </p>
              </div>
              <Switch
                checked={editedAccount.status === "Active"}
                onCheckedChange={(checked) => 
                  setEditedAccount({
                    ...editedAccount, 
                    status: checked ? "Active" : "Disabled"
                  })
                }
              />
            </div>
          </Card>
        </div>

        <DrawerFooter className="border-t border-border bg-card sticky bottom-0">
          <Button onClick={handleSave} className="w-full">
            Save Changes
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}