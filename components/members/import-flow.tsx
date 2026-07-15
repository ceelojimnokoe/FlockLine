"use client";

import { useState, useMemo, useTransition } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { LinkButton } from "@/components/ui/link-button";
import { normalizeGhanaPhone, isValidE164 } from "@/lib/phone";
import { importMembers, type ImportRow, type ImportResult } from "@/app/dashboard/members/import/actions";

const TARGET_FIELDS = [
  { value: "ignore", label: "Ignore this column" },
  { value: "first_name", label: "First name" },
  { value: "last_name", label: "Last name" },
  { value: "phone", label: "Phone" },
  { value: "gender", label: "Gender" },
  { value: "status", label: "Status" },
  { value: "date_of_birth", label: "Date of birth" },
  { value: "address", label: "Address" },
  { value: "notes", label: "Notes" },
] as const;

type TargetField = (typeof TARGET_FIELDS)[number]["value"];

const FIELD_GUESSES: Record<Exclude<TargetField, "ignore">, string[]> = {
  first_name: ["first name", "firstname", "first_name", "given name"],
  last_name: ["last name", "lastname", "last_name", "surname", "family name"],
  phone: ["phone", "phone number", "whatsapp", "mobile", "contact"],
  gender: ["gender", "sex"],
  status: ["status", "membership status"],
  date_of_birth: ["date of birth", "dob", "birthday", "birth date"],
  address: ["address", "location", "residence"],
  notes: ["notes", "note", "comment", "comments"],
};

function guessField(header: string): TargetField {
  const normalized = header.trim().toLowerCase();
  for (const [field, candidates] of Object.entries(FIELD_GUESSES)) {
    if (candidates.includes(normalized)) return field as TargetField;
  }
  return "ignore";
}

type Step = "upload" | "map" | "review" | "result";

type ValidatedRow = {
  rowNumber: number;
  data: ImportRow;
  error: string | null;
};

const VALID_STATUSES = ["first_timer", "new_convert", "member", "inactive"];

