// Canned support replies, written around what this platform actually offers:
// bank / UPI / CoinsBuy crypto funding, the "money leaves the way it came"
// funding-source rule, the flat crypto withdrawal fee, the IB wallet minimum,
// Sumsub KYC, leverage fixed per account type, and engine-side SL / TP /
// stop-out closes.
//
// {{placeholders}} are filled in from the open ticket and the broker's live
// settings when a template is inserted; see fillTemplate.

export type TicketCategory =
  | "ACCOUNTS"
  | "DEPOSITS"
  | "WITHDRAWALS"
  | "VERIFICATION"
  | "TECHNICAL"
  | "OTHERS";

export interface ReplyTemplate {
  id: string;
  title: string;
  /** "GENERAL" templates are offered on every ticket. */
  category: TicketCategory | "GENERAL";
  body: string;
}

export const TEMPLATE_CATEGORY_LABEL: Record<ReplyTemplate["category"], string> = {
  GENERAL: "General",
  ACCOUNTS: "Accounts",
  DEPOSITS: "Deposits",
  WITHDRAWALS: "Withdrawals",
  VERIFICATION: "Verification",
  TECHNICAL: "Technical",
  OTHERS: "Others",
};

export const REPLY_TEMPLATES: ReplyTemplate[] = [
  // ---------- General ----------
  {
    id: "ack",
    category: "GENERAL",
    title: "Acknowledge ticket",
    body:
      "Hi {{clientName}},\n\nThank you for contacting {{brokerName}} support. We have received your request (ticket #{{ticketId}}) and our team is looking into it. We will update you here as soon as we have more information.\n\nBest regards,\n{{agentName}}",
  },
  {
    id: "need-info",
    category: "GENERAL",
    title: "Ask for more details",
    body:
      "Hi {{clientName}},\n\nTo help us resolve this quickly, could you please share a few more details:\n• Your trading account number (if this is about an account)\n• The date and time the issue happened\n• A screenshot of the screen or error you saw\n\nYou can attach the screenshot directly to this ticket.\n\nThanks,\n{{agentName}}",
  },
  {
    id: "follow-up",
    category: "GENERAL",
    title: "Follow-up (no response)",
    body:
      "Hi {{clientName}},\n\nWe are following up on ticket #{{ticketId}}. We have not heard back from you yet. If you still need help, simply reply here. If we do not hear back, we will mark this ticket as resolved.\n\nBest regards,\n{{agentName}}",
  },
  {
    id: "resolved",
    category: "GENERAL",
    title: "Resolved & closing",
    body:
      "Hi {{clientName}},\n\nWe are glad your issue has been resolved. We will now close ticket #{{ticketId}}. If anything else comes up, you can open a new ticket at any time.\n\nThank you for trading with {{brokerName}}.\n{{agentName}}",
  },

  // ---------- Deposits ----------
  {
    id: "deposit-processing",
    category: "DEPOSITS",
    title: "Deposit received – processing",
    body:
      "Hi {{clientName}},\n\nWe have received your deposit request and it is now being verified by our finance team. Bank and UPI deposits are credited once the payment is confirmed against the UTR / reference number you provided. You will be notified as soon as the funds are added to your wallet.\n\nBest regards,\n{{agentName}}",
  },
  {
    id: "deposit-proof",
    category: "DEPOSITS",
    title: "Deposit – need payment proof",
    body:
      "Hi {{clientName}},\n\nWe could not match your deposit with a payment yet. Please reply with:\n• The UTR / transaction reference number\n• A screenshot of the successful payment from your bank or UPI app\n• The exact amount and the time of payment\n\nOnce we receive these, we will verify and credit your wallet.\n\nThanks,\n{{agentName}}",
  },
  {
    id: "deposit-credited",
    category: "DEPOSITS",
    title: "Deposit approved & credited",
    body:
      "Hi {{clientName}},\n\nGood news! Your deposit has been approved and credited to your wallet. You can now transfer the funds to any of your trading accounts from the client portal.\n\nHappy trading,\n{{agentName}}",
  },
  {
    id: "deposit-crypto",
    category: "DEPOSITS",
    title: "Crypto deposit – awaiting confirmations",
    body:
      "Hi {{clientName}},\n\nCrypto deposits are credited automatically once the transaction receives the required number of confirmations on the blockchain network. This usually takes a few minutes, but can take longer when the network is busy.\n\nPlease make sure you sent the coin on the same network shown on your deposit address. If it has been more than an hour, reply with the transaction hash (TxID) and we will check it for you.\n\nBest regards,\n{{agentName}}",
  },
  {
    id: "deposit-rejected",
    category: "DEPOSITS",
    title: "Deposit rejected – details mismatch",
    body:
      "Hi {{clientName}},\n\nYour deposit request could not be approved because the payment details did not match our records (amount, reference number or sender name). No funds were credited.\n\nIf you believe this is a mistake, please reply with the payment screenshot and UTR number, and we will review it again.\n\nBest regards,\n{{agentName}}",
  },

  // ---------- Withdrawals ----------
  {
    id: "withdrawal-processing",
    category: "WITHDRAWALS",
    title: "Withdrawal in process",
    body:
      "Hi {{clientName}},\n\nYour withdrawal request has been received and is being processed by our finance team. You will receive a notification once the payout has been sent.\n\nBest regards,\n{{agentName}}",
  },
  {
    id: "withdrawal-completed",
    category: "WITHDRAWALS",
    title: "Withdrawal completed",
    body:
      "Hi {{clientName}},\n\nYour withdrawal has been processed and the payout has been sent. Bank transfers can take a short while to reflect depending on your bank. For crypto payouts, you can track the transfer on the blockchain using the transaction hash shown in your transaction history.\n\nBest regards,\n{{agentName}}",
  },
  {
    id: "withdrawal-funding-source",
    category: "WITHDRAWALS",
    title: "Funding source rule",
    body:
      "Hi {{clientName}},\n\nFor your security, funds are withdrawn the same way they were deposited. Money deposited via bank / UPI goes back to your bank, and crypto deposits are withdrawn to crypto. A trading account that holds funds can only be topped up from, and emptied back to, the wallet it was funded from.\n\nPlease submit your withdrawal using the same method you used to deposit.\n\nBest regards,\n{{agentName}}",
  },
  {
    id: "withdrawal-crypto-fee",
    category: "WITHDRAWALS",
    title: "Crypto withdrawal fee",
    body:
      "Hi {{clientName}},\n\nEvery crypto withdrawal carries a flat service fee of {{cryptoWithdrawFee}}, which covers the processing and network costs. The fee is deducted from the requested amount before the payout is created, so the amount you receive will be your requested amount minus {{cryptoWithdrawFee}}.\n\nBest regards,\n{{agentName}}",
  },
  {
    id: "withdrawal-ib-min",
    category: "WITHDRAWALS",
    title: "IB wallet minimum withdrawal",
    body:
      "Hi {{clientName}},\n\nThe minimum withdrawal from the IB commission wallet is {{ibMinWithdraw}}. Once your IB wallet balance reaches this amount, you can request a withdrawal from the IB portal.\n\nBest regards,\n{{agentName}}",
  },
  {
    id: "withdrawal-rejected",
    category: "WITHDRAWALS",
    title: "Withdrawal rejected",
    body:
      "Hi {{clientName}},\n\nYour withdrawal request could not be processed. The amount has been returned to your wallet. This usually happens when the payout details (bank account, UPI ID or crypto address) are incorrect, or when the withdrawal method does not match how the funds were deposited.\n\nPlease check your details and submit a new request. Reply here if you need help.\n\nBest regards,\n{{agentName}}",
  },

  // ---------- Verification ----------
  {
    id: "kyc-how-to",
    category: "VERIFICATION",
    title: "How to complete KYC",
    body:
      "Hi {{clientName}},\n\nIdentity verification is done securely through our partner Sumsub. To complete it, open the client portal, go to the verification section and follow the steps. You will need:\n• A valid government-issued photo ID\n• A selfie / liveness check on your phone or webcam\n\nVerification is usually completed within a few minutes once all documents are submitted.\n\nBest regards,\n{{agentName}}",
  },
  {
    id: "kyc-under-review",
    category: "VERIFICATION",
    title: "KYC under review",
    body:
      "Hi {{clientName}},\n\nYour verification documents have been submitted and are currently under review. You will be notified as soon as the review is complete. No further action is needed from you right now.\n\nBest regards,\n{{agentName}}",
  },
  {
    id: "kyc-rejected",
    category: "VERIFICATION",
    title: "KYC rejected – resubmit",
    body:
      "Hi {{clientName}},\n\nUnfortunately your verification could not be approved. This usually happens when a photo is blurry, cropped, has glare, or the document has expired. Please restart the verification from the client portal and make sure:\n• All four corners of the document are visible\n• The text is sharp and readable\n• The document is valid and not expired\n\nBest regards,\n{{agentName}}",
  },
  {
    id: "kyc-approved",
    category: "VERIFICATION",
    title: "KYC approved",
    body:
      "Hi {{clientName}},\n\nYour identity has been verified successfully. Your account is now fully active and you can deposit, trade and withdraw without restrictions.\n\nWelcome to {{brokerName}}!\n{{agentName}}",
  },

  // ---------- Accounts ----------
  {
    id: "account-open",
    category: "ACCOUNTS",
    title: "Opening a trading account",
    body:
      "Hi {{clientName}},\n\nYou can open a new trading account from the client portal under Accounts. Choose the account type that suits you: each type has its own minimum deposit, leverage and commission. After the account is created, transfer funds from your wallet to start trading.\n\nBest regards,\n{{agentName}}",
  },
  {
    id: "account-leverage",
    category: "ACCOUNTS",
    title: "Leverage is set by account type",
    body:
      "Hi {{clientName}},\n\nLeverage on our platform is fixed by the account type and cannot be changed on an individual account. If you need a different leverage, you can open a new trading account on an account type that offers it.\n\nBest regards,\n{{agentName}}",
  },
  {
    id: "account-commission",
    category: "ACCOUNTS",
    title: "Commission explained",
    body:
      "Hi {{clientName}},\n\nCommission is charged on each trade according to your account type's commission rate and is shown on every order in your trade history. Different account types have different commission and spread conditions, which are listed when you open an account.\n\nBest regards,\n{{agentName}}",
  },
  {
    id: "account-archived",
    category: "ACCOUNTS",
    title: "Account archived",
    body:
      "Hi {{clientName}},\n\nYour trading account is currently archived, so it cannot open new positions. If you would like it reactivated, please confirm here and we will enable it for you.\n\nBest regards,\n{{agentName}}",
  },
  {
    id: "account-reactivated",
    category: "ACCOUNTS",
    title: "Account reactivated",
    body:
      "Hi {{clientName}},\n\nYour trading account has been reactivated. You can log in and trade as usual.\n\nBest regards,\n{{agentName}}",
  },
  {
    id: "account-login",
    category: "ACCOUNTS",
    title: "Trading login issue",
    body:
      "Hi {{clientName}},\n\nPlease make sure you are logging in with your trading account number (not your email) and the trading password for that account. If you have forgotten the trading password, you can reset it from the client portal under Accounts.\n\nIf the problem continues, reply with your trading account number and a screenshot of the error.\n\nBest regards,\n{{agentName}}",
  },

  // ---------- Technical ----------
  {
    id: "tech-ack",
    category: "TECHNICAL",
    title: "Technical issue acknowledged",
    body:
      "Hi {{clientName}},\n\nThank you for reporting this. Our technical team is investigating the issue. In the meantime, please try:\n• Logging out and back in\n• Clearing your browser cache or updating the app\n• Switching to another network\n\nWe will update you here as soon as we have more information.\n\nBest regards,\n{{agentName}}",
  },
  {
    id: "tech-stop-out",
    category: "TECHNICAL",
    title: "Stop-out explained",
    body:
      "Hi {{clientName}},\n\nYour position was closed automatically by a stop-out. This happens when your account's margin level falls below the stop-out level, to prevent the balance from going negative. The margin level at the time of closing is recorded on the trade in your history.\n\nTo reduce the risk of a stop-out, keep enough free margin in the account or use a stop loss on your positions.\n\nBest regards,\n{{agentName}}",
  },
  {
    id: "tech-sl-tp",
    category: "TECHNICAL",
    title: "SL / TP execution explained",
    body:
      "Hi {{clientName}},\n\nYour position was closed because the price reached the stop loss / take profit level you set. You are credited at the level you chose; the close reason is shown on the trade in your history.\n\nIf you believe the close price is incorrect, please reply with the trade details and we will review it.\n\nBest regards,\n{{agentName}}",
  },

  // ---------- Others ----------
  {
    id: "ib-program",
    category: "OTHERS",
    title: "IB / partner programme",
    body:
      "Hi {{clientName}},\n\nThank you for your interest in our IB programme. As an IB you earn commission on every lot your referred clients trade, credited to your IB wallet. You can share your referral link from the IB portal, and your tier (and rates) improve as your clients' volume grows.\n\nThe minimum withdrawal from the IB wallet is {{ibMinWithdraw}}.\n\nBest regards,\n{{agentName}}",
  },
];

export interface TemplateVars {
  clientName: string;
  ticketId: string;
  agentName: string;
  brokerName: string;
  cryptoWithdrawFee: string;
  ibMinWithdraw: string;
}

/** Replaces each {{name}} with its value; unknown names are left visible. */
export const fillTemplate = (body: string, vars: TemplateVars) =>
  body.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    key in vars ? vars[key as keyof TemplateVars] : match
  );

/** Templates for a ticket's category first, then general ones. */
export const suggestedTemplates = (category?: string) => {
  const c = (category ?? "").toUpperCase();
  return [
    ...REPLY_TEMPLATES.filter((t) => t.category === c),
    ...REPLY_TEMPLATES.filter((t) => t.category === "GENERAL"),
  ];
};
