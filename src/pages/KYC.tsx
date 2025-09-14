import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { KYCHeader } from "@/components/kyc/KYCHeader";
import { KYCFilterTabs } from "@/components/kyc/KYCFilterTabs";
import { KYCTable } from "@/components/kyc/KYCTable";
import { KYCDetailDrawer } from "@/components/kyc/KYCDetailDrawer";

// Mock data for KYC requests
const mockKYCRequests = [
  {
    id: "KYC001",
    clientName: "Sarah Mitchell",
    email: "sarah.mitchell@email.com",
    submissionDate: "2024-03-20",
    documentType: "Passport",
    status: "pending" as const,
    avatar: "",
    phone: "+1 555-0124",
    registrationDate: "2024-02-20",
    documents: [
      { type: "Passport", url: "/placeholder.svg", uploaded: "2024-03-20" },
      { type: "Proof of Address", url: "/placeholder.svg", uploaded: "2024-03-20" }
    ],
    adminNotes: ""
  },
  {
    id: "KYC002",
    clientName: "David Thompson",
    email: "david.thompson@email.com",
    submissionDate: "2024-03-25",
    documentType: "Driver's License",
    status: "pending" as const,
    avatar: "",
    phone: "+1 555-0127",
    registrationDate: "2024-03-25",
    documents: [
      { type: "Driver's License", url: "/placeholder.svg", uploaded: "2024-03-25" },
      { type: "Bank Statement", url: "/placeholder.svg", uploaded: "2024-03-25" }
    ],
    adminNotes: ""
  },
  {
    id: "KYC003",
    clientName: "Lisa Chen",
    email: "lisa.chen@email.com",
    submissionDate: "2024-03-18",
    documentType: "ID Card",
    status: "approved" as const,
    avatar: "",
    phone: "+1 555-0128",
    registrationDate: "2024-03-15",
    documents: [
      { type: "National ID", url: "/placeholder.svg", uploaded: "2024-03-18" },
      { type: "Utility Bill", url: "/placeholder.svg", uploaded: "2024-03-18" }
    ],
    adminNotes: "All documents verified successfully."
  },
  {
    id: "KYC004",
    clientName: "Robert Johnson",
    email: "robert.johnson@email.com",
    submissionDate: "2024-03-15",
    documentType: "Passport",
    status: "rejected" as const,
    avatar: "",
    phone: "+1 555-0129",
    registrationDate: "2024-03-10",
    documents: [
      { type: "Passport", url: "/placeholder.svg", uploaded: "2024-03-15" },
      { type: "Proof of Address", url: "/placeholder.svg", uploaded: "2024-03-15" }
    ],
    adminNotes: "Document quality insufficient. Please resubmit with clearer images."
  },
  {
    id: "KYC005",
    clientName: "Maria Rodriguez",
    email: "maria.rodriguez@email.com",
    submissionDate: "2024-03-22",
    documentType: "ID Card",
    status: "approved" as const,
    avatar: "",
    phone: "+1 555-0130",
    registrationDate: "2024-03-20",
    documents: [
      { type: "National ID", url: "/placeholder.svg", uploaded: "2024-03-22" },
      { type: "Bank Statement", url: "/placeholder.svg", uploaded: "2024-03-22" }
    ],
    adminNotes: "Approved after manual verification."
  }
];

export type KYCRequest = typeof mockKYCRequests[0];

const KYC = () => {
  const [requests, setRequests] = useState(mockKYCRequests);
  const [selectedRequest, setSelectedRequest] = useState<KYCRequest | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const handleViewRequest = (request: KYCRequest) => {
    setSelectedRequest(request);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedRequest(null);
  };

  const handleSelectRequest = (requestId: string) => {
    setSelectedRequests(prev => 
      prev.includes(requestId) 
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const handleSelectAllRequests = (checked: boolean) => {
    setSelectedRequests(checked ? filteredRequests.map(r => r.id) : []);
  };

  const handleStatusUpdate = (requestId: string, newStatus: "pending" | "approved" | "rejected", notes?: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { ...req, status: newStatus, adminNotes: notes || req.adminNotes }
        : req
    ));
    
    if (selectedRequest?.id === requestId) {
      setSelectedRequest(prev => prev ? { ...prev, status: newStatus, adminNotes: notes || prev.adminNotes } : null);
    }
  };

  const handleBulkAction = (action: "approve" | "reject") => {
    const newStatus = action === "approve" ? "approved" : "rejected";
    setRequests(prev => prev.map(req => 
      selectedRequests.includes(req.id) 
        ? { ...req, status: newStatus }
        : req
    ));
    setSelectedRequests([]);
  };

  // Filter requests based on search and active tab
  const filteredRequests = requests.filter(request => {
    const matchesSearch = searchQuery === "" || 
      request.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === "all" || request.status === activeTab;
    
    return matchesSearch && matchesTab;
  });

  return (
    <DashboardLayout title="KYC Requests">
      <div className="space-y-6">
        <KYCHeader 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        
        <KYCFilterTabs 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          requests={requests}
          selectedCount={selectedRequests.length}
          onBulkAction={handleBulkAction}
        />

        <KYCTable 
          requests={filteredRequests}
          selectedRequests={selectedRequests}
          onSelectRequest={handleSelectRequest}
          onSelectAll={handleSelectAllRequests}
          onViewRequest={handleViewRequest}
          onStatusUpdate={handleStatusUpdate}
        />

        <KYCDetailDrawer 
          request={selectedRequest}
          isOpen={isDrawerOpen}
          onClose={handleCloseDrawer}
          onStatusUpdate={handleStatusUpdate}
        />
      </div>
    </DashboardLayout>
  );
};

export default KYC;