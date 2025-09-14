import { useState } from "react";
import React from "react";
import {
  MoreHorizontal,
  Edit,
  Eye,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SpreadProfile } from "@/features/spreadProfile/spreadProfile.types";

interface SpreadProfilesTableProps {
  profiles: SpreadProfile[];
  onEditProfile: (profile: SpreadProfile) => void;
  onDeleteProfile: (id: number) => void;
}

export function SpreadProfilesTable({
  profiles,
  onEditProfile,
  onDeleteProfile,
}: SpreadProfilesTableProps) {
  const [expandedProfiles, setExpandedProfiles] = useState<Set<string>>(
    new Set()
  );

  const toggleExpanded = (profileId: string) => {
    const newExpanded = new Set(expandedProfiles);
    if (newExpanded.has(profileId)) {
      newExpanded.delete(profileId);
    } else {
      newExpanded.add(profileId);
    }
    setExpandedProfiles(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === "Active" ? "default" : "secondary"}>
        {status}
      </Badge>
    );
  };

  if (profiles.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <p>No spread profiles found matching your criteria.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Profile Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((profile) => (
            <React.Fragment key={profile.id}>
              <TableRow className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(profile.id)}
                    className="h-8 w-8 p-0"
                  >
                    {expandedProfiles.has(profile.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{profile.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {profile.description}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(profile.status)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(profile.createdAt).toLocaleDateString("en-US", {
                    month: "2-digit",
                    day: "2-digit",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditProfile(profile)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDeleteProfile(Number(profile.id))}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>

              {expandedProfiles.has(profile.id) && (
                <TableRow>
                  <TableCell colSpan={6} className="bg-muted/20 p-0">
                    <div className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">
                          Currency Pairs Configuration
                        </h4>
                        <div className="flex gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {profile.currencyPairs.length} Total Pairs
                          </Badge>
                        </div>
                      </div>

                      {/* Summary Statistics */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">
                            AverageSpread
                          </div>
                          <div className="font-medium">
                            {(
                              profile.currencyPairs.reduce(
                                (sum, p) => sum + p.spread,
                                0
                              ) / profile.currencyPairs.length
                            ).toFixed(1)}{" "}
                            pips
                          </div>
                        </div>
                      </div>

                      {/* Sample Pairs Display */}
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          Currency pairs configuration:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          {(expandedProfiles.has(profile.id)
                            ? profile.currencyPairs
                            : profile.currencyPairs.slice(0, 12)
                          ).map((pair, index) => (
                            <div
                              key={index}
                              className="border rounded-lg p-3 bg-background"
                            >
                              <div className="font-medium text-sm mb-2">
                                {pair.pair}
                              </div>
                              <div className="space-y-1 text-xs text-muted-foreground">
                                <div className="flex justify-between">
                                  <span>Spread:</span>
                                  <span className="font-medium">
                                    {pair.spread.toFixed(1)} pips
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {profile.currencyPairs.length > 12 && (
                          <div className="text-center py-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newExpanded = new Set(expandedProfiles);
                                if (newExpanded.has(profile.id)) {
                                  newExpanded.delete(profile.id);
                                } else {
                                  newExpanded.add(profile.id);
                                }
                                setExpandedProfiles(newExpanded);
                              }}
                            >
                              {expandedProfiles.has(profile.id)
                                ? "Show less"
                                : `Show all (${profile.currencyPairs.length})`}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
