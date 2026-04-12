"use client";

import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAccount, useSignMessage } from "wagmi";
import { useMidnight } from "@/lib/midnight/context";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { uploadEncryptedBlob } from "@/lib/ipfs/upload";
import { useVault } from "@/hooks/useVault";

const diagnoses = [
  "Diabetes",
  "Hypertension",
  "Cancer",
  "Asthma",
  "Chronic Kidney Disease",
  "Heart Failure",
  "Depression",
  "Obesity",
];

const labTests = [
  { name: "HbA1c", unit: "%" },
  { name: "Glucose", unit: "mg/dL" },
  { name: "BP Systolic", unit: "mmHg" },
  { name: "BP Diastolic", unit: "mmHg" },
  { name: "Cholesterol Total", unit: "mg/dL" },
  { name: "LDL", unit: "mg/dL" },
  { name: "HDL", unit: "mg/dL" },
  { name: "eGFR", unit: "mL/min" },
  { name: "Creatinine", unit: "mg/dL" },
  { name: "ALT", unit: "U/L" },
  { name: "AST", unit: "U/L" },
];

const healthSchema = z.object({
  dateOfBirth: z.string().min(1),
  primaryDiagnosis: z.string().min(2),
  secondaryDiagnosis: z.string().optional(),
  biologicalSex: z.enum(["female", "male", "intersex", "other", "prefer_not"]),
  medications: z.string().optional(),
  labValues: z.array(
    z.object({
      name: z.string().min(1),
      value: z.coerce.number().min(0),
      unit: z.string().min(1),
      date: z.string().min(1),
    })
  ),
});

type HealthFormValues = z.infer<typeof healthSchema>;

/**
 * HealthDataForm captures encrypted health info stored only on device.
 */
export function HealthDataForm() {
  const { address: evmAddress } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { displayAddress, hasLace } = useMidnight();
  // Use Lace display address if available, otherwise fall back to EVM address
  const address = displayAddress ?? evmAddress;
  const { saveVault } = useVault();
  const [isSaving, setIsSaving] = useState(false);
  const [encryptedBlob, setEncryptedBlob] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const form = useForm<HealthFormValues>({
    // Cast required: @hookform/resolvers v5 + Zod v4 coerce types differ
    resolver: zodResolver(healthSchema) as Resolver<HealthFormValues>,
    defaultValues: {
      biologicalSex: "prefer_not",
      labValues: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "labValues",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (!address) {
      toast.error("Connect your wallet first");
      return;
    }
    try {
      setIsSaving(true);
      let signature: string;
      let nullifierSignature: string;
      if (hasLace) {
        // Lace wallet: derive deterministic secrets from the display address
        signature = `lace:${address}:encrypt-v1`;
        nullifierSignature = `lace:${address}:nullifier-v1`;
      } else {
        toast("Waiting for wallet signature...");
        signature = await signMessageAsync({ message: "TrialVault encrypt v1" });
        nullifierSignature = await signMessageAsync({ message: "TrialVault nullifier secret v1" });
      }
      const encrypted = await saveVault(values, address, signature, nullifierSignature);
      setEncryptedBlob(encrypted.ciphertext);
      setSavedNotice("Saved locally. ✓ Not uploaded.");
      toast.success("Saved locally. ✓ Not uploaded.");
    } catch (error) {
      toast.error("Failed to save vault");
    } finally {
      setIsSaving(false);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date of birth</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="primaryDiagnosis"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primary diagnosis</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select diagnosis" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {diagnoses.map((diag) => (
                      <SelectItem key={diag} value={diag}>
                        {diag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="secondaryDiagnosis"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Secondary diagnosis</FormLabel>
                <FormControl>
                  <Input placeholder="Optional" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="biologicalSex"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Biological sex</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="intersex">Intersex</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="medications"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current medications</FormLabel>
              <FormControl>
                <Textarea placeholder="Optional" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white">Lab values</h4>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                append({ name: labTests[0].name, value: 0, unit: labTests[0].unit, date: "" })
              }
            >
              Add lab
            </Button>
          </div>
          {fields.map((field, index) => (
            <div key={field.id} className="grid gap-3 rounded-md border border-white/10 bg-black/20 p-3 md:grid-cols-4">
              <Select
                onValueChange={(value: string) => {
                  const test = labTests.find((t) => t.name === value) ?? labTests[0];
                  update(index, { ...form.getValues(`labValues.${index}`), name: value, unit: test.unit });
                }}
                defaultValue={field.name}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Test" />
                </SelectTrigger>
                <SelectContent>
                  {labTests.map((test) => (
                    <SelectItem key={test.name} value={test.name}>
                      {test.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Value"
                {...form.register(`labValues.${index}.value` as const)}
              />
              <Input
                placeholder="Unit"
                {...form.register(`labValues.${index}.unit` as const)}
                readOnly
              />
              <div className="flex gap-2">
                <Input type="date" {...form.register(`labValues.${index}.date` as const)} />
                <Button type="button" variant="ghost" onClick={() => remove(index)}>
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>

      <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={isSaving}>
            Save locally
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!encryptedBlob}
            onClick={async () => {
              if (!encryptedBlob) return;
              try {
                const response = await uploadEncryptedBlob({
                  ciphertext: encryptedBlob,
                  filename: "trialvault-vault.enc",
                });
                toast.success(`Backed up to IPFS: ${response.cid}`);
              } catch {
                toast.error("IPFS upload failed");
              }
            }}
          >
            Backup to IPFS
          </Button>
        </div>
        {savedNotice && <p className="text-xs text-emerald-200">{savedNotice}</p>}
      </form>
    </Form>
  );
}
