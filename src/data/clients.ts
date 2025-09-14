export interface Client {
  id: string;
  name: string;
  email: string;
  accountId: string;
  kycStatus: "approved" | "pending" | "rejected";
  walletBalance: number;
  linkedAccounts: number;
  registrationDate: string;
  phoneNumber: number;
  totalDeposits: number;
  totalWithdrawals: number;
  profit: number;
  referralCode?: string;
  kycDocuments?: {
    idDocument?: {
      front: string;
      back: string;
      type: string;
      frontStatus: "approved" | "pending" | "rejected";
      backStatus: "approved" | "pending" | "rejected";
      frontApprovedBy?: string;
      backApprovedBy?: string;
      frontApprovedAt?: string;
      backApprovedAt?: string;
      frontRejectionReason?: string;
      backRejectionReason?: string;
    };
    selfieProof?: {
      document: string;
      type: string;
      status: "approved" | "pending" | "rejected";
      approvedBy?: string;
      approvedAt?: string;
      rejectionReason?: string;
    };
    proofOfAddress?: {
      document: string;
      type: string;
      status: "approved" | "pending" | "rejected";
      approvedBy?: string;
      approvedAt?: string;
      rejectionReason?: string;
    };
  };
  customMessages?: Array<{
    id: string;
    date: string;
    message: string;
    sentBy: string;
    status: "sent" | "read" | "replied";
  }>;
  transactions?: Array<{
    id: string;
    type: "deposit" | "withdrawal";
    amount: number;
    date: string;
    method: string;
    status: "completed" | "pending" | "failed";
    reference: string;
  }>;
  accounts: Array<{
    type: string;
    leverage: string;
    balance: number;
    status: "active" | "pending" | "disabled";
    accountId?: string;
    accountType: "real" | "demo";
    server?: string;
    lastActivity?: string;
  }>;
  activityLog?: Array<{
    id: string;
    date: string;
    action: string;
    status: string;
    details?: string;
  }>;
}

