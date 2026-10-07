import { exportToCSV, exportToPDF, generateExportFilename, formatCurrencyForExport, formatDateForExport, formatStatusForExport } from "./export-utils";
import type { DepositRequest } from "@/pages/DepositRequests";
import type { WithdrawalRequest } from "@/pages/Withdrawals";
import type { Client } from "@/data/clients";

// Deposit Requests Export
export function exportDepositRequests(requests: DepositRequest[], format: "csv" | "pdf") {
  const headers = ["Client Name", "Email", "Amount", "Currency", "Payment Method", "Status", "Submitted Date"];
  const rows = requests.map(request => [
    request.clientName,
    request.email,
    formatCurrencyForExport(request.amount, request.currency),
    request.currency,
    request.paymentMethod.toUpperCase(),
    formatStatusForExport(request.status),
    formatDateForExport(request.submittedAt)
  ]);

  const exportData = {
    headers,
    rows,
    filename: generateExportFilename("deposit_requests")
  };

  if (format === "csv") {
    exportToCSV(exportData);
  } else {
    exportToPDF(exportData);
  }
}

// Withdrawals Export
export function exportWithdrawals(withdrawals: WithdrawalRequest[], format: "csv" | "pdf") {
  const headers = ["Client Name", "Email", "Amount (USD)", "Amount (INR)", "Rate (INR per USD)", "Type", "Balance", "Destination", "Date", "Status"];
  const rows = withdrawals.map(withdrawal => [
    withdrawal.clientName,
    withdrawal.email,
    formatCurrencyForExport(withdrawal.amount, "USD"),
    withdrawal.inrAmount != null ? formatCurrencyForExport(withdrawal.inrAmount, "INR") : "",
    withdrawal.fxRate ?? "",
    withdrawal.type.charAt(0).toUpperCase() + withdrawal.type.slice(1),
    formatCurrencyForExport(withdrawal.clientBalance ?? 0, "USD"),
    withdrawal.destination,
    formatDateForExport(withdrawal.submissionDate),
    formatStatusForExport(withdrawal.status)
  ]);

  const exportData = {
    headers,
    rows,
    filename: generateExportFilename("withdrawals")
  };

  if (format === "csv") {
    exportToCSV(exportData);
  } else {
    exportToPDF(exportData);
  }
}

// Clients Export
export function exportClients(clients: Client[], format: "csv" | "pdf") {
  const headers = ["Name", "Email", "Account ID", "KYC Status", "Wallet Balance", "Linked Accounts", "Registration Date"];
  const rows = clients.map(client => [
    client.name,
    client.email,
    client.accountId,
    formatStatusForExport(client.kycStatus),
    formatCurrencyForExport(client.walletBalance),
    client.linkedAccounts.toString(),
    formatDateForExport(client.registrationDate)
  ]);

  const exportData = {
    headers,
    rows,
    filename: generateExportFilename("clients")
  };

  if (format === "csv") {
    exportToCSV(exportData);
  } else {
    exportToPDF(exportData);
  }
}

// Transactions Export
export function exportTransactions(transactions: any[], format: "csv" | "pdf") {
  const headers = ["Client Name", "Type", "Amount", "Currency", "Payment Method", "Status", "Date"];
  const rows = transactions.map(transaction => [
    transaction.clientName,
    transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1),
    formatCurrencyForExport(transaction.amount, transaction.currency),
    transaction.currency,
    transaction.paymentMethod?.toUpperCase() || "N/A",
    formatStatusForExport(transaction.status),
    formatDateForExport(transaction.date)
  ]);

  const exportData = {
    headers,
    rows,
    filename: generateExportFilename("transactions")
  };

  if (format === "csv") {
    exportToCSV(exportData);
  } else {
    exportToPDF(exportData);
  }
}

// Account Types Export
export function exportAccountTypes(accountTypes: any[], format: "csv" | "pdf") {
  const headers = ["Account Type", "Minimum Deposit", "Leverage", "Commission", "Status"];
  const rows = accountTypes.map(accountType => [
    accountType.name,
    formatCurrencyForExport(accountType.minimumDeposit),
    "1:" + accountType.leverage,
    accountType.commission + "%",
    formatStatusForExport(accountType.status)
  ]);

  const exportData = {
    headers,
    rows,
    filename: generateExportFilename("account_types")
  };

  if (format === "csv") {
    exportToCSV(exportData);
  } else {
    exportToPDF(exportData);
  }
}

// Notifications Export
export function exportNotifications(notifications: any[], format: "csv" | "pdf") {
  const headers = ["Title", "Type", "Recipients", "Status", "Sent Date", "Open Rate"];
  const rows = notifications.map(notification => [
    notification.title,
    notification.type.charAt(0).toUpperCase() + notification.type.slice(1),
    notification.recipients.toString(),
    formatStatusForExport(notification.status),
    formatDateForExport(notification.sentDate),
    notification.openRate + "%"
  ]);

  const exportData = {
    headers,
    rows,
    filename: generateExportFilename("notifications")
  };

  if (format === "csv") {
    exportToCSV(exportData);
  } else {
    exportToPDF(exportData);
  }
}