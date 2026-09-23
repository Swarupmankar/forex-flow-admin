import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, Building2, CheckCircle2, History, Loader2, QrCode, RotateCcw, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  apiErrorMessage,
  useGetPaymentDetailsHistoryQuery,
  useGetPaymentDetailsQuery,
  useUpdatePaymentDetailsMutation,
  type BankDetailsPayload,
  type PaymentDetails,
} from "@/API/paymentDetails.api";

/**
 * Payment Setup: the bank account and UPI ID this broker's clients pay into for
 * bank / UPI deposits.
 *
 * The backend keeps ONE record per broker, so each method is edited in place:
 * Save replaces it, Remove clears it (clients then stop seeing that method).
 * What is saved here is exactly what clients see on the deposit screen — bank
 * details to copy, and a UPI QR code generated from the UPI ID.
 *
 * Formats match what the backend accepts, so an error shows next to the field
 * instead of after saving.
 */

const UPI_ID_PATTERN = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,63}$/;
const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const BANK_ACCOUNT_NO_PATTERN = /^\d{9,18}$/;
const BANK_NAME_PATTERN = /^[A-Za-z][A-Za-z .&()'-]{1,99}$/;
const HOLDER_NAME_PATTERN = /^[A-Za-z][A-Za-z .&()'/,-]{1,99}$/;

const upiError = (v: string) =>
  !v.trim() ? "Enter the UPI ID." : UPI_ID_PATTERN.test(v.trim()) ? "" : "A UPI ID looks like name@bank.";

const bankErrors = (b: BankDetailsPayload) => ({
  accountHolderName: !b.accountHolderName.trim()
    ? "Enter the account holder name."
    : HOLDER_NAME_PATTERN.test(b.accountHolderName.trim()) ? "" : "Use letters, spaces and . & ( ) ' / , - only.",
  bankName: !b.bankName.trim()
    ? "Enter the bank name."
    : BANK_NAME_PATTERN.test(b.bankName.trim()) ? "" : "Use letters, spaces and . & ( ) ' - only.",
  bankAccountNo: !b.bankAccountNo.trim()
    ? "Enter the account number."
    : BANK_ACCOUNT_NO_PATTERN.test(b.bankAccountNo.trim()) ? "" : "The account number is 9–18 digits.",
  bankIfscCode: !b.bankIfscCode.trim()
    ? "Enter the IFSC code."
    : IFSC_PATTERN.test(b.bankIfscCode.trim().toUpperCase()) ? "" : "An IFSC code is 11 characters, like HDFC0001234.",
});

const bankFrom = (d?: PaymentDetails): BankDetailsPayload => ({
  bankName: d?.bankName ?? "",
  accountHolderName: d?.accountHolderName ?? "",
  bankAccountNo: d?.bankAccountNo ?? "",
  bankIfscCode: d?.bankIfscCode ?? "",
});
const bankIsSet = (d?: PaymentDetails) =>
  Boolean(d?.bankName && d?.bankAccountNo && d?.bankIfscCode);

const maskAccount = (v: string) => (v ? `${"•".repeat(Math.max(v.length - 4, 0))}${v.slice(-4)}` : "—");
const formatDate = (v?: string | null) =>
  v ? new Date(v).toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

function FieldError({ id, message }: { id: string; message: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs text-destructive mt-1.5 flex items-center gap-1">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  );
}

function StatusBadge({ live }: { live: boolean }) {
  return live ? (
    <Badge className="gap-1"><CheckCircle2 className="h-3 w-3" />Live for clients</Badge>
  ) : (
    <Badge variant="secondary">Not set up</Badge>
  );
}

/* ── UPI ── */
function UpiCard({ details }: { details: PaymentDetails }) {
  const { toast } = useToast();
  const [update, { isLoading: saving }] = useUpdatePaymentDetailsMutation();
  const saved = details.upiId ?? "";
  const [upiId, setUpiId] = useState(saved);
  const [attempted, setAttempted] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  // Follow the server whenever the saved value changes (after a save, or a
  // save from another tab), unless the user is mid-edit.
  const dirty = upiId.trim() !== saved;
  useEffect(() => {
    if (!dirty) setUpiId(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved]);

  const error = upiId || attempted ? upiError(upiId) : "";

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    if (upiError(upiId) || saving) return;
    try {
      await update({ upiId: upiId.trim() }).unwrap();
      setAttempted(false);
      toast({ title: "UPI ID saved", description: "Clients now see this UPI ID and its QR code on the deposit screen." });
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't save the UPI ID", description: apiErrorMessage(err, "Please try again.") });
    }
  };

  const remove = async () => {
    try {
      await update({ upiId: "" }).unwrap();
      setUpiId("");
      setAttempted(false);
      toast({ title: "UPI removed", description: "Clients can no longer choose UPI for deposits." });
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't remove UPI", description: apiErrorMessage(err, "Please try again.") });
    } finally {
      setConfirmRemove(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted/50"><QrCode className="h-5 w-5" /></div>
          <div>
            <CardTitle className="text-lg">UPI</CardTitle>
            <CardDescription>Clients scan a QR code generated from this ID.</CardDescription>
          </div>
        </div>
        <StatusBadge live={Boolean(saved)} />
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={save} className="space-y-4">
          <div>
            <Label htmlFor="pg-upi-id">UPI ID</Label>
            <Input
              id="pg-upi-id"
              placeholder="business@okhdfcbank"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value.trim())}
              autoComplete="off"
              spellCheck={false}
              disabled={saving}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "pg-upi-id-error" : "pg-upi-id-hint"}
            />
            {error ? (
              <FieldError id="pg-upi-id-error" message={error} />
            ) : (
              <p id="pg-upi-id-hint" className="text-xs text-muted-foreground mt-1.5">
                Use a UPI ID registered to the business account that receives deposits.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={saving || !dirty}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : saved ? "Update UPI ID" : "Save UPI ID"}
            </Button>
            {dirty && saved && (
              <Button type="button" variant="ghost" disabled={saving} onClick={() => { setUpiId(saved); setAttempted(false); }}>
                <RotateCcw className="h-4 w-4 mr-2" />Discard changes
              </Button>
            )}
            {saved && (
              <Button type="button" variant="ghost" disabled={saving} onClick={() => setConfirmRemove(true)} className="ml-auto text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4 mr-2" />Remove
              </Button>
            )}
          </div>
        </form>
      </CardContent>

      <AlertDialog open={confirmRemove} onOpenChange={(open) => !saving && setConfirmRemove(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove UPI?</AlertDialogTitle>
            <AlertDialogDescription>
              Clients will no longer see {saved} or its QR code, and won't be able to choose UPI for deposits. Deposits already submitted are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={saving} onClick={(e) => { e.preventDefault(); remove(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {saving ? "Removing…" : "Remove UPI"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

/* ── Bank account ── */
function BankCard({ details }: { details: PaymentDetails }) {
  const { toast } = useToast();
  const [update, { isLoading: saving }] = useUpdatePaymentDetailsMutation();
  const saved = useMemo(() => bankFrom(details), [details]);
  const live = bankIsSet(details);
  const [form, setForm] = useState<BankDetailsPayload>(saved);
  const [attempted, setAttempted] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const normalized: BankDetailsPayload = {
    bankName: form.bankName.trim(),
    accountHolderName: form.accountHolderName.trim(),
    bankAccountNo: form.bankAccountNo.trim(),
    bankIfscCode: form.bankIfscCode.trim().toUpperCase(),
  };
  const dirty = (Object.keys(saved) as (keyof BankDetailsPayload)[]).some((k) => normalized[k] !== saved[k]);

  useEffect(() => {
    if (!dirty) setForm(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved]);

  const allErrors = bankErrors(form);
  const shown = (k: keyof BankDetailsPayload) => (form[k] || attempted ? allErrors[k] : "");
  const set = (k: keyof BankDetailsPayload, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    const firstBad = (Object.keys(allErrors) as (keyof BankDetailsPayload)[]).find((k) => allErrors[k]);
    if (firstBad) {
      document.getElementById(`pg-bank-${firstBad}`)?.focus();
      return;
    }
    if (saving) return;
    try {
      await update(normalized).unwrap();
      setAttempted(false);
      toast({ title: "Bank account saved", description: "Clients now see these bank details on the deposit screen." });
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't save the bank account", description: apiErrorMessage(err, "Please try again.") });
    }
  };

  const remove = async () => {
    try {
      await update({ bankName: "", accountHolderName: "", bankAccountNo: "", bankIfscCode: "" }).unwrap();
      setForm({ bankName: "", accountHolderName: "", bankAccountNo: "", bankIfscCode: "" });
      setAttempted(false);
      toast({ title: "Bank account removed", description: "Clients can no longer choose bank transfer for deposits." });
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't remove the bank account", description: apiErrorMessage(err, "Please try again.") });
    } finally {
      setConfirmRemove(false);
    }
  };

  const field = (
    key: keyof BankDetailsPayload,
    label: string,
    placeholder: string,
    hint: string,
    transform: (v: string) => string = (v) => v,
    extra: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => {
    const id = `pg-bank-${key}`;
    const err = shown(key);
    return (
      <div>
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          placeholder={placeholder}
          value={form[key]}
          onChange={(e) => set(key, transform(e.target.value))}
          autoComplete="off"
          spellCheck={false}
          disabled={saving}
          aria-invalid={Boolean(err)}
          aria-describedby={err ? `${id}-error` : `${id}-hint`}
          {...extra}
        />
        {err ? <FieldError id={`${id}-error`} message={err} /> : <p id={`${id}-hint`} className="text-xs text-muted-foreground mt-1.5">{hint}</p>}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted/50"><Building2 className="h-5 w-5" /></div>
          <div>
            <CardTitle className="text-lg">Bank account</CardTitle>
            <CardDescription>Clients pay by NEFT, RTGS or IMPS to this account.</CardDescription>
          </div>
        </div>
        <StatusBadge live={live} />
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {field("accountHolderName", "Account holder name", "Movement Markets Pvt Ltd", "Exactly as registered with the bank.", (v) => v, { maxLength: 100 })}
            {field("bankName", "Bank name", "HDFC Bank", "The bank that holds the account.", (v) => v, { maxLength: 100 })}
            {field("bankAccountNo", "Account number", "9–18 digits", "Digits only.", (v) => v.replace(/\D/g, "").slice(0, 18), { inputMode: "numeric" })}
            {field("bankIfscCode", "IFSC code", "HDFC0001234", "11 characters, from the cheque book or passbook.", (v) => v.replace(/[^A-Za-z0-9]/g, "").slice(0, 11).toUpperCase(), { autoCapitalize: "characters" })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={saving || !dirty}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : live ? "Update bank account" : "Save bank account"}
            </Button>
            {dirty && live && (
              <Button type="button" variant="ghost" disabled={saving} onClick={() => { setForm(saved); setAttempted(false); }}>
                <RotateCcw className="h-4 w-4 mr-2" />Discard changes
              </Button>
            )}
            {live && (
              <Button type="button" variant="ghost" disabled={saving} onClick={() => setConfirmRemove(true)} className="ml-auto text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4 mr-2" />Remove
              </Button>
            )}
          </div>
        </form>
      </CardContent>

      <AlertDialog open={confirmRemove} onOpenChange={(open) => !saving && setConfirmRemove(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove bank account?</AlertDialogTitle>
            <AlertDialogDescription>
              Clients will no longer see {saved.bankName} ({maskAccount(saved.bankAccountNo)}) and won't be able to choose bank transfer for deposits. Deposits already submitted are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={saving} onClick={(e) => { e.preventDefault(); remove(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {saving ? "Removing…" : "Remove bank account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

/* ── History ── */
function ChangeHistory() {
  const { data, isLoading, isError, error, refetch, isFetching } = useGetPaymentDetailsHistoryQuery();
  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Couldn't load the change history</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center gap-3">
          {apiErrorMessage(error, "Please try again.")}
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>{isFetching ? "Retrying…" : "Try again"}</Button>
        </AlertDescription>
      </Alert>
    );
  }
  const rows = data ?? [];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><History className="h-5 w-5" />Change history</CardTitle>
        <CardDescription>Each row is the set of details that was replaced, and when.</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No changes yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Replaced on</TableHead>
                  <TableHead>UPI ID</TableHead>
                  <TableHead>Account holder</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Account no.</TableHead>
                  <TableHead>IFSC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(r.createdAt)}</TableCell>
                    <TableCell className="font-mono text-xs">{r.upiId || "—"}</TableCell>
                    <TableCell>{r.accountHolderName || "—"}</TableCell>
                    <TableCell>{r.bankName || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{maskAccount(r.bankAccountNo)}</TableCell>
                    <TableCell className="font-mono text-xs">{r.bankIfscCode || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const PaymentSetup = () => {
  const { data, isLoading, isError, error, refetch, isFetching } = useGetPaymentDetailsQuery();
  const liveCount = data ? Number(Boolean(data.upiId)) + Number(bankIsSet(data)) : 0;

  return (
    <DashboardLayout title="Payment Setup">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Payment Setup</h1>
          <p className="text-muted-foreground">
            The UPI ID and bank account your clients pay into for bank / UPI deposits.
          </p>
        </div>

        <Tabs defaultValue="methods" className="space-y-6">
          <TabsList>
            <TabsTrigger value="methods">Payment methods</TabsTrigger>
            <TabsTrigger value="history">Change history</TabsTrigger>
          </TabsList>

          <TabsContent value="methods" className="space-y-6">
            {isLoading ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : isError || !data ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Couldn't load your payment details</AlertTitle>
                <AlertDescription className="flex flex-wrap items-center gap-3">
                  {apiErrorMessage(error, "Please try again.")}
                  <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>{isFetching ? "Retrying…" : "Try again"}</Button>
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {liveCount === 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Bank / UPI deposits are off</AlertTitle>
                    <AlertDescription>
                      Clients can't deposit by bank transfer or UPI until you add at least one method below.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="grid gap-6 lg:grid-cols-2 items-start">
                  <UpiCard details={data} />
                  <BankCard details={data} />
                </div>
                {data.updatedAt && (
                  <p className="text-xs text-muted-foreground">Last updated {formatDate(data.updatedAt)}</p>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="history">
            <ChangeHistory />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default PaymentSetup;
