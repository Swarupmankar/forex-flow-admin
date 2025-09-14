import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SpreadProfilesHeader } from "@/components/spread-profiles/SpreadProfilesHeader";
import { SpreadProfilesFilters } from "@/components/spread-profiles/SpreadProfilesFilters";
import { SpreadProfilesTable } from "@/components/spread-profiles/SpreadProfilesTable";
import { SpreadProfileModal } from "@/components/spread-profiles/SpreadProfileModal";
import { exportSpreadProfiles } from "@/lib/table-exports";
import {
  useCreateSpreadProfileMutation,
  useDeleteSpreadProfileMutation,
  useGetSpreadProfilesQuery,
  useUpdateSpreadProfileMutation,
} from "@/API/spreadProfilesApi";
import { SpreadProfile } from "@/features/spreadProfile/spreadProfile.types";
import { mapApiToSpreadProfile } from "@/features/spreadProfile/spreadProfile.mapper";
import { useToast } from "@/components/ui/use-toast";

export default function SpreadProfiles() {
  const { toast } = useToast();
  const { data, isLoading, isError } = useGetSpreadProfilesQuery();
  const apiProfiles: SpreadProfile[] = data?.map(mapApiToSpreadProfile) ?? [];

  const [createSpreadProfile] = useCreateSpreadProfileMutation();
  const [updateSpreadProfile] = useUpdateSpreadProfileMutation();
  const [deleteSpreadProfile] = useDeleteSpreadProfileMutation();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [selectedProfile, setSelectedProfile] = useState<SpreadProfile | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading)
    return (
      <DashboardLayout title="Spread Profiles Management">
        <div>Loading spread profiles...</div>
      </DashboardLayout>
    );

  if (isError)
    return (
      <DashboardLayout title="Spread Profiles Management">
        <div>Failed to load spread profiles.</div>
      </DashboardLayout>
    );

  const filteredProfiles = apiProfiles
    .filter((profile) => {
      const matchesSearch =
        profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "All" || profile.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "Newest":
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        case "Oldest":
          return (
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          );
        case "Name A-Z":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const handleEditProfile = (profile: SpreadProfile) => {
    setSelectedProfile(profile);
    setIsModalOpen(true);
  };

  const handleCreateProfile = () => {
    setSelectedProfile(null);
    setIsModalOpen(true);
  };

  const handleSaveProfile = async (profileData: Partial<SpreadProfile>) => {
    try {
      if (profileData.id) {
        await updateSpreadProfile({
          id: Number(profileData.id),
          body: {
            spreadProfileId: Number(profileData.id),
            name: profileData.name!,
            description: profileData.description!,
            isActive: profileData.status === "Active",
            spreadPairs: profileData.currencyPairs.map((p) => ({
              currencyPair: p.pair,
              spreadPips: p.spread.toString(),
            })),
          } as any,
        }).unwrap();
        toast({
          title: "Profile updated",
          description: `${profileData.name} updated successfully.`,
        });
      } else {
        await createSpreadProfile({
          name: profileData.name!,
          description: profileData.description!,
          isActive: profileData.status === "Active",
          spreadPairs: profileData.currencyPairs.map((p) => ({
            currencyPair: p.pair,
            spreadPips: p.spread.toString(),
          })),
        }).unwrap();
        toast({
          title: "Profile created",
          description: `${profileData.name} created successfully.`,
        });
      }
      setIsModalOpen(false);
      setSelectedProfile(null);
    } catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong while saving.",
        variant: "destructive",
      });
    }
  };
  const handleExport = (format: "csv" | "pdf") => {
    const exportData = filteredProfiles.map((profile) => ({
      ...profile,
      averageSpread:
        profile.currencyPairs.reduce((sum, p) => sum + p.spread, 0) /
        profile.currencyPairs.length,
    }));
    exportSpreadProfiles(exportData, format);
  };

  const handleDeleteProfile = async (id: number) => {
    try {
      await deleteSpreadProfile(Number(id)).unwrap();
      toast({
        title: "Profile deleted",
        description: `Profile deleted successfully.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete profile.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout title="Spread Profiles Management">
      <div className="space-y-6">
        <SpreadProfilesHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onCreateProfile={handleCreateProfile}
          onExport={handleExport}
        />

        <SpreadProfilesFilters
          typeFilter="All"
          statusFilter={statusFilter}
          sortBy={sortBy}
          onTypeChange={() => {}} // disabled
          onStatusChange={setStatusFilter}
          onSortChange={setSortBy}
        />

        <SpreadProfilesTable
          profiles={filteredProfiles}
          onEditProfile={handleEditProfile}
          onDeleteProfile={handleDeleteProfile}
        />

        <SpreadProfileModal
          profile={selectedProfile}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveProfile}
        />
      </div>
    </DashboardLayout>
  );
}
