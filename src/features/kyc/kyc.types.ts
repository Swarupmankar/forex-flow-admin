export type KycStatus = "PENDING" | "APPROVED" | "REJECTED" | string;

export interface KycUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

export interface KycRecord {
  id: number;
  userId: number;
  status: KycStatus;
  verified: boolean;
  rejectionReason: string | null;
  reviewedAt: string | null;

  passportFront: string | null;
  passportBack: string | null;
  selfieWithId: string | null;
  utilityBill: string | null;
  address: string | null;

  passportFrontStatus: KycStatus;
  passportBackStatus: KycStatus;
  selfieWithIdStatus: KycStatus;
  utilityBillStatus: KycStatus;

  passportFrontRejectionReason: string | null;
  passportBackRejectionReason: string | null;
  selfieWithIdRejectionReason: string | null;
  utilityBillRejectionReason: string | null;

  createdAt: string;
  updatedAt: string;
  user: KycUser;
  overallStatus: KycStatus;
}

export interface KycResponse {
  message: string;
  data: { kyc: KycRecord };
}

/** --- New: actions & request bodies for review/delete --- */
export type KycDocType =
  | "passportFront"
  | "passportBack"
  | "selfieWithId"
  | "utilityBill";

export type KycReviewAction = "APPROVE" | "REJECT";

export interface KycReviewRequestBody {
  documentType: KycDocType;
  action: KycReviewAction;
  rejectionReason?: string;
}

export interface KycDeleteRequestBody {
  docType: KycDocType;
}

/** Server typically returns updated record or a message — keep flexible */
export interface KycActionResponse {
  message?: string;
  data?: { kyc?: KycRecord };
}
