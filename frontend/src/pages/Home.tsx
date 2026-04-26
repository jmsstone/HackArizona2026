import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, type ReportInput } from "@/lib/api";
import { SEVERITY_LEVELS, US_STATES } from "@/lib/states";

type Answer = "unset" | "yes" | "no";

export default function Home() {
  const [answer, setAnswer] = useState<Answer>("unset");
  const [zip, setZip] = useState("");
  const [state, setState] = useState<string>("");
  const [severity, setSeverity] = useState<string>("");
  const [errors, setErrors] = useState<{ zip?: string; state?: string; severity?: string }>({});
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: (input: ReportInput) => api.submitReport(input),
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Report submitted anonymously. Thank you.");
    },
    onError: (err: Error) => {
      toast.error("Could not submit report", { description: err.message });
    },
  });

  const validate = () => {
    const e: typeof errors = {};
    if (!/^\d{5}$/.test(zip)) e.zip = "Enter a 5-digit ZIP code";
    if (!state) e.state = "Select a state";
    if (!severity) e.severity = "Select a severity";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate({
      professional_diagnosis_of_influenza: true,
      zipcode: zip,
      state,
      severity_of_symptoms: severity as ReportInput["severity_of_symptoms"],
    });
  };

  const reset = () => {
    setAnswer("unset");
    setZip("");
    setState("");
    setSeverity("");
    setErrors({});
    setSubmitted(false);
  };

  return (
    <div className="container max-w-2xl py-10 md:py-16">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          100% anonymous • No account required
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
          Help detect outbreaks in your area
        </h1>
        <p className="mt-3 text-muted-foreground">
          FluWatch compares anonymous reports against CDC FluView baselines to surface emerging
          anomalies in real time.
        </p>
      </div>

      {submitted ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <CheckCircle2 className="h-12 w-12 text-risk-normal" />
            <div>
              <h2 className="text-xl font-semibold">Report received</h2>
              <p className="text-sm text-muted-foreground">
                Your anonymous report is now part of the local signal.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={reset}>
                Submit another
              </Button>
              <Button asChild>
                <Link to="/dashboard">View dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Have you been professionally diagnosed with an illness in the past month?
            </CardTitle>
            <CardDescription>
              Only diagnoses from a healthcare professional should be reported.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={answer === "yes" ? "default" : "outline"}
                onClick={() => setAnswer("yes")}
                className="flex-1"
              >
                Yes
              </Button>
              <Button
                type="button"
                variant={answer === "no" ? "default" : "outline"}
                onClick={() => setAnswer("no")}
                className="flex-1"
              >
                No
              </Button>
            </div>

            {answer === "no" && (
              <div className="rounded-md border border-border bg-muted/30 p-4 text-sm">
                <p>
                  Thanks for checking in. Want to see what's happening in your area?{" "}
                  <Link to="/dashboard" className="text-primary underline-offset-4 hover:underline">
                    Open the dashboard →
                  </Link>
                </p>
              </div>
            )}

            {answer === "yes" && (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP code</Label>
                  <Input
                    id="zip"
                    inputMode="numeric"
                    placeholder="e.g. 85719"
                    maxLength={5}
                    value={zip}
                    onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
                  />
                  {errors.zip && <p className="text-xs text-destructive">{errors.zip}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select value={state} onValueChange={setState}>
                    <SelectTrigger id="state">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="severity">Severity of symptoms</Label>
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger id="severity">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEVERITY_LEVELS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.severity && <p className="text-xs text-destructive">{errors.severity}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={mutation.isPending}>
                  {mutation.isPending ? "Submitting…" : "Submit anonymously"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
