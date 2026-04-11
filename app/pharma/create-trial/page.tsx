import { TrialForm } from "@/components/trials/TrialForm";

/**
 * CreateTrialPage captures protocol details without patient data.
 */
export default function CreateTrialPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Create a new trial</h1>
      <TrialForm />
    </div>
  );
}
