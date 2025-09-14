import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Search } from "lucide-react";
import {
  CurrencyPairSpread,
  SpreadProfile,
} from "@/features/spreadProfile/spreadProfile.types";
import { DEFAULT_CURRENCY_PAIRS } from "@/features/accountTypes/DEFAULT_CURRENCY_PAIRS";

interface SpreadProfileModalProps {
  profile: SpreadProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: Partial<SpreadProfile>) => void;
}

export function SpreadProfileModal({
  profile,
  isOpen,
  onClose,
  onSave,
}: SpreadProfileModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "Active" as SpreadProfile["status"],
    currencyPairs: [] as CurrencyPairSpread[],
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        description: profile.description,
        status: profile.status,
        currencyPairs: [...profile.currencyPairs],
      });
    } else {
      // For new profiles, start with all pairs based on Standard type
      setFormData({
        name: "",
        description: "",
        status: "Active",
        currencyPairs: DEFAULT_CURRENCY_PAIRS.map((pair) => ({
          pair,
          spread: 0,
        })),
      });
    }
    setSearchTerm("");
  }, [profile]);

  const handlePairChange = (pair: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      currencyPairs: prev.currencyPairs.map((p) =>
        p.pair === pair ? { ...p, spread: value } : p
      ),
    }));
  };
  
  const handleSubmit = () => {
    const submitData = {
      ...formData,
      id: profile?.id,
      createdAt: profile?.createdAt || new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };
    onSave(submitData);
  };

  const isEdit = !!profile;

  // Filter currency pairs based on search
  const filteredPairs = formData.currencyPairs.filter((pair) =>
    pair.pair.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Spread Profile" : "Create New Spread Profile"}
          </DialogTitle>
          <DialogDescription>
            Configure spread settings for all currency pairs. All{" "}
            {formData.currencyPairs.length} pairs are pre-populated with
            defaults based on profile type.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Profile Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter profile name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Enter profile description"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.status === "Active"}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  status: checked ? "Active" : "Inactive",
                }))
              }
            />
            <Label>Active Profile</Label>
          </div>

          <Separator />

          {/* Currency Pairs Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Currency Pairs & Spreads</h3>
              <Badge variant="secondary">
                {formData.currencyPairs.length} Total Pairs
              </Badge>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search currency pairs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Currency Pairs Table */}
            <div className="border rounded-lg max-h-96 overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>Currency Pair</TableHead>
                    <TableHead>Spread (pips)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPairs.map((pair) => (
                    <TableRow key={pair.pair}>
                      <TableCell className="font-medium">{pair.pair}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={pair.spread}
                          onChange={(e) =>
                            handlePairChange(
                              pair.pair,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-24"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredPairs.length === 0 && searchTerm && (
                <div className="p-8 text-center text-muted-foreground">
                  No currency pairs found matching "{searchTerm}"
                </div>
              )}
            </div>

            {searchTerm && (
              <div className="text-sm text-muted-foreground">
                Showing {filteredPairs.length} of{" "}
                {formData.currencyPairs.length} pairs
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name}>
            {isEdit ? "Save Changes" : "Create Profile"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
