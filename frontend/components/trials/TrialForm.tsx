"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { runTxStatus } from "@/lib/tx";
import { createTrial } from "@/lib/demo/trialService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { sha256Hex } from "@/lib/crypto/hash";
import type { Trial } from "@/types/trial";

const trialSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  phase: z.enum(["Phase I", "Phase II", "Phase III", "Phase IV"]),
  indication: z.string().min(2),
  sponsor: z.string().min(2),
  enrollmentTarget: z.number().min(1),
  startDate: z.string().min(1),
  minAge: z.number().min(0),
  maxAge: z.number().min(0),
  diagnosisCode: z.number().min(1),
  labMin1: z.number().min(0),
  labMax1: z.number().min(0),
  labMin2: z.number().optional(),
  labMax2: z.number().optional(),
  exclusionCriteria: z.string().optional(),
  protocolHash: z.string().optional(),
  protocolConfirmed: z.boolean().optional(),
});

type TrialFormValues = z.infer<typeof trialSchema>;

/**
 * TrialForm collects protocol metadata without exposing patient data.
 * Step 3 hashes the SAP PDF client-side — only the hash is submitted on-chain.
 */
export function TrialForm() {
  const [step, setStep] = useState(1);
  const [protocolHash, setProtocolHash] = useState<string | null>(null);
  const [createdTrial, setCreatedTrial] = useState<Trial | null>(null);
  const router = useRouter();

  const form = useForm<TrialFormValues>({
    // Cast required: @hookform/resolvers v5 + Zod v4 coerce types differ
    resolver: zodResolver(trialSchema) as Resolver<TrialFormValues>,
    defaultValues: {
      phase: "Phase II",
      enrollmentTarget: 0,
      minAge: 0,
      maxAge: 65,
      diagnosisCode: 0,
      labMin1: 0,
      labMax1: 0,
    },
  });

  const progress = (step / 4) * 100;

  async function handleProtocolUpload(file: File) {
    const buffer = await file.arrayBuffer();
    const hash = await sha256Hex(new Uint8Array(buffer));
    setProtocolHash(hash);
    form.setValue("protocolHash", hash);
    toast.success("Protocol hash computed");
  }

  async function onSubmit(values: TrialFormValues) {
    await runTxStatus();
    const trial = createTrial({
      name: values.name,
      description: values.description,
      phase: values.phase,
      indication: values.indication,
      sponsor: values.sponsor,
      enrollmentTarget: values.enrollmentTarget,
      startDate: values.startDate,
      protocolHash: values.protocolHash ?? "0xpending",
      criteria: {
        minAge: values.minAge,
        maxAge: values.maxAge,
        diagnosisCode: values.diagnosisCode,
        labMin1: values.labMin1,
        labMax1: values.labMax1,
      },
    });
    setCreatedTrial(trial);
    toast.success(`Trial created — ID: ${trial.id.toString()}`);
  }

  return (
    <Card className="border-white/10 bg-white/5 p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Create Trial</h2>
          <span className="text-sm text-muted-foreground">Step {step} of 4</span>
        </div>
        <Progress value={progress} className="mt-4" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {step === 1 && (
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trial name</FormLabel>
                    <FormControl>
                      <Input placeholder="Trial name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Trial description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="phase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phase</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select phase" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {["Phase I", "Phase II", "Phase III", "Phase IV"].map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="indication"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Indication</FormLabel>
                      <FormControl>
                        <Input placeholder="Disease / condition" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="sponsor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sponsor</FormLabel>
                      <FormControl>
                        <Input placeholder="Sponsor name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="enrollmentTarget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Enrollment target</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="240"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trial start date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4">
              <p className="rounded-md border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                🔒 These criteria are hashed before submission. Patients see only whether
                they match — never the exact values.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="minAge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum age — {field.value}</FormLabel>
                      <FormControl>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          className="mt-2 w-full accent-brand-mint"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxAge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum age — {field.value}</FormLabel>
                      <FormControl>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          className="mt-2 w-full accent-brand-mint"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="diagnosisCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required diagnosis code (ICD-10)</FormLabel>
                    <FormControl>
                      <Input
                        list="icd10-list"
                        type="number"
                        placeholder="250"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <datalist id="icd10-list">
                      <option value="250">Diabetes</option>
                      <option value="401">Hypertension</option>
                      <option value="140">Cancer</option>
                      <option value="493">Asthma</option>
                      <option value="585">Chronic Kidney Disease</option>
                      <option value="428">Heart Failure</option>
                      <option value="311">Depression</option>
                      <option value="278">Obesity</option>
                    </datalist>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="labMin1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lab value 1 min</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="6"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="labMax1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lab value 1 max</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="9"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="exclusionCriteria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exclusion criteria (informational)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g. Prior GLP-1 therapy, severe renal impairment" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4">
              <div>
                <FormLabel>Upload Statistical Analysis Plan (PDF)</FormLabel>
                <Input
                  type="file"
                  accept="application/pdf"
                  className="mt-2"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) await handleProtocolUpload(file);
                  }}
                />
              </div>
              <div className="rounded-md border border-white/10 bg-black/30 p-3 text-sm font-mono text-muted-foreground break-all">
                Protocol hash: {protocolHash ?? "Awaiting upload…"}
              </div>
              <p className="text-xs text-muted-foreground">
                SHA-256 computed client-side. The PDF never leaves your device.
              </p>
              <label className="flex items-start gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  className="mt-1"
                  {...form.register("protocolConfirmed")}
                />
                I confirm this protocol hash will be committed on-chain before enrollment
                opens. I understand I cannot change the primary endpoints after this point.
              </label>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 text-sm text-muted-foreground">
              <p className="text-white font-medium">Review summary</p>
              <div className="rounded-md border border-white/10 bg-black/20 p-4 space-y-1">
                <p><span className="text-white">Trial:</span> {form.getValues("name")}</p>
                <p><span className="text-white">Phase:</span> {form.getValues("phase")}</p>
                <p><span className="text-white">Indication:</span> {form.getValues("indication")}</p>
                <p><span className="text-white">Sponsor:</span> {form.getValues("sponsor")}</p>
                <p><span className="text-white">Enrollment target:</span> {form.getValues("enrollmentTarget")}</p>
                <p><span className="text-white">Age range:</span> {form.getValues("minAge")}–{form.getValues("maxAge")}</p>
                <p><span className="text-white">Protocol hash:</span> {protocolHash ?? "Pending"}</p>
                <p><span className="text-white">Gas estimate:</span> 0.012 DUST</p>
              </div>
              {createdTrial && (
                <div className="rounded-md border border-emerald-400/30 bg-emerald-500/10 p-4 text-emerald-200 space-y-2">
                  <p className="font-semibold">✓ Trial created on-chain</p>
                  <p>Trial ID: {createdTrial.id.toString()}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/pharma/trials/${createdTrial.id.toString()}`)}
                  >
                    View trial →
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
            >
              Back
            </Button>
            {step < 4 ? (
              <Button type="button" onClick={() => setStep((s) => Math.min(4, s + 1))}>
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={!!createdTrial}>
                {createdTrial ? "Created" : "Create Trial"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </Card>
  );
}
