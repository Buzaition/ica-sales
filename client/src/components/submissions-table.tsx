import { useState } from "react";
import { format } from "date-fns";
import { Edit2, Save, X } from "lucide-react";
import type { Lead, UpdateLeadInput } from "@workspace/shared";
import { useUpdateLead } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type SubmissionsTableProps = {
  submissions: Lead[] | undefined;
  isLoading?: boolean;
  showSalesman?: boolean;
  editable?: boolean;
  emptyMessage?: string;
  onUpdated?: () => void;
};

export function SubmissionsTable({
  submissions,
  isLoading = false,
  showSalesman = false,
  editable = true,
  emptyMessage = "No submissions found",
  onUpdated,
}: SubmissionsTableProps) {
  const updateLead = useUpdateLead();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<UpdateLeadInput>({
    cxName: "",
    cxPhone: "",
    callSummary: "",
  });
  const rows = Array.isArray(submissions) ? submissions : [];

  const startEditing = (submission: Lead) => {
    setEditingId(submission.id);
    setDraft({
      cxName: submission.cxName,
      cxPhone: submission.cxPhone,
      callSummary: submission.callSummary,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setDraft({ cxName: "", cxPhone: "", callSummary: "" });
  };

  const saveEditing = () => {
    if (!editingId) return;

    updateLead.mutate(
      { id: editingId, data: draft },
      {
        onSuccess: () => {
          cancelEditing();
          onUpdated?.();
        },
      },
    );
  };

  const colSpan = showSalesman ? 6 : 5;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-muted/10">
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="w-[180px]">Timestamp</TableHead>
            {showSalesman && <TableHead>Salesman</TableHead>}
            <TableHead>Customer</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead className="max-w-[300px]">Call Summary</TableHead>
            {editable && <TableHead className="w-[120px] text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={colSpan} className="h-32 text-center text-muted-foreground">
                Loading submissions...
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan} className="h-32 text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((submission) => {
              const isEditing = editingId === submission.id;

              return (
                <TableRow key={submission.id} className="border-border/20 hover:bg-muted/20 transition-colors">
                  <TableCell className="font-medium text-muted-foreground text-xs whitespace-nowrap">
                    {format(new Date(submission.timestamp), "MMM d, yyyy HH:mm")}
                  </TableCell>
                  {showSalesman && (
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary/50 text-xs font-medium text-secondary-foreground border border-border/50">
                        {submission.salesman}
                      </span>
                    </TableCell>
                  )}
                  <TableCell className="font-semibold min-w-[180px]" dir="auto">
                    {isEditing ? (
                      <Input
                        className="bg-background/50 border-border/50"
                        value={draft.cxName ?? ""}
                        onChange={(event) => setDraft((value) => ({ ...value, cxName: event.target.value }))}
                      />
                    ) : (
                      submission.cxName
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground min-w-[150px]" dir="auto">
                    {isEditing ? (
                      <Input
                        className="bg-background/50 border-border/50"
                        value={draft.cxPhone ?? ""}
                        onChange={(event) => setDraft((value) => ({ ...value, cxPhone: event.target.value }))}
                      />
                    ) : (
                      submission.cxPhone
                    )}
                  </TableCell>
                  <TableCell
                    className="max-w-[360px] text-muted-foreground"
                    dir="auto"
                    title={submission.callSummary}
                  >
                    {isEditing ? (
                      <Textarea
                        className="min-h-[88px] bg-background/50 border-border/50 resize-y"
                        value={draft.callSummary ?? ""}
                        onChange={(event) => setDraft((value) => ({ ...value, callSummary: event.target.value }))}
                      />
                    ) : (
                      <span className="block truncate">{submission.callSummary}</span>
                    )}
                  </TableCell>
                  {editable && (
                    <TableCell className="text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={saveEditing} disabled={updateLead.isPending}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEditing} disabled={updateLead.isPending}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => startEditing(submission)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
