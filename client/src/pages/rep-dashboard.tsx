import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { SubmitLeadBodySchema } from "@workspace/shared";
import { getGetLeadsQueryKey, getGetLeadStatsQueryKey, getGetMeQueryKey, getMyLeadsQueryKey, useGetMe, useGetMyLeads, useSubmitLead } from "@/api";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Phone, FileText, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import { queryClient } from "@/App";
import { SubmissionsTable } from "@/components/submissions-table";

const leadSchema = SubmitLeadBodySchema;

export default function RepDashboard() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: isCheckingAuth } = useGetMe({ query: { retry: false, queryKey: getGetMeQueryKey() } });
  const { data: mySubmissions, isLoading: isMySubmissionsLoading } = useGetMyLeads({
    query: { enabled: !!user, queryKey: getMyLeadsQueryKey() },
  });
  const submitLead = useSubmitLead();
  const [showSuccess, setShowSuccess] = useState(false);

  const form = useForm<z.infer<typeof leadSchema>>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      cxName: "",
      cxPhone: "",
      callSummary: "",
    },
  });

  useEffect(() => {
    if (!isCheckingAuth && !user) {
      setLocation("/");
    }
  }, [user, isCheckingAuth, setLocation]);

  const onSubmit = (values: z.infer<typeof leadSchema>) => {
    submitLead.mutate({ data: values }, {
      onSuccess: () => {
        form.reset();
        refreshSubmissionQueries();
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
      }
    });
  };

  if (isCheckingAuth || !user) {
    return <Layout><div className="flex-1 flex items-center justify-center">Loading...</div></Layout>;
  }

  return (
    <Layout>
      <div className="w-full max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome, {user.username}</h1>
            <p className="text-muted-foreground">Log your customer interactions below.</p>
          </div>
          {user.role === "admin" && (
            <Button variant="outline" onClick={() => setLocation("/admin")}>
              Admin Dashboard
            </Button>
          )}
        </div>

        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            >
              <Alert className="bg-emerald-500/10 border-emerald-500/30 text-emerald-500">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  Call successfully logged. Ready for the next one.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl shadow-primary/5">
          <CardHeader>
            <CardTitle>New Call Record</CardTitle>
            <CardDescription>Fill out the customer details and call outcome.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="cxName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <UserPlus className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Jane Doe" className="pl-10 bg-background/50" dir="auto" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cxPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Phone</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="+20 100 000 0000" className="pl-10 bg-background/50" dir="auto" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="callSummary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Call Summary</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Textarea 
                            placeholder="Detailed outcome of the conversation..." 
                            className="pl-10 min-h-[150px] bg-background/50 resize-y" 
                            dir="auto" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  size="lg"
                  className="w-full text-lg h-14 font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5" 
                  disabled={submitLead.isPending}
                >
                  {submitLead.isPending ? "Submitting..." : "Submit & Start New Call"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl shadow-primary/5 overflow-hidden">
          <CardHeader>
            <CardTitle>My submissions</CardTitle>
            <CardDescription>Review and update the calls you submitted.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <SubmissionsTable
              submissions={mySubmissions}
              isLoading={isMySubmissionsLoading}
              emptyMessage="You have not submitted any records yet."
              onUpdated={refreshSubmissionQueries}
            />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

function refreshSubmissionQueries() {
  queryClient.invalidateQueries({ queryKey: getMyLeadsQueryKey() });
  queryClient.invalidateQueries({ queryKey: getGetLeadsQueryKey() });
  queryClient.invalidateQueries({ queryKey: getGetLeadStatsQueryKey() });
}
