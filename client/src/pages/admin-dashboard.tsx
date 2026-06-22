import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useGetMe, useGetLeads, useGetLeadStats, getGetMeQueryKey, getGetLeadsQueryKey, getGetLeadStatsQueryKey } from "@/api";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Search, Users, Activity, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { queryClient } from "@/App";
import { SubmissionsTable } from "@/components/submissions-table";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: isCheckingAuth } = useGetMe({ query: { retry: false, queryKey: getGetMeQueryKey() } });
  
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [salesman, setSalesman] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!isCheckingAuth && (!user || user.role !== "admin")) {
      setLocation(user?.role === "rep" ? "/rep" : "/");
    }
  }, [user, isCheckingAuth, setLocation]);

  const { data: stats } = useGetLeadStats({ query: { enabled: !!user && user.role === "admin", queryKey: getGetLeadStatsQueryKey() } });

  const leadsParams = { 
    search: debouncedSearch || undefined, 
    salesman: salesman || undefined,
    date: date || undefined,
  };
  const { data: leads, isLoading: isLeadsLoading } = useGetLeads(
    leadsParams,
    { query: { enabled: !!user && user.role === "admin", queryKey: getGetLeadsQueryKey(leadsParams) } }
  );

  const statsBySalesman = useMemo(
    () => (Array.isArray(stats?.bySalesman) ? stats.bySalesman : []),
    [stats],
  );

  const chartData = useMemo(() => {
    return statsBySalesman.map(r => ({ name: r.salesman, calls: r.count }));
  }, [statsBySalesman]);

  const topPerformer = useMemo(
    () => [...statsBySalesman].sort((a, b) => b.count - a.count)[0],
    [statsBySalesman],
  );

  if (isCheckingAuth || !user) {
    return <Layout><div className="flex-1 flex items-center justify-center">Loading...</div></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-8 pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
            <p className="text-muted-foreground">Monitor your team's sales activity in real-time.</p>
          </div>
          <Button variant="outline" onClick={() => setLocation("/rep")}>
            Submit Record
          </Button>
        </div>

        {/* Stats & Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="flex flex-col gap-6"
          >
            <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Calls Logged</CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{stats?.total || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Across all active reps</p>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-md flex-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Top Performer</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                {topPerformer ? (
                  <>
                    <div className="text-2xl font-bold truncate">{topPerformer.salesman}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {topPerformer.count} calls
                    </p>
                  </>
                ) : (
                  <div className="text-lg text-muted-foreground">No data</div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="h-full bg-card/80 backdrop-blur-sm border-border/50 shadow-md">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Calls per Rep</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      />
                      <Bar dataKey="calls" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No statistics available
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters & Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-md overflow-hidden">
            <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-4 bg-muted/20">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search customer name or phone..." 
                  className="pl-9 bg-background/50 border-border/50"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                <Input 
                  placeholder="Filter by Rep" 
                  className="w-full sm:w-[150px] bg-background/50 border-border/50"
                  value={salesman}
                  onChange={(e) => setSalesman(e.target.value)}
                />
                <Input 
                  type="date"
                  className="w-full sm:w-[150px] bg-background/50 border-border/50 text-muted-foreground"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
                {(search || salesman || date) && (
                  <Button 
                    variant="ghost" 
                    onClick={() => { setSearch(""); setSalesman(""); setDate(""); }}
                    className="w-full sm:w-auto text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <SubmissionsTable
              submissions={leads}
              isLoading={isLeadsLoading}
              showSalesman
              emptyMessage="No records found matching your filters"
              onUpdated={refreshAdminQueries}
            />
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}

function refreshAdminQueries() {
  queryClient.invalidateQueries({ queryKey: getGetLeadsQueryKey() });
  queryClient.invalidateQueries({ queryKey: getGetLeadStatsQueryKey() });
}