export function ImportFlow() {
  const [step, setStep] = useState<Step>("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, TargetField>>({});
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ImportResult | null>(null);
  const [clientErrorCount, setClientErrorCount] = useState(0);

  function handleFile(file: File) {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const fields = results.meta.fields ?? [];
        if (fields.length === 0 || results.data.length === 0) {
          toast.error("Couldn't find any rows in that file.");
          return;
        }
        setHeaders(fields);
        setRawRows(results.data);
        const initialMapping: Record<string, TargetField> = {};
        fields.forEach((header) => (initialMapping[header] = guessField(header)));
        setMapping(initialMapping);
        setStep("map");
      },
      error: () => toast.error("Couldn't read that file. Make sure it's a CSV."),
    });
  }

  const validatedRows: ValidatedRow[] = useMemo(() => {
    if (step !== "review" && step !== "result") return [];

    return rawRows.map((row, index) => {
      const mapped: Record<string, string> = {};
      for (const [header, field] of Object.entries(mapping)) {
        if (field === "ignore") continue;
        mapped[field] = (row[header] ?? "").trim();
      }

      const firstName = mapped.first_name ?? "";
      const lastName = mapped.last_name ?? "";
      const rawPhone = mapped.phone ?? "";
      const normalizedPhone = rawPhone ? normalizeGhanaPhone(rawPhone) : "";

      let error: string | null = null;
      if (!firstName || !lastName) {
        error = "Missing first or last name.";
      } else if (rawPhone && !isValidE164(normalizedPhone)) {
        error = `Invalid phone number: "${rawPhone}".`;
      }

      const status = VALID_STATUSES.includes(mapped.status) ? mapped.status : "first_timer";
      const genderRaw = (mapped.gender ?? "").toLowerCase();
      const gender = genderRaw === "male" || genderRaw === "female" ? genderRaw : null;
      const dob = mapped.date_of_birth ? new Date(mapped.date_of_birth) : null;
      const dateOfBirth =
        dob && !Number.isNaN(dob.getTime()) ? dob.toISOString().slice(0, 10) : null;

      return {
        rowNumber: index + 2, // +1 for the header row, +1 for 1-indexing
        data: {
          firstName,
          lastName,
          phone: normalizedPhone || null,
          gender: gender as "male" | "female" | null,
          status: status as ImportRow["status"],
          dateOfBirth,
          address: mapped.address || null,
          notes: mapped.notes || null,
        },
        error,
      };
    });
  }, [step, rawRows, mapping]);

  const validRows = validatedRows.filter((row) => !row.error);
  const invalidRows = validatedRows.filter((row) => row.error);

  function handleImport() {
    startTransition(async () => {
      setClientErrorCount(invalidRows.length);
      const res = await importMembers(validRows.map((row) => row.data));
      setResult(res);
      setStep("result");
    });
  }

  if (step === "upload") {
    return (
      <div className="space-y-4">
        <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border px-6 py-8 text-center">
          <span className="text-base font-medium text-foreground">Tap to choose a CSV file</span>
          <span className="text-sm text-muted-foreground">or drag and drop</span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
        <a
          href="/members-import-template.csv"
          download
          className="block text-center text-base font-medium text-primary underline underline-offset-4"
        >
          Download a CSV template
        </a>
      </div>
    );
  }

  if (step === "map") {
    return (
      <div className="space-y-4">
        <p className="text-base text-muted-foreground">
          Match your file&apos;s columns to FlockLine fields. {rawRows.length} row(s) found.
        </p>

        <div className="space-y-3">
          {headers.map((header) => (
            <div
              key={header}
              className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
            >
              <span className="truncate text-base font-medium text-foreground">{header}</span>
              <Select
                value={mapping[header]}
                onChange={(e) =>
                  setMapping((prev) => ({ ...prev, [header]: e.target.value as TargetField }))
                }
                className="w-44 shrink-0"
              >
                {TARGET_FIELDS.map((field) => (
                  <option key={field.value} value={field.value}>
                    {field.label}
                  </option>
                ))}
              </Select>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream-200">
              <tr>
                {headers.map((header) => (
                  <th key={header} className="whitespace-nowrap px-3 py-2 font-medium text-foreground">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rawRows.slice(0, 5).map((row, i) => (
                <tr key={i} className="border-t border-border">
                  {headers.map((header) => (
                    <td key={header} className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                      {row[header]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setStep("upload")}>
            Back
          </Button>
          <Button className="flex-1" onClick={() => setStep("review")}>
            Continue
          </Button>
        </div>
      </div>
    );
  }

  if (step === "review") {
    return (
      <div className="space-y-4">
        <p className="text-base text-foreground">
          <span className="font-semibold text-primary-700">{validRows.length}</span> ready to import
          {invalidRows.length > 0 && (
            <>
              , <span className="font-semibold text-destructive">{invalidRows.length}</span> will be
              skipped
            </>
          )}
          .
        </p>

        {invalidRows.length > 0 && (
          <div className="max-h-64 overflow-y-auto rounded-xl border border-destructive/30">
            <table className="w-full text-left text-sm">
              <thead className="bg-destructive/10">
                <tr>
                  <th className="px-3 py-2 font-medium text-destructive">Row</th>
                  <th className="px-3 py-2 font-medium text-destructive">Reason</th>
                </tr>
              </thead>
              <tbody>
                {invalidRows.map((row) => (
                  <tr key={row.rowNumber} className="border-t border-destructive/20">
                    <td className="px-3 py-2 text-muted-foreground">{row.rowNumber}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setStep("map")}>
            Back
          </Button>
          <Button
            className="flex-1"
            disabled={isPending || validRows.length === 0}
            onClick={handleImport}
          >
            {isPending
              ? "Importing…"
              : `Import ${validRows.length} member${validRows.length === 1 ? "" : "s"}`}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 text-center">
        <ResultStat label="Imported" value={result?.imported ?? 0} />
        <ResultStat label="Duplicates skipped" value={result?.skippedDuplicates ?? 0} />
        <ResultStat label="Errors" value={(result?.errors.length ?? 0) + clientErrorCount} />
      </div>

      {result && result.errors.length > 0 && (
        <div className="max-h-64 overflow-y-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <tbody>
              {result.errors.map((err, i) => (
                <tr key={i} className="border-t border-border first:border-t-0">
                  <td className="px-3 py-2 text-muted-foreground">{err.row}</td>
                  <td className="px-3 py-2 text-muted-foreground">{err.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <LinkButton href="/dashboard/members" className="w-full">
        Done
      </LinkButton>
    </div>
  );
}

function ResultStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