export const clients: Client[] = [
  {
    id: "C001",
    name: "John Anderson",
    email: "john.anderson@email.com",
    accountId: "ACC-2024-001",
    kycStatus: "approved",
    walletBalance: 15750.5,
    linkedAccounts: 2,
    registrationDate: "2024-01-15",
    phoneNumber: 15550123,
    totalDeposits: 25000,
    totalWithdrawals: 9249.5,
    profit: 12500.25,
    referralCode: "JA2024REF",
    kycDocuments: {
      idDocument: {
        front: "/api/placeholder/300/200",
        back: "/api/placeholder/300/200",
        type: "Passport",
        frontStatus: "approved",
        backStatus: "approved",
        frontApprovedBy: "Admin",
        backApprovedBy: "Admin",
        frontApprovedAt: "2024-01-18",
        backApprovedAt: "2024-01-18",
      },
      selfieProof: {
        document: "/api/placeholder/300/200",
        type: "Selfie with ID",
        status: "approved",
        approvedBy: "Admin",
        approvedAt: "2024-01-18",
      },
      proofOfAddress: {
        document: "/api/placeholder/300/200",
        type: "Utility Bill",
        status: "approved",
        approvedBy: "Admin",
        approvedAt: "2024-01-18",
      },
    },
    customMessages: [
      {
        id: "1",
        date: "2024-01-22",
        message:
          "Welcome to our premium trading platform! Your account has been fully verified.",
        sentBy: "Support Team",
        status: "read",
      },
    ],
    transactions: [
      {
        id: "T001",
        type: "deposit",
        amount: 25000,
        date: "2024-01-16",
        method: "Bank Transfer",
        status: "completed",
        reference: "DEP-001-2024",
      },
      {
        id: "T002",
        type: "withdrawal",
        amount: 9249.5,
        date: "2024-01-25",
        method: "Bank Transfer",
        status: "completed",
        reference: "WD-001-2024",
      },
    ],
    activityLog: [
      {
        id: "1",
        date: "2024-01-20",
        action: "KYC Approved",
        status: "success",
        details: "All documents verified",
      },
      {
        id: "2",
        date: "2024-01-18",
        action: "Account Created",
        status: "success",
        details: "Pro account opened",
      },
      {
        id: "3",
        date: "2024-01-15",
        action: "Registration",
        status: "success",
        details: "Initial signup completed",
      },
    ],
    accounts: [
      {
        type: "Standard",
        leverage: "1:100",
        balance: 8750.25,
        status: "active",
        accountId: "TRD-001",
        accountType: "real",
        server: "Live-01",
        lastActivity: "2024-01-26 14:30",
      },
      {
        type: "Pro",
        leverage: "1:200",
        balance: 7000.25,
        status: "active",
        accountId: "TRD-002",
        accountType: "real",
        server: "Live-02",
        lastActivity: "2024-01-26 13:45",
      },
    ],
  },
  {
    id: "C002",
    name: "Sarah Mitchell",
    email: "sarah.mitchell@email.com",
    accountId: "ACC-2024-002",
    kycStatus: "pending",
    walletBalance: 5200.0,
    linkedAccounts: 1,
    registrationDate: "2024-02-20",
    phoneNumber: 15550124,
    totalDeposits: 5200,
    totalWithdrawals: 0,
    profit: 0,
    kycDocuments: {
      idDocument: {
        front: "/api/placeholder/300/200",
        back: "/api/placeholder/300/200",
        type: "Driver's License",
        frontStatus: "pending",
        backStatus: "pending",
      },
      selfieProof: {
        document: "/api/placeholder/300/200",
        type: "Selfie with ID",
        status: "pending",
      },
      proofOfAddress: {
        document: "/api/placeholder/300/200",
        type: "Bank Statement",
        status: "approved",
        approvedBy: "Admin",
        approvedAt: "2024-02-21",
      },
    },
    transactions: [
      {
        id: "T003",
        type: "deposit",
        amount: 5200,
        date: "2024-02-20",
        method: "Credit Card",
        status: "completed",
        reference: "DEP-002-2024",
      },
    ],
    activityLog: [
      {
        id: "1",
        date: "2024-02-22",
        action: "KYC Submitted",
        status: "pending",
        details: "Documents under review",
      },
      {
        id: "2",
        date: "2024-02-20",
        action: "Registration",
        status: "success",
        details: "Account created",
      },
    ],
    accounts: [
      {
        type: "Standard",
        leverage: "1:50",
        balance: 5200.0,
        status: "pending",
        accountId: "TRD-003",
        accountType: "demo",
        server: "Demo-01",
        lastActivity: "2024-02-22 10:15",
      },
    ],
  },
  {
    id: "C003",
    name: "Michael Chen",
    email: "michael.chen@email.com",
    accountId: "ACC-2024-003",
    kycStatus: "rejected",
    walletBalance: 0,
    linkedAccounts: 0,
    registrationDate: "2024-03-10",

    phoneNumber: 15550125,
    totalDeposits: 1000,
    totalWithdrawals: 1000,
    profit: -50,
    kycDocuments: {
      idDocument: {
        front: "/api/placeholder/300/200",
        back: "/api/placeholder/300/200",
        type: "Passport",
        frontStatus: "rejected",
        backStatus: "rejected",
        frontRejectionReason: "Poor image quality",
        backRejectionReason: "Poor image quality",
      },
      selfieProof: {
        document: "/api/placeholder/300/200",
        type: "Selfie with ID",
        status: "rejected",
        rejectionReason: "Face not clearly visible",
      },
      proofOfAddress: {
        document: "/api/placeholder/300/200",
        type: "Utility Bill",
        status: "rejected",
        rejectionReason: "Document too old",
      },
    },
    activityLog: [
      {
        id: "1",
        date: "2024-03-15",
        action: "KYC Rejected",
        status: "error",
        details: "Document quality insufficient",
      },
      {
        id: "2",
        date: "2024-03-12",
        action: "KYC Submitted",
        status: "pending",
        details: "Documents submitted for review",
      },
      {
        id: "3",
        date: "2024-03-10",
        action: "Registration",
        status: "success",
        details: "Account created",
      },
    ],
    accounts: [],
  },
  {
    id: "C004",
    name: "Emma Rodriguez",
    email: "emma.rodriguez@email.com",
    accountId: "ACC-2024-004",
    kycStatus: "approved",
    walletBalance: 22300.75,
    linkedAccounts: 3,
    registrationDate: "2024-01-05",
    phoneNumber: 15550126,
    totalDeposits: 35000,
    totalWithdrawals: 12699.25,
    profit: 18750.5,
    referralCode: "ER2024VIP",
    kycDocuments: {
      idDocument: {
        front: "/api/placeholder/300/200",
        back: "/api/placeholder/300/200",
        type: "National ID",
        frontStatus: "approved",
        backStatus: "approved",
        frontApprovedBy: "Admin",
        backApprovedBy: "Admin",
        frontApprovedAt: "2024-01-10",
        backApprovedAt: "2024-01-10",
      },
      selfieProof: {
        document: "/api/placeholder/300/200",
        type: "Selfie with ID",
        status: "approved",
        approvedBy: "Admin",
        approvedAt: "2024-01-10",
      },
      proofOfAddress: {
        document: "/api/placeholder/300/200",
        type: "Bank Statement",
        status: "approved",
        approvedBy: "Admin",
        approvedAt: "2024-01-10",
      },
    },
    customMessages: [
      {
        id: "1",
        date: "2024-01-26",
        message:
          "Congratulations on reaching VIP status! You now have access to premium features and dedicated support.",
        sentBy: "VIP Support",
        status: "read",
      },
    ],
    transactions: [
      {
        id: "T004",
        type: "deposit",
        amount: 35000,
        date: "2024-01-06",
        method: "Wire Transfer",
        status: "completed",
        reference: "DEP-004-2024",
      },
      {
        id: "T005",
        type: "withdrawal",
        amount: 12699.25,
        date: "2024-01-28",
        method: "Wire Transfer",
        status: "completed",
        reference: "WD-004-2024",
      },
    ],
    activityLog: [
      {
        id: "1",
        date: "2024-01-25",
        action: "VIP Account Opened",
        status: "success",
        details: "Upgraded to VIP status",
      },
      {
        id: "2",
        date: "2024-01-10",
        action: "KYC Approved",
        status: "success",
        details: "Verification completed",
      },
      {
        id: "3",
        date: "2024-01-05",
        action: "Registration",
        status: "success",
        details: "Initial signup",
      },
    ],
    accounts: [
      {
        type: "Standard",
        leverage: "1:100",
        balance: 7500.25,
        status: "active",
        accountId: "TRD-004",
        accountType: "real",
        server: "Live-01",
        lastActivity: "2024-01-27 16:20",
      },
      {
        type: "Pro",
        leverage: "1:200",
        balance: 9800.25,
        status: "active",
        accountId: "TRD-005",
        accountType: "real",
        server: "Live-02",
        lastActivity: "2024-01-27 15:10",
      },
      {
        type: "VIP",
        leverage: "1:500",
        balance: 5000.25,
        status: "active",
        accountId: "VIP-004",
        accountType: "real",
        server: "VIP-01",
        lastActivity: "2024-01-27 14:55",
      },
    ],
  },
  {
    id: "C005",
    name: "David Thompson",
    email: "david.thompson@email.com",
    accountId: "ACC-2024-005",
    kycStatus: "pending",
    walletBalance: 3500.0,
    linkedAccounts: 1,
    registrationDate: "2024-03-25",
    phoneNumber: 15550127,
    totalDeposits: 3500,
    totalWithdrawals: 0,
    profit: 125.75,
    kycDocuments: {
      idDocument: {
        front: "/api/placeholder/300/200",
        back: "/api/placeholder/300/200",
        type: "Passport",
        frontStatus: "pending",
        backStatus: "pending",
      },
      selfieProof: {
        document: "/api/placeholder/300/200",
        type: "Selfie with ID",
        status: "pending",
      },
      proofOfAddress: {
        document: "/api/placeholder/300/200",
        type: "Utility Bill",
        status: "pending",
      },
    },
    transactions: [
      {
        id: "T006",
        type: "deposit",
        amount: 3500,
        date: "2024-03-25",
        method: "Bank Transfer",
        status: "completed",
        reference: "DEP-005-2024",
      },
    ],
    activityLog: [
      {
        id: "1",
        date: "2024-03-26",
        action: "KYC Submitted",
        status: "pending",
        details: "Documents under review",
      },
      {
        id: "2",
        date: "2024-03-25",
        action: "Registration",
        status: "success",
        details: "Account created",
      },
    ],
    accounts: [
      {
        type: "Standard",
        leverage: "1:100",
        balance: 3625.75,
        status: "active",
        accountId: "TRD-006",
        accountType: "demo",
        server: "Demo-01",
        lastActivity: "2024-03-26 11:20",
      },
    ],
  },
];
