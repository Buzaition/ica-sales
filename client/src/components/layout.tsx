import { ReactNode } from "react";
import { useLocation } from "wouter";
import { useLogout, useGetMe, getGetMeQueryKey } from "@/api";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { motion } from "framer-motion";
import icaLogo from "@assets/Screenshot_2026-04-30_161919-removebg-preview_1781845224281.png";
import { queryClient } from "@/App";

export function Layout({ children }: { children: ReactNode }) {
  const { data: user } = useGetMe({ query: { retry: false, queryKey: getGetMeQueryKey() } });
  const logout = useLogout();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        setLocation("/");
      },
    });
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans dark">
      <header className="w-full py-4 px-6 flex items-center justify-between relative border-b border-border/50 bg-card/40 backdrop-blur-md sticky top-0 z-50">
        <div className="flex-1 flex justify-start">
          {user && (
            <div className="hidden sm:block text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{user.username}</span>
              <span className="ml-2 uppercase text-[10px] tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {user.role}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex-1 flex justify-center">
          <img src={icaLogo} alt="ICA Academy" className="h-10 md:h-12 object-contain filter drop-shadow-md" />
        </div>
        
        <div className="flex-1 flex justify-end gap-2">
          {user && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setLocation("/rep")}
              >
                <span className="hidden sm:inline">Submit</span>
              </Button>
              {user.role === "admin" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setLocation("/admin")}
                >
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                onClick={handleLogout}
                disabled={logout.isPending}
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          )}
        </div>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col relative">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full h-full flex flex-col"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
