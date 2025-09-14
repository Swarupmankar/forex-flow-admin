import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface KycDocumentsProps {
  name: string;
  idDocument?: { front: string; back: string; type: string };
  proofOfAddress?: { document: string; type: string };
}

export function KycDocuments({ name, idDocument, proofOfAddress }: KycDocumentsProps) {
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {idDocument && (
            <div>
              <p className="text-sm font-medium mb-2">ID Document ({idDocument.type})</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setPreview(idDocument.front)} className="hover-scale">
                  <img src={idDocument.front} alt={`${name} ID front - KYC document`} loading="lazy" className="rounded-md border object-cover w-full aspect-[3/2]" />
                </button>
                <button onClick={() => setPreview(idDocument.back)} className="hover-scale">
                  <img src={idDocument.back} alt={`${name} ID back - KYC document`} loading="lazy" className="rounded-md border object-cover w-full aspect-[3/2]" />
                </button>
              </div>
            </div>
          )}
          {proofOfAddress && (
            <div>
              <p className="text-sm font-medium mb-2">Proof of Address ({proofOfAddress.type})</p>
              <button onClick={() => setPreview(proofOfAddress.document)} className="hover-scale">
                <img src={proofOfAddress.document} alt={`${name} proof of address - KYC document`} loading="lazy" className="rounded-md border object-cover w-full aspect-[3/2]" />
              </button>
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="outline">Request Re-upload</Button>
          <Button size="sm" variant="secondary">Download All</Button>
        </div>
      </CardContent>

      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
            <DialogDescription>Click outside to close.</DialogDescription>
          </DialogHeader>
          {preview && (
            <img src={preview} alt={`${name} document preview`} loading="lazy" className="rounded-md border object-contain w-full" />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
